import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initial birthday data
// Timezones: America/Los_Angeles (PST), America/Chicago (CST), America/New_York (EST), 
//            America/Denver (MST/Utah), Europe/Paris (France), Europe/London (Britain)
const birthdays = [
  { discordId: '150711612423012363', month: 2, day: 16, timezone: 'America/Los_Angeles' }, // Feb 16 - PST
  { discordId: '167108321428504586', month: 3, day: 9, timezone: 'America/Los_Angeles' },  // Mar 9 - PST (you)
  { discordId: '1016368688502411274', month: 1, day: 26, timezone: 'America/Chicago' },    // Jan 26 - CST
  { discordId: '131191301864554496', month: 3, day: 26, timezone: 'America/Chicago' },     // Mar 26 - CST
  { discordId: '208659800949653515', month: 3, day: 28, timezone: 'America/New_York' },    // Mar 28 - EST
  { discordId: '209432863710380033', month: 3, day: 31, timezone: 'America/Chicago' },     // Mar 31 - CST
  { discordId: '105034949786091520', month: 4, day: 7, timezone: 'America/Los_Angeles' },  // Apr 7 - PST
  { discordId: '177933208682364928', month: 4, day: 13, timezone: 'America/Chicago' },     // Apr 13 - CST
  { discordId: '111205906041098240', month: 4, day: 25, timezone: 'America/New_York' },    // Apr 25 - EST
  { discordId: '273429846711992320', month: 5, day: 1, timezone: 'Europe/Paris' },         // May 1 - France
  { discordId: '219133210238517248', month: 5, day: 6, timezone: 'America/New_York' },     // May 6 - EST
  { discordId: '189181827817144320', month: 5, day: 11, timezone: 'America/Chicago' },     // May 11 - CST
  { discordId: '320722539322015744', month: 5, day: 12, timezone: 'America/New_York' },    // May 12 - EST
  { discordId: '231089147958263821', month: 5, day: 19, timezone: 'Europe/London' },       // May 19 - Britain
  { discordId: '125506981338415104', month: 7, day: 25, timezone: 'America/New_York' },    // Jul 25 - EST
  { discordId: '127622649290555393', month: 8, day: 9, timezone: 'America/Denver' },       // Aug 9 - Utah (MST)
  { discordId: '254058668717375494', month: 8, day: 18, timezone: 'America/Chicago' },     // Aug 18 - CST
  { discordId: '216835764951056384', month: 9, day: 10, timezone: 'America/Los_Angeles' }, // Sep 10 - PST
  { discordId: '1141916630750875800', month: 9, day: 18, timezone: 'America/Chicago' },    // Sep 18 - CST
  { discordId: '249987402708287508', month: 9, day: 21, timezone: 'America/New_York' },    // Sep 21 - EST
  { discordId: '165130833798234112', month: 10, day: 7, timezone: 'America/New_York' },    // Oct 7 - EST
  { discordId: '131191338556194817', month: 10, day: 9, timezone: 'America/Chicago' },     // Oct 9 - CST
  { discordId: '114084392757886984', month: 10, day: 14, timezone: 'America/New_York' },   // Oct 14 - EST
  { discordId: '127201675718033409', month: 11, day: 7, timezone: 'America/New_York' },    // Nov 7 - EST
  { discordId: '930623358507302922', month: 11, day: 8, timezone: 'America/New_York' },    // Nov 8 - EST
  { discordId: '234551124860862464', month: 11, day: 10, timezone: 'America/Chicago' },    // Nov 10 - CST
  { discordId: '230091781268701194', month: 11, day: 19, timezone: 'America/Los_Angeles' },// Nov 19 - PST
  { discordId: '267494088016658433', month: 11, day: 29, timezone: 'America/Los_Angeles' },// Nov 29 - PST
  { discordId: '163130061879377921', month: 12, day: 21, timezone: 'America/New_York' },   // Dec 21 - EST
];

async function seed() {
  console.log('🌱 Seeding birthdays...');

  // Check for duplicate IDs in the seed data
  const ids = birthdays.map(b => b.discordId);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  if (duplicates.length > 0) {
    console.error('❌ Duplicate Discord IDs found in seed data:', duplicates);
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;

  for (const birthday of birthdays) {
    try {
      // Check if already exists
      const existing = await prisma.birthday.findUnique({
        where: { discordId: birthday.discordId },
      });

      if (existing) {
        console.log(`⏭️ Skipping ${birthday.discordId} - already exists`);
        skipped++;
        continue;
      }

      await prisma.birthday.create({
        data: birthday,
      });
      console.log(`✅ Added birthday: ${birthday.discordId} - ${birthday.month}/${birthday.day}`);
      added++;
    } catch (error) {
      console.error(`❌ Failed to add ${birthday.discordId}:`, error);
    }
  }

  console.log(`\n🎂 Seeding complete! Added: ${added}, Skipped: ${skipped}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
