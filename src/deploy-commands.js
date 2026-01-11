const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Refreshing ${commands.length} application (/) commands...`);

        if (process.env.GUILD_ID) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: commands }
                );
                console.log('✅ Commands registered for guild (instant update)');
            } catch (e) {
                console.log('⚠️ Guild deploy failed, falling back to global...');
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands }
                );
                console.log('✅ Commands registered globally!');
                console.log('⏰ Note: Global commands may take up to 1 hour to appear in Discord');
            }
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Commands registered globally!');
            console.log('⏰ Note: Global commands may take up to 1 hour to appear in Discord');
        }
        
    } catch (error) {
        console.error('❌ Failed to deploy commands:', error.message);
    }
})();
