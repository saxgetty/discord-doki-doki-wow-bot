import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const tokenEnv = process.env.DISCORD_TOKEN;
const clientIdEnv = process.env.DISCORD_CLIENT_ID;
const guildIdEnv = process.env.DISCORD_GUILD_ID;

if (!tokenEnv || !clientIdEnv || !guildIdEnv) {
  console.error('❌ Missing required environment variables:');
  if (!tokenEnv) console.error('   - DISCORD_TOKEN');
  if (!clientIdEnv) console.error('   - DISCORD_CLIENT_ID');
  if (!guildIdEnv) console.error('   - DISCORD_GUILD_ID');
  process.exit(1);
}

// These are guaranteed to be defined after the check above
const token: string = tokenEnv;
const clientId: string = clientIdEnv;
const guildId: string = guildIdEnv;

async function registerCommands(): Promise<void> {
  const commands: object[] = [];

  // Load all command files
  const commandsPath = path.join(__dirname, '..', 'commands');
  // Only load .ts files in development (ts-node), .js files in production
  const commandFiles = fs.readdirSync(commandsPath).filter(file => {
    // In development with ts-node, __dirname points to src/utils, so we want .ts files
    // In production, compiled .js files will be in dist/
    if (__dirname.includes('dist')) {
      return file.endsWith('.js') && !file.endsWith('.d.ts');
    }
    return file.endsWith('.ts');
  });

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(filePath);
      
      if ('data' in command && 'toJSON' in command.data) {
        commands.push(command.data.toJSON());
        console.log(`📝 Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Command at ${filePath} is missing required "data" export with toJSON method.`);
      }
    } catch (error) {
      console.error(`❌ Failed to load command at ${filePath}:`, error);
    }
  }

  // Create REST instance
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`\n🔄 Started refreshing ${commands.length} application (/) commands...`);

    // Register commands to the specific guild
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    ) as object[];

    console.log(`✅ Successfully registered ${data.length} application (/) commands!`);
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    process.exit(1);
  }
}

registerCommands();

