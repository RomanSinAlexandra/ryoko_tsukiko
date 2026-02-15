import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from './helpers/deploy-commands.js';
import { handleAutocomplete } from './helpers/autocomplete.js';
import * as waifuart from './commands/waifu.js';
import { autoDelete } from './helpers/autoDelete.js';

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
client.commands.set('waifuart', waifuart);


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
    
  try {
    if (interaction.isAutocomplete()) {
      return handleAutocomplete(interaction, client);
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        const msg = await interaction.reply({ content: 'Ошибка при выполнении команды', ephemeral: true });
        autoDelete(msg);
      }
    }
    }catch (error) {
      if (error?.code === 10062) return;

    console.error('Interaction error:', error);

    if (interaction.isRepliable()) {
      try {
        if (interaction.deferred || interaction.replied) {
          const msg = await interaction.editReply('Произошла ошибка');
          autoDelete(msg);
        } else {
          const msg = await interaction.reply({
            content: 'Произошла ошибка',
            ephemeral: true
          });
          autoDelete(msg);
        }
      } catch {
        
      }
    }
    }
  });

client.login(process.env.TOKEN);
