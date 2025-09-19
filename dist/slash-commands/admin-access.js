"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.commands = void 0;
const util_1 = require("../util");
const database_1 = require("../database");
const discord_js_1 = require("discord.js");
exports.commands = [
    {
        name: "admin-access",
        description: "Give admin access to a user",
        options: [
            {
                name: "enable",
                description: "Enable access for the user",
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user you want to give access to",
                        type: discord_js_1.ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            },
            {
                name: "disable",
                description: "Disable access for the user",
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user you want to remove access from",
                        type: discord_js_1.ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            }
        ]
    }
];
const run = async (interaction) => {
    await interaction.deferReply();
    if (!interaction.memberPermissions?.has(discord_js_1.PermissionsBitField.Flags.Administrator)) {
        return void interaction.followUp((0, util_1.errorEmbed)("This command needs privileged access and can only be used by administrators."));
    }
    const subCommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user");
    const userCustomer = await database_1.Postgres.getRepository(database_1.DiscordCustomer).findOne({
        where: {
            discordUserId: interaction.user.id
        }
    });
    if (userCustomer)
        await database_1.Postgres.getRepository(database_1.DiscordCustomer).update(userCustomer.id, {
            adminAccessEnabled: subCommand === "enable"
        });
    else
        await database_1.Postgres.getRepository(database_1.DiscordCustomer).insert({
            discordUserId: user.id,
            adminAccessEnabled: subCommand === "enable"
        });
    const member = interaction.guild?.members.cache.get(user.id);
    if (subCommand === "enable") {
        if (member)
            await member.roles.add(process.env.ADMIN_ROLE_ID);
    }
    else {
        if (member)
            await member.roles.remove(process.env.ADMIN_ROLE_ID);
    }
    return void interaction.followUp((0, util_1.successEmbed)(`Successfully ${subCommand === "enable" ? "enabled" : "disabled"} access for ${user.tag}.`));
};
exports.run = run;
