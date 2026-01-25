import { Client, Collection, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { startBirthdayScheduler } from './utils/birthdayScheduler';

// Load environment variables
dotenv.config();

// Extend the Client type to include commands collection
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

// Command interface
export interface Command {
  data: {
    name: string;
    toJSON(): object;
  };
  execute(interaction: Interaction, prisma: PrismaClient): Promise<void>;
}

// Initialize Prisma client
export const prisma = new PrismaClient();

// Officer role IDs for restricted commands
export const OFFICER_ROLE_IDS: string[] = process.env.OFFICER_ROLE_IDS
  ? process.env.OFFICER_ROLE_IDS.split(',').map(id => id.trim())
  : [];

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Initialize commands collection
client.commands = new Collection<string, Command>();

// Load all command files
async function loadCommands(): Promise<void> {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.ts') || file.endsWith('.js')
  );

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command as Command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Command at ${filePath} is missing required "data" or "execute" export.`);
      }
    } catch (error) {
      console.error(`❌ Failed to load command at ${filePath}:`, error);
    }
  }
}

// Handle interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, prisma);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ There was an error while executing this command!',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} guild(s)`);
  
  // Start the birthday scheduler
  startBirthdayScheduler(client, prisma);
});

// Main startup function
async function main(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('📦 Connected to database');

    // Load commands
    await loadCommands();

    // Login to Discord
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN is not set in environment variables');
    }

    await client.login(token);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

// Start the bot
main();

