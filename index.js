import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from './helpers/deploy-commands.js';
import { handleAutocomplete } from './helpers/autocomplete.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once('clientReady', async () => {
  console.log(`${client.user.tag}. Noblesse Oblige, I pray that you will continue to be a saviour.`);

  await deployCommands();
});

client.on('interactionCreate', async interaction => {
    
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'anime') {
      return animeAutocomplete(interaction);
    }
  }

  if (interaction.isAutocomplete()) {
    return handleAutocomplete(interaction);
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Ошибка при выполнении команды', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
