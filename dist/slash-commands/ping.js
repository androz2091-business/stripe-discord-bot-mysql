"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
exports.commands = [
    {
        name: "ping",
        description: "Get the bot's latency"
    }
];
const run = async (interaction) => {
    interaction.reply(`🏓 Pong! My latency is currently \`${interaction.client.ws.ping}ms\`.`);
};
exports.run = run;
