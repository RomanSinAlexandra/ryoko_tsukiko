import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { AnimeNewsConfig } from '../models/AnimeNewsConfig.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { scheduleGuild, disableGuild } from '../services/animeNewsScheduler.js';

export const data = new SlashCommandBuilder()
  .setName('animenews')
  .setDescription('Хочешь, чтобы я каждый день присылала тебе свежие аниме-новости?')
  .addSubcommand(sub =>
    sub.setName('setup')
      .setDescription('Теперь каждое утро (или когда захочешь) я буду приносить тебе самое интересное из мира аниме.')
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('Укажи канал, куда мне присылать новости')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
      .addIntegerOption(opt =>
        opt.setName('hour').setDescription('Час (0–23) (Время по Гринвичу (GMT +0))').setMinValue(0).setMaxValue(23).setRequired(true)
      )
      .addIntegerOption(opt =>
        opt.setName('minute').setDescription('Минута (0–59)').setMinValue(0).setMaxValue(59).setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('disable')
      .setDescription('Автопост отключён… \nГрустно, но я понимаю.')
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'setup') {
    const channel = interaction.options.getChannel('channel');
    const hour = interaction.options.getInteger('hour');
    const minute = interaction.options.getInteger('minute') ?? 0;

    const cfg = await AnimeNewsConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        guildId: interaction.guildId,
        channelId: channel.id,
        hour,
        minute,
        enabled: true
      },
      { upsert: true, new: true }
    );

    scheduleGuild(interaction.client, cfg); 

    await AnimeNewsConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        guildId: interaction.guildId,
        channelId: channel.id,
        hour,
        minute,
        enabled: true
      },
      { upsert: true }
    );

    const msg = await interaction.reply({
      content:
        `✅ Автопост включён\n` +
        `📢 Канал: ${channel}\n` +
        `⏰ Время: ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
      ephemeral: true
    });

    autoDelete(msg);
  }

  if (sub === 'disable') {
    await AnimeNewsConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { enabled: false }
    );
    await AnimeNewsConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { enabled: false }
    );

    disableGuild(interaction.guildId); 
    const msg = await interaction.reply({
      content: '🛑 Автопост новостей отключён',
      ephemeral: true
    });

    autoDelete(msg);
  }
}
