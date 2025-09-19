"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.crons = void 0;
const discord_js_1 = require("discord.js");
const __1 = require("..");
const database_1 = require("../database");
const stripe_1 = require("../integrations/stripe");
exports.crons = [
    '0 0 1 * * *'
];
const getExpiredEmbed = (daysLeft) => {
    const title = daysLeft > 0 ? 'Your subscription is about to expire' : 'Your subscription is expired';
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(title)
        .setURL(process.env.STRIPE_PAYMENT_LINK)
        .setColor(process.env.EMBED_COLOR)
        .setDescription(`Please visit ${process.env.STRIPE_PAYMENT_LINK} to keep your exclusive access! ${daysLeft > 0 ? `Your subscription expires within ${daysLeft * 24} hours.` : ''}`);
    return embed;
};
/**
 * 1) Mark user as inactive
 * 2) Clear reminders
 * 3) Remove role
 * 4) Send logs
 */
const makeMemberExpire = async (customer, member, guild) => {
    await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(customer.id, {
        hadActiveSubscription: false,
        // @ts-ignore
        firstReminderSentDayCount: null
    });
    member?.roles.remove(process.env.PAYING_ROLE_ID);
    if (process.env.LIFETIME_PAYING_ROLE_ID)
        member?.roles.remove(process.env.LIFETIME_PAYING_ROLE_ID);
    guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserId}, <@${customer.discordUserId}>) has completely lost access. Customer email is \`${customer.email}\`.`);
};
const run = async () => {
    const customers = await database_1.Postgres.getRepository(database_1.DiscordCustomer).find({});
    const guild = __1.client.guilds.cache.get(process.env.GUILD_ID);
    await guild.members.fetch();
    for (const customer of customers) {
        if (!customer.email || customer.adminAccessEnabled)
            continue;
        console.log(`[Daily Check] Checking ${customer.email}`);
        const customerId = await (0, stripe_1.resolveCustomerIdFromEmail)(customer.email);
        if (!customerId) {
            console.log(`[Daily Check] Could not find customer id for ${customer.email}`);
            continue;
        }
        const subscriptions = await (0, stripe_1.findSubscriptionsFromCustomerId)(customerId);
        const activeSubscriptions = (0, stripe_1.findActiveSubscriptions)(subscriptions) || [];
        const userPayments = await (0, stripe_1.getCustomerPayments)(customerId);
        const hasLifetime = !!(await (0, stripe_1.getLifetimePaymentDate)(userPayments));
        if (activeSubscriptions.length > 0 || hasLifetime) {
            console.log(`${customer.email} has active subscriptions or a lifetime one.`);
            if (!customer.hadActiveSubscription || customer.firstReminderSentDayCount) {
                await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(customer.id, {
                    hadActiveSubscription: true,
                    // @ts-ignore
                    firstReminderSentDayCount: null
                });
            }
            const member = guild.members.cache.get(customer.discordUserId);
            if (member) {
                member.roles.add(process.env.PAYING_ROLE_ID);
                if (hasLifetime)
                    member.roles.add(process.env.LIFETIME_PAYING_ROLE_ID);
            }
            continue;
        }
        // if the customer no had any active subscription, no need to send reminders
        if (!customer.hadActiveSubscription)
            continue;
        if (!subscriptions.some((sub) => sub.status === 'unpaid')) {
            const member = guild.members.cache.get(customer.discordUserId);
            console.log(`[Daily Check] Unpaid ${customer.email}`);
            member?.send({ embeds: [getExpiredEmbed(0)] }).catch(() => { });
            makeMemberExpire(customer, member, guild);
            continue;
        }
        if (!customer.firstReminderSentDayCount) {
            console.log(`[Daily Check] Sending first reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(2)] }).catch(() => { });
            await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 2
            });
            continue;
        }
        if (customer.firstReminderSentDayCount === 2) {
            console.log(`[Daily Check] Sending second reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(1)] }).catch(() => { });
            await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 1
            });
            continue;
        }
        if (customer.firstReminderSentDayCount === 1) {
            console.log(`[Daily Check] Sending third reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(0)] }).catch(() => { });
            makeMemberExpire(customer, member, guild);
            continue;
        }
    }
};
exports.run = run;
