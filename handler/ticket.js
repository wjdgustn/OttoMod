const {
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SelectMenuBuilder,
    ThreadAutoArchiveDuration,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const { Server } = require('../main');
const utils = require('../utils');
const lang = require('../lang');

const User = require('../schemas/user');
const Ticket = require('../schemas/ticket');

const TicketArchiveDuration = 1000 * 60 * 60;
const forum = Server.channel.ticket;
const anonymousProfile = {
    username: '익명의빡빡이',
    avatarURL: 'https://media.discordapp.net/attachments/902492326482550804/1030705543041523753/Screenshot_20221015_135541.jpg'
}

module.exports = client => {
    client.on('messageCreate', async message => {
        if(message.author.bot) return;

        let user = await User.findOne({
            id: message.author.id
        });
        const str = k => lang.langByLangName(user?.lang || 'en', k);

        if(message.channel.type === ChannelType.DM) {
            await Ticket.deleteMany({
                lastMessageAt: {
                    $lt: Date.now() - TicketArchiveDuration
                }
            });

            let ticket = await Ticket.findOne({
                user: message.author.id,
                channel: message.channel.id
            });

            let channel;

            if(!ticket) {
                const msg = await message.channel.send({
                    content: str('CREATE_NEW_TICKET_MESSAGE'),
                    components: [
                        new ActionRowBuilder()
                            .addComponents([
                                new SelectMenuBuilder()
                                    .setCustomId('select')
                                    .addOptions([
                                        {
                                            label: str('PUBLIC_TICKET'),
                                            description: str('PUBLIC_TICKET_DESCRIPTION'),
                                            value: 'public',
                                            emoji: {
                                                name: '📂'
                                            }
                                        },
                                        {
                                            label: str('ANONYMOUS_TICKET'),
                                            description: str('ANONYMOUS_TICKET_DESCRIPTION'),
                                            value: 'anonymous',
                                            emoji: {
                                                name: '🕵️'
                                            }
                                        }
                                    ])
                            ])
                    ]
                });
                
                let buttonResponse;
                try {
                    buttonResponse = await msg.awaitMessageComponent({
                        time: 1000 * 60
                    });
                } catch(e) {
                    return msg.edit({
                        components: utils.disableComponents(msg.components)
                    });
                }
                const anonymous = responsbuttonResponse.customId === 'anonymous';

                let modalResponse;
                try {
                    modalResponse = await buttonResponse.awaitModalSubmit();
                } catch(e) {
                    return buttonResponse.followUp(str('TIMED_OUT'));
                }

                ticket = new Ticket({
                    user: message.author.id,
                    channel: message.channel.id,
                    anonymous
                });

                channel = await forum.threads.create({
                    name: anonymous ? anonymousProfile.username : message.author.tag,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                    message: {
                        content: 'Ticket Control',
                        components: [
                            new ActionRowBuilder()
                                .addComponents([
                                    new ButtonBuilder()
                                        .setCustomId('ticketAction_close')
                                        .setLabel('Close Ticket')
                                        .setStyle(ButtonStyle.Danger)
                                ])
                        ]
                    },
                    reason: `${client.user.username} ticket thread`
                });
            }

            if(!channel) try {
                channel = await forum.threads.fetch(ticket.channel);
            } catch(e) {
                return Ticket.deleteOne({
                    user: message.author.id
                });
            }

            try {
                await utils.sendWebhookMessage(forum, {
                    username: anonymous ? anonymousProfile.username : message.author.username,
                    avatarURL: anonymous ? anonymousProfile.avatarURL : message.author.displayAvatarURL()
                }, {
                    content: message.content,
                    files: [...message.attachments.values()]
                });
                await message.react('✅');
            } catch(e) {
                console.log(e);
                await message.react('❌');
            }
        }

        if(message.channel.type === ChannelType.PublicThread) {
            
        }
    });
}