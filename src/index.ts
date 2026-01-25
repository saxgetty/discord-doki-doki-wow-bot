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

// Initial birthday data for auto-seeding
const INITIAL_BIRTHDAYS = [
  { discordId: '150711612423012363', month: 2, day: 16, timezone: 'America/Los_Angeles' },
  { discordId: '167108321428504586', month: 3, day: 9, timezone: 'America/Los_Angeles' },
  { discordId: '1016368688502411274', month: 1, day: 26, timezone: 'America/Chicago' },
  { discordId: '131191301864554496', month: 3, day: 26, timezone: 'America/Chicago' },
  { discordId: '208659800949653515', month: 3, day: 28, timezone: 'America/New_York' },
  { discordId: '209432863710380033', month: 3, day: 31, timezone: 'America/Chicago' },
  { discordId: '105034949786091520', month: 4, day: 7, timezone: 'America/Los_Angeles' },
  { discordId: '177933208682364928', month: 4, day: 13, timezone: 'America/Chicago' },
  { discordId: '111205906041098240', month: 4, day: 25, timezone: 'America/New_York' },
  { discordId: '273429846711992320', month: 5, day: 1, timezone: 'Europe/Paris' },
  { discordId: '219133210238517248', month: 5, day: 6, timezone: 'America/New_York' },
  { discordId: '189181827817144320', month: 5, day: 11, timezone: 'America/Chicago' },
  { discordId: '320722539322015744', month: 5, day: 12, timezone: 'America/New_York' },
  { discordId: '231089147958263821', month: 5, day: 19, timezone: 'Europe/London' },
  { discordId: '125506981338415104', month: 7, day: 25, timezone: 'America/New_York' },
  { discordId: '127622649290555393', month: 8, day: 9, timezone: 'America/Denver' },
  { discordId: '254058668717375494', month: 8, day: 18, timezone: 'America/Chicago' },
  { discordId: '216835764951056384', month: 9, day: 10, timezone: 'America/Los_Angeles' },
  { discordId: '1141916630750875800', month: 9, day: 18, timezone: 'America/Chicago' },
  { discordId: '249987402708287508', month: 9, day: 21, timezone: 'America/New_York' },
  { discordId: '165130833798234112', month: 10, day: 7, timezone: 'America/New_York' },
  { discordId: '131191338556194817', month: 10, day: 9, timezone: 'America/Chicago' },
  { discordId: '114084392757886984', month: 10, day: 14, timezone: 'America/New_York' },
  { discordId: '127201675718033409', month: 11, day: 7, timezone: 'America/New_York' },
  { discordId: '930623358507302922', month: 11, day: 8, timezone: 'America/New_York' },
  { discordId: '234551124860862464', month: 11, day: 10, timezone: 'America/Chicago' },
  { discordId: '230091781268701194', month: 11, day: 19, timezone: 'America/Los_Angeles' },
  { discordId: '267494088016658433', month: 11, day: 29, timezone: 'America/Los_Angeles' },
  { discordId: '163130061879377921', month: 12, day: 21, timezone: 'America/New_York' },
];

// Auto-seed birthdays if table is empty
async function seedBirthdaysIfEmpty(): Promise<void> {
  const count = await prisma.birthday.count();
  if (count > 0) {
    console.log(`🎂 Found ${count} birthdays in database`);
    return;
  }
  console.log('🌱 Seeding birthdays...');
  for (const b of INITIAL_BIRTHDAYS) {
    await prisma.birthday.create({ data: b });
  }
  console.log(`🎂 Seeded ${INITIAL_BIRTHDAYS.length} birthdays`);
}

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

    // Auto-seed birthdays if empty
    await seedBirthdaysIfEmpty();

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

