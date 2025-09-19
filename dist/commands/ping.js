"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
exports.commands = [
    'ping'
];
const run = async (message) => {
    message.channel.send(`🏓 Pong! My latency is currently \`${message.client.ws.ping}ms\`.`);
};
exports.run = run;
