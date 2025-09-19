"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
const util_1 = require("../util");
const database_1 = require("../database");
const discord_js_1 = require("discord.js");
const stripe_1 = require("../integrations/stripe");
exports.commands = [
    {
        name: "status",
        description: "Get your exclusive access status!",
        options: [
            {
                name: "user",
                description: "The user you want to get the status of",
                type: discord_js_1.ApplicationCommandOptionType.User,
                required: false
            }
        ]
    }
];
const run = async (interaction) => {
    if (interaction.channelId !== process.env.STATUS_CHANNEL_ID) {
        return void interaction.reply({
            content: `This command can only be used in <#${process.env.STATUS_CHANNEL_ID}>. Please go there and try again.`,
            ephemeral: true
        });
    }
    const user = interaction.options.getUser("user") || interaction.user;
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
    const payments = await (0, stripe_1.getCustomerPayments)(customerId);
    const lifetimePaymentDate = await (0, stripe_1.getLifetimePaymentDate)(payments);
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: `${user.tag}'s access`,
        iconURL: user.displayAvatarURL()
    })
        .setDescription(`Here are all the ${process.env.SUBSCRIPTION_NAME} subscriptions 👑`)
        .setColor(process.env.EMBED_COLOR)
        .addFields([
        {
            name: 'Subscriptions',
            value: subscriptions.length > 0 ? subscriptions.map((subscription) => {
                let name = subscription.items.data[0]?.plan.id
                    .replace(/_/g, ' ')
                    .replace(/^\w|\s\w/g, (l) => l.toUpperCase());
                if (name.includes('Membership')) {
                    name = name.slice(0, name.indexOf('Membership') + 'Membership'.length);
                }
                return `${name} (${subscription.status === 'active' ? "✅ Active" : ((subscription.cancel_at && subscription.current_period_end > Date.now() / 1000) ? "❌ Cancelled (not expired yet)" : "❌ Cancelled")})`;
            }).join('\n') : "There is no subscription for this account."
        },
        /*{
            name: 'Access given by the admins',
            value: discordCustomer.adminAccessEnabled ? '✅ Access' : '❌ No access'
        }*/
    ]);
    return void interaction.reply({
        ephemeral: true,
        embeds: [embed]
    });
};
exports.run = run;
