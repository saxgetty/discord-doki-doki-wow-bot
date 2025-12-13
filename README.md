# 💰 Discord Ledger Bot

A friendly Discord bot for tracking consumable reimbursement ledger entries for World of Warcraft guilds! Built with Node.js, TypeScript, discord.js v14, and Prisma with SQLite.

> 💡 **Made with Cursor Composer 1**

## ✨ Features

- **`/ledger add`** - Add a new consumable reimbursement entry 📝
- **`/ledger my`** - View your unpaid ledger entries 👀
- **`/ledger all`** - View all unpaid entries grouped by raider (Officer only) 📊
- **`/ledger pay`** - Mark an entry as paid (Officer only) ✅

## 🎯 Role Permissions

- **Consumables Role** - Can add entries and view their own entries (`/ledger add`, `/ledger my`, `/ledger all`)
- **Officer Role** - Full access to all commands including marking entries as paid

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later LTS recommended)
- npm or yarn
- A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd discord-ledger-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_GUILD_ID=your_guild_id_here
   ```

4. **Initialize the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Register slash commands**
   ```bash
   npm run register
   ```

6. **Start the bot**
   
   Development mode (with hot reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

## 📖 Command Reference

### `/ledger add`
Add a new consumable reimbursement entry.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| item | string | ✅ | Name of the item |
| gold | integer | ✅ | Gold spent (minimum: 0) |

### `/ledger my`
View your own unpaid ledger entries with total gold owed.

### `/ledger all`
*Officer only* - View all unpaid entries grouped by raider name.

### `/ledger pay`
*Officer only* - Mark a ledger entry as paid.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| id | integer | ✅ | The entry ID to mark as paid |

## 📁 Project Structure

```
discord-ledger-bot/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── commands/
│   │   └── ledger.ts      # All ledger subcommands
│   ├── utils/
│   │   └── registerCommands.ts  # Slash command registration
│   └── index.ts           # Bot entry point
├── .env                   # Environment variables (not in repo)
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run bot in development mode with hot reload 🔥 |
| `npm run build` | Compile TypeScript to JavaScript 📦 |
| `npm start` | Run compiled bot (production) 🚀 |
| `npm run register` | Register slash commands to Discord 📝 |

## 💾 Database Management

**View database in Prisma Studio:**
```bash
npx prisma studio
```

**Reset database:**
```bash
npx prisma migrate reset
```

**Create a new migration after schema changes:**
```bash
npx prisma migrate dev --name your_migration_name
```

## ☁️ Railway Deployment

To deploy on Railway:

1. **Create a new project** on [Railway](https://railway.app/)

2. **Connect your GitHub repository**

3. **Add environment variables:**
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID` (your Discord server/guild ID)
   - `DATABASE_URL` (set to `file:/app/data/ledger.db` for persistent storage)

4. **⚠️ CRITICAL: Add a persistent volume (REQUIRED for data persistence):**
   - Go to your service settings → Volumes
   - Click "Add Volume"
   - Mount path: `/app/data`
   - **Without this volume, your database will be LOST on every restart/redeploy!**

5. **Set the start command:**
   ```bash
   npx prisma migrate deploy && npm start
   ```

6. **Deploy!** 🎉

### ⚠️ Data Persistence Warning

**Without a persistent volume, your data will be lost when:**
- The bot restarts
- You redeploy
- Railway restarts your service
- The container is recreated

**Always use a persistent volume for production deployments!**

## 🐛 Troubleshooting

### Commands not showing up?
- Make sure you ran `npm run register`
- Check that `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` are correct
- Commands may take a few minutes to propagate

### Bot not responding?
- Verify `DISCORD_TOKEN` is correct
- Ensure the bot has proper permissions in your server
- Check the console for error messages

### Permission errors?
- Verify your Discord user has the correct role (Consumables or Officer)
- Check that role IDs match your server configuration

## 🚀 Pushing to GitHub

Ready to share your bot with the world? Here's how to push it to GitHub:

### Initial Setup

1. **Create a new repository on GitHub**
   - Go to [GitHub](https://github.com) and click "New repository"
   - Name it `discord-ledger-bot` (or whatever you prefer)
   - Choose Public or Private
   - **Don't** initialize with README, .gitignore, or license (we already have these)

2. **Initialize git (if not already done)**
   ```bash
   git init
   ```

3. **Add all files**
   ```bash
   git add .
   ```

4. **Make your first commit**
   ```bash
   git commit -m "Initial commit: Discord Ledger Bot"
   ```

5. **Connect to your GitHub repository**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/discord-ledger-bot.git
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

6. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

### ⚠️ Security Checklist

Before pushing, make sure:
- ✅ `.env` file is in `.gitignore` (it is!)
- ✅ No secrets are hardcoded in the code (they're all in environment variables)
- ✅ Database files (`*.db`) are ignored (they are!)
- ✅ `node_modules/` is ignored (it is!)

### Environment Variables Template

Create a `.env.example` file (optional but recommended):
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
DATABASE_URL="file:./prisma/dev.db"
```

This helps others know what environment variables they need without exposing your secrets!

## 📝 License

MIT License - feel free to use this project however you'd like! 😊

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

Made with ❤️ and Cursor Composer 1
