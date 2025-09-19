"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbeds = exports.generateId = exports.replyEmbed = exports.successEmbed = exports.errorEmbed = void 0;
const discord_js_1 = require("discord.js");
const errorEmbed = (message) => {
    return {
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setDescription(`❌ | ${message}`)
                .setColor(process.env.EMBED_COLOR)
        ]
    };
};
exports.errorEmbed = errorEmbed;
const successEmbed = (message) => {
    return {
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setDescription(`✅ | ${message}`)
                .setColor(process.env.EMBED_COLOR)
        ]
    };
};
exports.successEmbed = successEmbed;
const replyEmbed = (message) => {
    return {
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setDescription(message)
                .setColor(process.env.EMBED_COLOR)
        ]
    };
};
exports.replyEmbed = replyEmbed;
const generateId = () => {
    return Math.random().toString(36).slice(2, 12);
};
exports.generateId = generateId;
const generateEmbeds = ({ entries, generateEmbed, generateEntry }) => {
    const embeds = [];
    entries.forEach((entry) => {
        const entryContent = generateEntry(entry);
        const lastEmbedTooLong = !embeds.length || (embeds.at(-1).data.description.length + entryContent.length) >= 2048;
        if (lastEmbedTooLong) {
            const newEmbed = generateEmbed(embeds.length);
            embeds.push(newEmbed);
        }
        const lastEmbed = embeds.at(-1);
        lastEmbed.data.description += entryContent;
    });
    return embeds;
};
exports.generateEmbeds = generateEmbeds;
