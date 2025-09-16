import type { TextChannel } from "discord.js";
import { MessageCommandRunFunction } from "../handlers/commands";

export const commands = [
    'ping'
];

export const run: MessageCommandRunFunction = async (message) => {

    (message.channel as TextChannel).send(`🏓 Pong! My latency is currently \`${message.client.ws.ping}ms\`.`);
    
}
