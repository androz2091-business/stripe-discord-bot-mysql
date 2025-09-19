"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
const util_1 = require("../util");
const database_1 = require("../database");
const discord_js_1 = require("discord.js");
const stripe_1 = require("../integrations/stripe");
exports.commands = [
    {
        name: "cancel",
        description: "Cancel your current subscription",
        options: [
            {
                name: "user",
                description: "The user you want to cancel the subscription for",
                type: discord_js_1.ApplicationCommandOptionType.User,
                required: false
            }
        ]
    }
];
const run = async (interaction) => {
    if (interaction.channelId !== process.env.CANCEL_CHANNEL_ID) {
        return void interaction.reply({
            content: `This command can only be used in <#${process.env.CANCEL_CHANNEL_ID}>. Please go there and try again.`,
            ephemeral: true
        });
    }
    const user = interaction.options.getUser("user") || interaction.user;
    if (interaction.options.getUser("user") && !interaction.memberPermissions.has(discord_js_1.PermissionsBitField.Flags.Administrator)) {
        return void interaction.reply({
            content: `You don't have the permission to cancel someone else's subscription.`,
            ephemeral: true
        });
    }
    const discordCustomer = await database_1.Postgres.getRepository(database_1.DiscordCustomer).findOne({
        where: {
            discordUserId: user.id
        }
    });
    if (!discordCustomer) {
        return void interaction.reply({
            ephemeral: true,
            embeds: (0, util_1.errorEmbed)(`There is no email linked to your account!`).embeds
        });
    }
    const customerId = await (0, stripe_1.resolveCustomerIdFromEmail)(discordCustomer.email);
    const subscriptions = await (0, stripe_1.findSubscriptionsFromCustomerId)(customerId);
    const actives = (0, stripe_1.findActiveSubscriptions)(subscriptions);
    const cancelled = actives[0];
    if (!cancelled) {
        return void interaction.reply({
            ephemeral: true,
            embeds: (0, util_1.errorEmbed)(`You don't have an active subscription!`).embeds
        });
    }
    const confirmEmbed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: `${user.tag} cancellation`,
        iconURL: user.displayAvatarURL()
    })
        .setDescription(`Are you sure you want to cancel your subscription?`)
        .setColor(process.env.EMBED_COLOR);
    const random3DigitsId = Math.floor(Math.random() * 900) + 10;
    const components = [
        new discord_js_1.ActionRowBuilder()
            .addComponents([
            new discord_js_1.ButtonBuilder()
                .setCustomId(`cancel-confirm-${user.id}-${random3DigitsId}`)
                .setLabel("Confirm")
                .setStyle(discord_js_1.ButtonStyle.Danger)
        ])
    ];
    await interaction.reply({
        ephemeral: true,
        embeds: [confirmEmbed],
        components
    });
    const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i?.customId === `cancel-confirm-${user.id}-${random3DigitsId}`,
        time: 1000 * 60 * 5
    });
    collector.on('collect', (_i) => {
        const i = _i;
        if (i.isButton()) {
            if (i.customId === `cancel-confirm-${user.id}-${random3DigitsId}`) {
                const embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `${user.tag} cancellation`,
                    iconURL: user.displayAvatarURL()
                })
                    .setDescription(`We're sorry to see you go! Your subscription has been cancelled.`)
                    .setColor(process.env.EMBED_COLOR);
                i.reply({
                    ephemeral: true,
                    embeds: [embed],
                    components: []
                });
                (0, stripe_1.cancelSubscription)(cancelled.id);
            }
        }
    });
    collector.on('end', () => {
        interaction.editReply({
            embeds: [confirmEmbed],
            components: []
        });
    });
};
exports.run = run;
