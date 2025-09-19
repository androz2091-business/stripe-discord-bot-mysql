"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
require("./sentry");
const database_1 = require("./database");
const commands_1 = require("./handlers/commands");
const sheets_1 = require("./integrations/sheets");
const discord_js_1 = require("discord.js");
const tasks_1 = require("./handlers/tasks");
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.IntentsBitField.Flags.Guilds,
        discord_js_1.IntentsBitField.Flags.GuildMessages,
        discord_js_1.IntentsBitField.Flags.GuildMembers
    ]
});
const { slashCommands, slashCommandsData } = (0, commands_1.loadSlashCommands)(exports.client);
const { contextMenus, contextMenusData } = (0, commands_1.loadContextMenus)(exports.client);
const messageCommands = (0, commands_1.loadMessageCommands)(exports.client);
const tasks = (0, tasks_1.loadTasks)(exports.client);
(0, commands_1.synchronizeSlashCommands)(exports.client, [...slashCommandsData, ...contextMenusData], {
    debug: true,
    guildId: process.env.GUILD_ID
});
exports.client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const isContext = interaction.isContextMenuCommand();
        if (isContext) {
            const run = contextMenus.get(interaction.commandName);
            if (!run)
                return;
            run(interaction, interaction.commandName);
        }
        else if (interaction.isChatInputCommand()) {
            const run = slashCommands.get(interaction.commandName);
            if (!run)
                return;
            run(interaction, interaction.commandName);
        }
    }
});
exports.client.on('messageCreate', (message) => {
    if (message.author.bot)
        return;
    if (!process.env.COMMAND_PREFIX)
        return;
    if ((message.channelId === process.env.STATUS_CHANNEL_ID || message.channelId === process.env.SUBSCRIBE_CHANNEL_ID || message.channelId === process.env.CANCEL_CHANNEL_ID) && !message.member?.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageMessages)) {
        message.delete();
    }
    const args = message.content.slice(process.env.COMMAND_PREFIX.length).split(/ +/);
    const commandName = args.shift();
    if (!commandName)
        return;
    const run = messageCommands.get(commandName);
    if (!run)
        return;
    run(message, commandName);
});
exports.client.on('ready', () => {
    console.log(`Logged in as ${exports.client.user.tag}. Ready to serve ${exports.client.users.cache.size} users in ${exports.client.guilds.cache.size} servers 🚀`);
    if (process.env.DB_NAME) {
        (0, database_1.initialize)().then(() => {
            console.log('Database initialized 📦');
            if (process.argv.includes('--sync')) {
                tasks.tasks.first()?.run();
            }
        });
    }
    else {
        console.log('Database not initialized, as no keys were specified 📦');
    }
    if (process.env.SPREADSHEET_ID) {
        (0, sheets_1.syncSheets)();
    }
});
exports.client.login(process.env.DISCORD_CLIENT_TOKEN);
