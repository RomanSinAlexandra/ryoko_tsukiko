import {
  joinVoiceChannel,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} from '@discordjs/voice';

import { getGuildData } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { playNext } from '../state/playNext.js';

import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
// Для извлечения треков из YouTube-плейлистов используем сам yt-dlp
import ytDlp from 'yt-dlp-exec'; 

const spotify = spotifyUrlInfo(fetch);

export const name = 'play';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Музыка? Ммм… Назови её, и я заставлю её звучать так, как ты любишь.')
  .addStringOption(option =>
    option
      .setName('query')
      .setDescription('Давай, кидай ссылку или просто скажи название… я вся внимание.')
      .setRequired(true)
  );

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const guildData = getGuildData(guildId);

  cancelAutoLeave(guildId); 

  const query = interaction.options.getString('query'); 
  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel){
    const msg = await interaction.reply('Без тебя в голосовом так пусто… заходи, пока я не заскучала по-настоящему.');
    autoDelete(msg);
    return;
  }

  let connection = getVoiceConnection(guildId);
  
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });
    
    connection.subscribe(guildData.player);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 1000),
                entersState(connection, VoiceConnectionStatus.Connecting, 1000),
            ]);
        } catch (e) {
            console.log(`🚪 Рёко покинула канал на сервере ${guildId}.`);
            guildData.mode = 'idle';
            guildData.queue.length = 0;
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        }
    });
  }

  if (guildData.mode === 'radio') {
    const msg = await interaction.reply('Радио мешает… Хочешь, чтобы я звучала только для тебя? Тогда /stop.');
    autoDelete(msg);
    return;
  }

  // --- 1. ОБРАБОТКА SPOTIFY ---
  const isSpotify = /https?:\/\/(open|play)\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/.test(query);

  if (isSpotify) {
    try {
      await interaction.deferReply();
      const spotifyData = await spotify.getData(query);
      let searchQuery = query;
      
      if (spotifyData.type === 'track') {
        const artistName = spotifyData.artists?.[0]?.name || spotifyData.artist || 'Unknown Artist';
        searchQuery = `${artistName} - ${spotifyData.name}`;
        guildData.queue.push({ query: searchQuery, interaction });
      } 
      else if (spotifyData.tracks?.items || spotifyData.tracks) {
        const tracks = spotifyData.tracks.items || spotifyData.tracks;
        for (const item of tracks) {
          const track = item.track || item; 
          const artistName = track.artists?.[0]?.name || 'Unknown Artist';
          guildData.queue.push({ query: `${artistName} - ${track.name}`, interaction });
        }
        searchQuery = `Сборник Spotify: ${spotifyData.name} (${tracks.length} треков)`;
      } else {
        throw new Error('Unsupported Spotify type');
      }

      guildData.mode = 'music';
      const msg = await interaction.editReply(`Твои музыкальные вкусы… интригуют. Добавила в очередь: **${searchQuery}**`);
      autoDelete(msg);

      if (guildData.player.state.status !== AudioPlayerStatus.Playing) {
        playNext(guildId);
      }
      return; 
    } catch (e) {
      console.error('Ошибка парсинга Spotify:', e);
      const msg = await interaction.editReply({ content: 'Spotify-ссылка не поддалась… Возможно, она приватная.' });
      autoDelete(msg);
      return;
    }
  }

  // --- 2. ОБРАБОТКА YOUTUBE ПЛЕЙЛИСТОВ ---
  const isYoutubePlaylist = query.includes('list=');

  if (isYoutubePlaylist) {
    try {
      // Парсинг большого плейлиста может занять время, резервируем ответ
      await interaction.deferReply();

      // Вызываем yt-dlp с флагом dumpSingleJson и flatPlaylist, чтобы не скачивать видео, а получить только инфо
      const playlistInfo = await ytDlp(query, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noWarnings: true,
      });

      if (playlistInfo && playlistInfo.entries && playlistInfo.entries.length > 0) {
        const tracks = playlistInfo.entries;

        for (const entry of tracks) {
          // Проверяем, что видео не удалено и имеет название
          if (entry.title && entry.title !== '[Deleted video]' && entry.title !== '[Private video]') {
            guildData.queue.push({ query: entry.title, interaction });
          }
        }

        guildData.mode = 'music';
        const msg = await interaction.editReply(`Ух ты, целый список... Развернула плейлист **${playlistInfo.title || 'YouTube'}**, добавлено треков: **${tracks.length}**.`);
        autoDelete(msg);

        if (guildData.player.state.status !== AudioPlayerStatus.Playing) {
          playNext(guildId);
        }
      } else {
        throw new Error('Playlist entries are empty');
      }
      return;
    } catch (e) {
      console.error('Ошибка парсинга плейлиста YouTube:', e);
      const msg = await interaction.editReply({ content: 'Не удалось прочитать этот YouTube плейлист. Проверь, открытый ли он.' });
      autoDelete(msg);
      return;
    }
  }

  guildData.queue.push({ query: query, interaction });
  guildData.mode = 'music';

  const msg = await interaction.reply(`Твоя песня встала в очередь… как и ты — в мои мысли: **${query}**`);
  autoDelete(msg);

  if (guildData.player.state.status !== AudioPlayerStatus.Playing) {
    playNext(guildId);
  }
}