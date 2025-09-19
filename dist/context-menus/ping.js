"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.contextMenus = void 0;
exports.contextMenus = [
    {
        name: "Ping",
        type: 3
    }
];
const run = async (interaction) => {
    interaction.reply(`🏓 Pong! My latency is currently \`${interaction.client.ws.ping}ms\`.`);
};
exports.run = run;
