# ARC Raiders Discord Bot 🎮

A Discord bot for ARC Raiders that provides news, patch updates, and weapon attachment suggestions.

## Features

- 📰 **News** - Get the latest ARC Raiders news and announcements
- 🔧 **Patches** - View recent patch notes and game updates
- 🔫 **Loadout** - Get weapon attachment recommendations for all weapon categories
- 💡 **Tips** - Random gameplay and attachment tips

## Commands

| Command | Description |
|---------|-------------|
| `/news` | Get the latest ARC Raiders news |
| `/patches` | View recent patch notes |
| `/loadout [category]` | Get weapon attachment suggestions |
| `/tips [type]` | Get random tips (gameplay/attachments/all) |
| `/help` | Show all available commands |

## Setup

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the **Bot Token** (keep this secret!)
5. Under "Privileged Gateway Intents", enable:
   - Message Content Intent
6. Go to "OAuth2" > "URL Generator"
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
7. Copy the generated URL and invite the bot to your server

### 2. Configure the Bot

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_client_id_here
   GUILD_ID=your_server_id_here  # Optional, for faster testing
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Commands

```bash
npm run deploy-commands
```

### 5. Start the Bot

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Project Structure

```
arc-raiders-bot/
├── src/
│   ├── commands/
│   │   ├── help.js
│   │   ├── loadout.js
│   │   ├── news.js
│   │   ├── patches.js
│   │   └── tips.js
│   ├── data/
│   │   ├── news.js
│   │   └── weapons.js
│   ├── deploy-commands.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Customizing Data

### Adding News
Edit `src/data/news.js` to add new news items:

```javascript
{
    title: "Your News Title",
    date: "2024",
    description: "News description here",
    url: "https://link-to-source.com"
}
```

### Adding Weapons/Attachments
Edit `src/data/weapons.js` to add or modify weapon recommendations.

## License

MIT
