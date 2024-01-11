const {
    ApplicationCommandOptionType: Options,
    PermissionsBitField: { Flags }
} = require('discord.js');

const { getCommandDescription } = require('../lang');

module.exports = {
    info: {
        defaultMemberPermissions: Flags.ManageChannels.toString(),
        name: 'say',
        ...getCommandDescription('SAY_DESCRIPTION'),
        options: [
            {
                name: 'content',
                ...getCommandDescription('SAY_CONTENT_DESCRIPTION'),
                type: Options.String,
                required: true
            }
        ]
    },
    handler: async interaction => {
        const content = interaction.options.getString('content');

        await Promise.all([
            interaction.deferReply({
                ephemeral: true
            }),
            interaction.channel.send(content)
        ]);

        return interaction.deleteReply();
    }
}