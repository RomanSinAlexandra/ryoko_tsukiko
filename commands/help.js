import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Подсказки по командам');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎵 Команды бота')
    .setColor(0x5865F2)
    .setDescription('Вот список доступных команд:')
    .addFields(
      { name: 'Музыкальные', value: `
**/join** — присоединить бота
**/leave** — выйти из канала
**/play** — воспроизвести музыку
**/pause** — пауза
**/resume** — продолжить
**/stop** — остановить
**/skip** — пропустить трек
**/queue** — показать очередь
**/radio** — включить радио
**/radiolist** — список радиостанций
      ` },
      { name: 'Развлечения', value: `
**/neko** — получить арт
**/r34** — получить NSFW арт
**/ryoko** — получить Рьоко
      ` }
    )
    .setFooter({ text: 'Используйте команды через слеш "/" для работы бота' });

  await interaction.reply({ 
    embeds: [embed], 
    flags: MessageFlags.Ephemeral
  });
}
