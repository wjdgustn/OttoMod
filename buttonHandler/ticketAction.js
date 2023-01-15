const {
    ChannelType,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const utils = require('../utils');
const lang = require('../lang');

const User = require('../schemas/user');
const Ticket = require('../schemas/ticket');
const TicketMessage = require('../schemas/ticketMessage');

module.exports = async interaction => {
    if(interaction.channel.type !== ChannelType.PublicThread) return;

    const params = interaction.customId.split('_');
    if(params.length < 2) return;

    const action = params[1];

    if(action === 'close') {
        const ticket = await Ticket.findOneAndDelete({
            channel: interaction.channel.id
        });

        await TicketMessage.deleteMany({
            ticketThread: interaction.channel.id
        });

        await interaction.update({
            components: utils.disableComponents(interaction.message.components)
        });

        await interaction.channel.send({
            content: `${interaction.user} closed this ticket.`,
            allowedMentions: {
                parse: []
            }
        });

        try {
            const dbUser = await User.findOne({
                id: ticket.user
            });
            const user = await interaction.client.users.fetch(ticket.user);
            await user.send(lang.langByLangName(dbUser?.lang || 'en', 'TICKET_CLOSED'));
        } catch(e) {}

        return interaction.channel.setArchived();
    }

    if(action === 'reminder') {
        const useReminder = params[2] === 'enable';

        await Ticket.updateOne({
            channel: interaction.channel.id
        }, {
            useReminder
        });

        interaction.message.components[0].components[1] = new ButtonBuilder()
            .setCustomId(`ticketAction_reminder_${useReminder ? 'disable' : 'enable'}`)
            .setLabel(useReminder ? 'Disable reminder' : 'Enable reminder')
            .setStyle(useReminder ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('⏰');

        return interaction.update({
            components: interaction.message.components
        });
    }
}