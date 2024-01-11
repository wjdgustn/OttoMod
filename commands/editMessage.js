const {
    ApplicationCommandType: Command,
    PermissionsBitField: { Flags },
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const { getCommandName } = require('../lang');

module.exports = {
    info: {
        defaultMemberPermissions: Flags.ManageChannels.toString(),
        ...getCommandName('EDIT_MESSAGE'),
        type: Command.Message
    },
    handler: async interaction => {
        const message = interaction.options.getMessage('message');

        let modalResponse;
        try {
            modalResponse = await interaction.awaitModalSubmit(
                new ModalBuilder()
                    .setTitle(interaction.str('COMMAND_EDIT_MESSAGE'))
                    .addComponents([
                        new ActionRowBuilder()
                            .addComponents([
                                new TextInputBuilder()
                                    .setCustomId('content')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setLabel(interaction.str('EDIT_MESSAGE_CONTENT_LABEL'))
                                    .setValue(message.content)
                            ])
                    ])
            , 1000 * 60 * 30);
        } catch(e) {
            return;
        }

        const content = modalResponse.fields.getTextInputValue('content');

        return Promise.all([
            modalResponse.deferUpdate(),
            message.edit(content)
        ]);
    }
}