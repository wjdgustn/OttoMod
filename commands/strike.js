const {
    ApplicationCommandOptionType: Options,
    PermissionsBitField: { Flags }
} = require('discord.js');

const { getCommandDescription } = require('../lang');

const Strike = require('../schemas/strike');

module.exports = {
    info: {
        defaultMemberPermissions: Flags.ManageChannels.toString(),
        name: 'strike',
        ...getCommandDescription('STRIKE_DESCRIPTION'),
        options: [
            {
                name: 'user',
                ...getCommandDescription('STRIKE_USER_DESCRIPTION'),
                type: Options.User,
                required: true
            },
            {
                name: 'rule',
                ...getCommandDescription('STRIKE_RULE_DESCRIPTION'),
                type: Options.Integer,
                min_value: 1,
                required: true
            },
            {
                name: 'duration',
                ...getCommandDescription('STRIKE_DURATION_DESCRIPTION'),
                type: Options.Integer,
                min_value: 1,
                max_value: 24,
                required: true
            },
            {
                name: 'reason',
                ...getCommandDescription('STRIKE_REASON_DESCRIPTION'),
                type: Options.String,
                required: true
            },
            {
                name: 'evidence',
                ...getCommandDescription('STRIKE_EVIDENCE_DESCRIPTION'),
                type: Options.String,
                required: true
            }
        ]
    },
    handler: async interaction => {
        await interaction.deferReply();

        const { options } = interaction;

        const user = options.getUser('user');
        const rule = options.getInteger('rule');
        const duration = options.getInteger('duration');
        const reason = options.getString('reason');
        const evidence = options.getString('evidence');

        const expiresAt = Date.now() + (duration * 1000 * 60 * 60 * 24 * 30);

        let failedDM = false;
        await Promise.all([
            Strike.create({
                user: user.id,
                rule,
                expiresAt,
                reason,
                evidence
            }),
            user.send(`You've been striked in Rhythm Doctor Lounge for breaking Rule #${rule}, for the reason of "${reason}". If you have any issues or comments with this, feel free to dm me ${interaction.client.user} to send a message to the mods!`)
                .catch(_ => failedDM = true)
        ]);

        const count = await Strike.countDocuments({
            user: user.id,
            expiresAt: { $gt: Date.now() }
        });

        let content = interaction.str('STRIKE_SUCCESS')
            .replace('{user}', user)
            .replace('{rule}', rule)
            .replace('{count}', count);

        if(failedDM) content += '\n\n' + interaction.str('STRIKE_DM_FAILED');

        return interaction.editReply(content);
    }
}