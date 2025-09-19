"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
const util_1 = require("../util");
const database_1 = require("../database");
const discord_js_1 = require("discord.js");
const stripe_1 = require("../integrations/stripe");
const typeorm_1 = require("typeorm");
exports.commands = [
    {
        name: "subscribe",
        description: "Subscribe or claim your active subscription!",
        options: [
            {
                name: "email",
                description: "Your email address",
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: false
            }
        ]
    }
];
const run = async (interaction) => {
    if (interaction.channelId !== process.env.SUBSCRIBE_CHANNEL_ID) {
        return void interaction.reply({
            content: `This command can only be used in <#${process.env.SUBSCRIBE_CHANNEL_ID}>. Please go there and try again.`,
            ephemeral: true
        });
    }
    const email = interaction.options.getString("email");
    const userCustomer = await database_1.Postgres.getRepository(database_1.DiscordCustomer).findOne({
        where: {
            discordUserId: interaction.user.id
        }
    });
    if (userCustomer && !email) {
        return void interaction.reply({
            ephemeral: true,
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, you already have an active subscription linked to your account. You can update it by specifying your email again.`)
            ]
        });
    }
    if (!email) {
        return void interaction.reply({
            ephemeral: true,
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, you can purchase a new subscription at ${process.env.STRIPE_PAYMENT_LINK} or claim your active subscription by using this command with the email parameter.`)
            ]
        });
    }
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(email)) {
        return void interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, this email is not subscribed yet. You can purchase a new subscription at ${process.env.STRIPE_PAYMENT_LINK} and run this command again.`)
            ],
            ephemeral: true
        });
    }
    const existingEmailCustomer = await database_1.Postgres.getRepository(database_1.DiscordCustomer).findOne({
        where: {
            email,
            discordUserId: (0, typeorm_1.Not)(interaction.user.id)
        }
    });
    if (existingEmailCustomer) {
        return void interaction.reply({
            embeds: (0, util_1.errorEmbed)(`This email address is already in use by another user. Please use a different email address or contact us if you think this is an error.`).embeds,
            ephemeral: true
        });
    }
    const customerId = await (0, stripe_1.resolveCustomerIdFromEmail)(email);
    if (!customerId)
        return void interaction.reply({
            embeds: (0, util_1.errorEmbed)(`You do not have an active subscription. Please buy one at ${process.env.STRIPE_PAYMENT_LINK} to access the server.`).embeds,
            ephemeral: true
        });
    const subscriptions = await (0, stripe_1.findSubscriptionsFromCustomerId)(customerId);
    const activeSubscriptions = (0, stripe_1.findActiveSubscriptions)(subscriptions);
    if (!(activeSubscriptions.length > 0)) {
        return void interaction.reply({
            embeds: (0, util_1.errorEmbed)(`You do not have an active subscription. Please buy one at ${process.env.STRIPE_PAYMENT_LINK} to access the server.`).embeds,
            ephemeral: true
        });
    }
    const customer = {
        hadActiveSubscription: true,
        // @ts-ignore
        firstReminderSentDayCount: null,
        email,
        discordUserId: interaction.user.id,
    };
    if (userCustomer)
        await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(userCustomer.id, customer);
    else
        await database_1.Postgres.getRepository(database_1.DiscordCustomer).insert(customer);
    const member = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => { });
    await member?.roles.add(process.env.PAYING_ROLE_ID);
    (member?.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID)).send(`:arrow_upper_right: **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserId}, <@${customer.discordUserId}>) has been linked to \`${customer.email}\`.`);
    return void interaction.reply({
        ephemeral: true,
        embeds: (0, util_1.successEmbed)(`Welcome, you are eligible to the exclusive Discord access!`).embeds
    });
};
exports.run = run;
