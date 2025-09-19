"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContextMenus = exports.loadMessageCommands = exports.loadSlashCommands = exports.synchronizeSlashCommands = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const synchronizeSlashCommands = async (client, commands, options = {}) => {
    const log = (message) => options.debug && console.log(message);
    const ready = client.readyAt ? Promise.resolve() : new Promise(resolve => client.once('ready', resolve));
    await ready;
    const currentCommands = options.guildId ? await client.application.commands.fetch({
        guildId: options.guildId,
    }) : await client.application.commands.fetch();
    log(`Synchronizing commands...`);
    log(`Currently ${currentCommands.size} commands.`);
    const newCommands = commands.filter((command) => !currentCommands.some((c) => c.name === command.name));
    for (let newCommand of newCommands) {
        if (options.guildId)
            await client.application.commands.create(newCommand, options.guildId);
        else
            await client.application.commands.create(newCommand);
    }
    log(`Created ${newCommands.length} commands!`);
    const deletedCommands = currentCommands.filter((command) => !commands.some((c) => c.name === command.name)).toJSON();
    for (let deletedCommand of deletedCommands) {
        await deletedCommand.delete();
    }
    log(`Deleted ${deletedCommands.length} commands!`);
    const updatedCommands = commands.filter((command) => currentCommands.some((c) => c.name === command.name));
    let updatedCommandCount = 0;
    for (let updatedCommand of updatedCommands) {
        const newCommand = updatedCommand;
        const previousCommand = currentCommands.find((c) => c.name === updatedCommand.name);
        let modified = false;
        if (previousCommand?.description !== newCommand?.description)
            modified = true;
        if (!discord_js_1.ApplicationCommand.optionsEqual(previousCommand.options ?? [], newCommand.options ?? []))
            modified = true;
        if (modified) {
            await previousCommand.edit(newCommand);
            updatedCommandCount++;
        }
    }
    log(`Updated ${updatedCommandCount} commands!`);
    log(`Commands synchronized!`);
    return {
        currentCommandCount: currentCommands.size,
        newCommandCount: newCommands.length,
        deletedCommandCount: deletedCommands.length,
        updatedCommandCount
    };
};
exports.synchronizeSlashCommands = synchronizeSlashCommands;
const loadSlashCommands = (client) => {
    const commands = new discord_js_1.Collection();
    const commandsData = [];
    try {
        (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '..', 'slash-commands')).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require((0, path_1.join)(__dirname, '..', 'slash-commands', file));
                if (!command.commands)
                    return console.log(`${file} has no commands`);
                commandsData.push(...command.commands);
                command.commands.forEach((commandData) => {
                    commands.set(commandData.name, command.run);
                    console.log(`Loaded slash command ${commandData.name}`);
                });
            }
        });
    }
    catch {
        console.log(`No slash commands found`);
    }
    return {
        slashCommands: commands,
        slashCommandsData: commandsData
    };
};
exports.loadSlashCommands = loadSlashCommands;
const loadMessageCommands = (client) => {
    const commands = new discord_js_1.Collection();
    try {
        (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '..', 'commands')).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require((0, path_1.join)(__dirname, '..', 'commands', file));
                if (!command.commands)
                    return console.log(`${file} has no commands`);
                command.commands.forEach((commandName) => {
                    commands.set(commandName, command.run);
                    console.log(`Loaded message command ${commandName}`);
                });
            }
        });
    }
    catch {
        console.log(`No message commands found`);
    }
    return commands;
};
exports.loadMessageCommands = loadMessageCommands;
const loadContextMenus = (client) => {
    const contextMenus = new discord_js_1.Collection();
    const contextMenusData = [];
    try {
        (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '..', 'context-menus')).forEach(file => {
            if (file.endsWith('.js')) {
                const contextMenu = require((0, path_1.join)(__dirname, '..', 'context-menus', file));
                if (!contextMenu.contextMenus)
                    return console.log(`${file} has no menus`);
                contextMenusData.push(...contextMenu.contextMenus);
                contextMenu.contextMenus.forEach((contextMenuData) => {
                    contextMenus.set(contextMenuData.name, contextMenu.run);
                    console.log(`Loaded context menu ${contextMenuData.name}`);
                });
            }
        });
    }
    catch {
        console.log(`No context menus found`);
    }
    return {
        contextMenus,
        contextMenusData
    };
};
exports.loadContextMenus = loadContextMenus;
