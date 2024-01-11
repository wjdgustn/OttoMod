const {
    ApplicationCommandOptionType: Options,
    PermissionsBitField: { Flags },
    EmbedBuilder
} = require('discord.js');

const { getCommandDescription } = require('../lang');

const Strike = require('../schemas/strike');

module.exports = {
    info: {
        name: 'strikes',
        ...getCommandDescription('STRIKES_DESCRIPTION'),
        options: [
            {
                name: 'user',
                ...getCommandDescription('STRIKES_USER_DESCRIPTION'),
                type: Options.User
            }
        ]
    },
    handler: async interaction => {
        const user = interaction.options.getUser('user') ?? interaction.user;

        if(!interaction.member.permissions.has(Flags.ManageChannels) && user.id !== interaction.user.id)
            return interaction.reply({
                content: interaction.str('STRIKES_NO_PERMISSION'),
                ephemeral: true
            });

        const strikes = await Strike.find({
            user: user.id
        });

        const activeStrikes = strikes.filter(a => a.expiresAt > Date.now());
        const expiredStrikes = strikes.filter(a => a.expiresAt <= Date.now());

        const strikeMapper = (a, i) => `${i + 1}. R${a.rule}: ${a.reason}\n  - ${a.evidence}`;

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(interaction.str('STRIKES_TITLE'))
                    .addFields([
                        {
                            name: interaction.str('STRIKES_ACTIVE_TITLE'),
                            value: activeStrikes.length > 0 ? activeStrikes.map(strikeMapper).join('\n') : interaction.str('STRIKES_NOTHING'),
                            inline: true
                        },
                        {
                            name: interaction.str('STRIKES_EXPIRED_TITLE'),
                            value: expiredStrikes.length > 0 ? expiredStrikes.map(strikeMapper).join('\n') : interaction.str('STRIKES_NOTHING'),
                            inline: true
                        }
                    ])
            ],
            ephemeral: true
        });
    }
}