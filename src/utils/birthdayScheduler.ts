import * as cron from 'node-cron';
import { Client, TextChannel, GuildMember } from 'discord.js';
import { PrismaClient } from '@prisma/client';

// Channel ID for birthday announcements (from env)
const BIRTHDAY_CHANNEL_ID = process.env.BIRTHDAY_CHANNEL_ID || '';

// Role ID for birthday users (from env)
const BIRTHDAY_ROLE_ID = process.env.BIRTHDAY_ROLE_ID || '';

// Hour to post birthday wishes (in user's local timezone)
const BIRTHDAY_HOUR = 0; // 12 AM (midnight) - posts the moment their birthday starts

/**
 * Get the current date/time in a specific timezone
 */
function getDateInTimezone(timezone: string): { month: number; day: number; hour: number; year: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');

  return { month, day, hour, year };
}

/**
 * Check and post birthday wishes
 */
export async function checkBirthdays(client: Client, prisma: PrismaClient): Promise<void> {
  try {
    // Get the birthday channel
    const channel = await client.channels.fetch(BIRTHDAY_CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('❌ Birthday channel not found or is not a text channel');
      return;
    }

    // Get all birthdays
    const birthdays = await prisma.birthday.findMany();

    for (const birthday of birthdays) {
      try {
        const { month, day, hour, year } = getDateInTimezone(birthday.timezone);

        // Check if it's their birthday and it's the posting hour (or later, but we haven't wished yet)
        const isBirthday = birthday.month === month && birthday.day === day;
        const isPastPostingHour = hour >= BIRTHDAY_HOUR;
        const alreadyWishedThisYear = birthday.lastWishedYear === year;

        if (isBirthday && isPastPostingHour && !alreadyWishedThisYear) {
          // Try to find the user in any of the bot's guilds
          let userFound = false;

          for (const guild of client.guilds.cache.values()) {
            try {
              const member = await guild.members.fetch(birthday.discordId);
              if (member) {
                userFound = true;
                break;
              }
            } catch {
              // User not in this guild, continue checking
            }
          }

          if (userFound) {
            // Post birthday message
            const messages = [
              `🎂 Happy Birthday <@${birthday.discordId}>! You're not old, you're just well-seasoned!`,
              `🎈 <@${birthday.discordId}> has leveled up IRL! +1 year, +10 wisdom, -5 metabolism`,
              `🎉 Happy Birthday <@${birthday.discordId}>! You're officially vintage now 🍷`,
              `✨ <@${birthday.discordId}> just hit a new personal record for staying alive! Congrats! 🏆`,
              `🎂 Happy Birthday <@${birthday.discordId}>! Don't worry, you don't look a day over whatever age makes you feel good`,
              `🎊 <@${birthday.discordId}> spawned into this world on this day! /played is getting concerning...`,
              `🎈 It's <@${birthday.discordId}>'s birthday! May your repair bills be low and your parses be high! ⚔️`,
              `🎂 <@${birthday.discordId}> is another year closer to becoming a raid boss! Happy Birthday!`,
              `🎉 Happy Birthday <@${birthday.discordId}>! You've unlocked the achievement: [Survived Another Year]`,
              `✨ <@${birthday.discordId}> has entered the chat... a year older! Happy Birthday!`,
              `🥳 Happy Birthday <@${birthday.discordId}>! Remember: age is just a number... a really big number`,
              `🎊 Ding! <@${birthday.discordId}> leveled up to Year ${new Date().getFullYear() - 1900}! (jk we don't know your age)`,
              `🎂 Happy Birthday <@${birthday.discordId}>! May your pulls be legendary and your wipes be few! 🐉`,
              `🎈 <@${birthday.discordId}> has been alive for another revolution around the sun! Achievement unlocked! 🌍`,
              `🥳 Happy Birthday <@${birthday.discordId}>! You're not getting older, you're increasing in value!`,
              `🎉 <@${birthday.discordId}> popped out of the character creation screen on this day! Happy Birthday!`,
              `✨ Happy Birthday <@${birthday.discordId}>! Time to eat cake and pretend calories don't exist! 🍰`,
              `🎂 <@${birthday.discordId}> is celebrating their annual respawn day! Happy Birthday!`,
              `🥳 <@${birthday.discordId}>'s mom completed a mythic+ delivery on this day! Happy Birthday! 👶`,
              `🎊 Happy Birthday <@${birthday.discordId}>! The loot gods smile upon you today... probably 🎰`,
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            await channel.send(randomMessage);
            console.log(`🎂 Sent birthday wish to user ${birthday.discordId}`);

            // Add birthday role if configured
            if (BIRTHDAY_ROLE_ID) {
              for (const guild of client.guilds.cache.values()) {
                try {
                  const member = await guild.members.fetch(birthday.discordId);
                  if (member && !member.roles.cache.has(BIRTHDAY_ROLE_ID)) {
                    await member.roles.add(BIRTHDAY_ROLE_ID);
                    console.log(`🎀 Added birthday role to ${birthday.discordId}`);
                  }
                } catch (error) {
                  console.error(`❌ Failed to add birthday role to ${birthday.discordId} in guild ${guild.id}:`, error);
                }
              }
            }

            // Update lastWishedYear
            await prisma.birthday.update({
              where: { id: birthday.id },
              data: { lastWishedYear: year },
            });
          } else {
            console.log(`⚠️ Skipping birthday for ${birthday.discordId} - user not found in any guild`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing birthday for ${birthday.discordId}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error checking birthdays:', error);
  }

  // Remove birthday role from users whose birthday is over
  await removeBirthdayRoles(client, prisma);
}

/**
 * Remove birthday role from users whose birthday has ended
 */
async function removeBirthdayRoles(client: Client, prisma: PrismaClient): Promise<void> {
  if (!BIRTHDAY_ROLE_ID) return;

  try {
    // Get all birthdays
    const birthdays = await prisma.birthday.findMany();

    for (const guild of client.guilds.cache.values()) {
      try {
        // Get members who have the birthday role
        const role = guild.roles.cache.get(BIRTHDAY_ROLE_ID);
        if (!role) continue;

        // Fetch members with the birthday role
        const membersWithRole = role.members;

        for (const [memberId, member] of membersWithRole) {
          // Find this user's birthday record
          const birthday = birthdays.find(b => b.discordId === memberId);
          
          if (!birthday) {
            // User has role but no birthday record - remove role
            await member.roles.remove(BIRTHDAY_ROLE_ID);
            console.log(`🎀 Removed birthday role from ${memberId} (no birthday record)`);
            continue;
          }

          // Check if it's still their birthday in their timezone
          const { month, day } = getDateInTimezone(birthday.timezone);
          const isStillBirthday = birthday.month === month && birthday.day === day;

          if (!isStillBirthday) {
            await member.roles.remove(BIRTHDAY_ROLE_ID);
            console.log(`🎀 Removed birthday role from ${memberId} (birthday over)`);
          }
        }
      } catch (error) {
        console.error(`❌ Error removing birthday roles in guild ${guild.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error removing birthday roles:', error);
  }
}

/**
 * Start the birthday scheduler
 * Runs every hour to check for birthdays
 */
export function startBirthdayScheduler(client: Client, prisma: PrismaClient): void {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 Checking for birthdays...');
    await checkBirthdays(client, prisma);
  });

  console.log('🎂 Birthday scheduler started (checks every hour)');

  // Also run immediately on startup to catch any missed birthdays
  setTimeout(async () => {
    console.log('🔍 Running initial birthday check...');
    await checkBirthdays(client, prisma);
  }, 5000); // Wait 5 seconds for bot to fully initialize
}
