import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';


export async function deployCommands() {
  const commands = [];
  const commandsPath = path.resolve('../src/commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = await import(`../commands/${file}`);
    if (!command.data) continue;
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log(`Slash-команды задеплоены (${commands.length})`);
  } catch (err) {
    console.error('Ошибка деплоя команд:', err);
  }
}
