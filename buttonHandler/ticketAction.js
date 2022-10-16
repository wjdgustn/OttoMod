const { ChannelType } = require('discord.js');

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

        try {
            const dbUser = await User.findOne({
                id: ticket.user
            });
            const user = await interaction.client.users.fetch(ticket.user);
            await user.send(lang.langByLangName(dbUser?.lang || 'en', 'TICKET_CLOSED'));
        } catch(e) {}

        return interaction.channel.setArchived();
    }
}