const {
    ChannelType,
    EmbedBuilder,
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
const TicketMessage = require('../schemas/ticketMessage');

const anonymousProfile = {
    username: 'Anonymous',
    avatarURL: 'https://cdn.discordapp.com/attachments/920998660689506314/1034516279924625569/unknown.png'
}

const debug = process.argv[2] === '--debug';

module.exports = client => {
    setInterval(async () => {
        const idleTickets = await Ticket.find({
            lastMessageAt: {
                $lt: Date.now() - 1000 * 60 * 60 * 24 * 3
            },
            moderatorReplied: false,
            useReminder: true
        });
        await Promise.all(idleTickets.map(async ticket => {
            let channel;
            try {
                channel = await client.channels.fetch(ticket.channel);
            } catch(e) {
                return Ticket.deleteOne({
                    channel: ticket.channel
                });
            }
            await channel.send({
                content: `>>> **[Ticket Reminder]**\n\nYou haven't responded this ticket for more than 3 days. Please reply or close the ticket.`
            });
            await Ticket.updateOne({
                channel: ticket.channel
            }, {
                lastMessageAt: Date.now()
            });
        }));
    }, debug ? 1000 * 5 : 1000 * 60);

    client.on('messageCreate', async message => {
        if(message.author.bot) return;

        let user = await User.findOne({
            id: message.author.id
        });
        const koreanIncluded = /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g.test(message.content);
        const str = k => lang.langByLangName(user?.lang || (koreanIncluded ? 'ko' : 'en'), k);

        const forum = Server.channel.ticket;

        if(message.channel.type === ChannelType.DM) {
            let ticket = await Ticket.findOneAndUpdate({
                user: message.author.id
            }, {
                lastMessageAt: Date.now(),
                moderatorReplied: false
            });

            let channel;
            let ticketContent = message.content;

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
                                        // {
                                        //     label: str('ANONYMOUS_TICKET'),
                                        //     description: str('ANONYMOUS_TICKET_DESCRIPTION'),
                                        //     value: 'anonymous',
                                        //     emoji: {
                                        //         name: '🕵️'
                                        //     }
                                        // }
                                    ])
                            ])
                    ]
                });

                let selectResponse;
                try {
                    selectResponse = await msg.awaitMessageComponent({
                        time: 1000 * 60
                    });
                } catch(e) {
                    return msg.edit({
                        components: utils.disableComponents(msg.components)
                    });
                }
                const anonymous = selectResponse.values[0] === 'anonymous';

                if(!user) {
                    let locale = selectResponse.locale.substring(0, 2);
                    if(!lang.getLangList().includes(locale)) locale = 'en';

                    user = await User.findOneAndUpdate({
                        id: message.author.id
                    }, {
                        lang: locale
                    }, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                        new: true
                    });
                }

                let modalResponse;
                try {
                    modalResponse = await selectResponse.awaitModalSubmit(
                        new ModalBuilder()
                            .setTitle(str('CREATE_NEW_TICKET'))
                            .addComponents([
                                new TextInputBuilder()
                                    .setCustomId('title')
                                    .setStyle(TextInputStyle.Short)
                                    .setLabel(str('CREATE_NEW_TICKET_TITLE_LABEL'))
                                    .setPlaceholder(str('CREATE_NEW_TICKET_TITLE_PLACEHOLDER'))
                                    .setMaxLength(50),
                                new TextInputBuilder()
                                    .setCustomId('content')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setLabel(str('CREATE_NEW_TICKET_CONTENT_LABEL'))
                                    .setPlaceholder(str('CREATE_NEW_TICKET_CONTENT_PLACEHOLDER'))
                                    .setMaxLength(4000)
                                    .setValue(message.content)
                            ].map(component => new ActionRowBuilder().addComponents([component])))
                    , 1000 * 60 * 10);
                } catch(e) {
                    return selectResponse.followUp(str('TIMED_OUT'));
                }

                const title = modalResponse.fields.getTextInputValue('title');
                ticketContent = modalResponse.fields.getTextInputValue('content');

                const checkTicket = await Ticket.findOne({
                    user: message.author.id
                });
                if(checkTicket) return;

                const buttonComponents = [
                    new ButtonBuilder()
                        .setCustomId('ticketAction_close')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🚪'),
                    new ButtonBuilder()
                        .setCustomId('ticketAction_reminder_disable')
                        .setLabel('Disable Reminder')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⏰')
                ];
                if(!anonymous) buttonComponents.unshift(new ButtonBuilder()
                    .setURL(`discord://-/users/${message.author.id}`)
                    .setLabel('User Profile')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🔗'));

                channel = await forum.threads.create({
                    name: `${anonymous ? anonymousProfile.username : message.author.tag} - ${title}`,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    message: {
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x349eeb)
                                .setTitle('Ticket Information')
                                .addFields([
                                    {
                                        name: 'User',
                                        value: `${anonymous ? 'Anonymous User' : `${message.author} (${message.author.id})`}`
                                    }
                                ])
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(buttonComponents)
                        ]
                    },
                    reason: `${client.user.username} ticket thread`
                });

                ticket = new Ticket({
                    user: message.author.id,
                    channel: channel.id,
                    anonymous
                });
                await ticket.save();

                await modalResponse.update({
                    content: str('CREATE_NEW_TICKET_SUCCESS'),
                    components: []
                });
            }

            let webhookMessage;
            try {
                webhookMessage = await utils.sendWebhookMessage(forum, {
                    username: ticket.anonymous ? anonymousProfile.username : message.author.username,
                    avatarURL: ticket.anonymous ? anonymousProfile.avatarURL : message.author.displayAvatarURL()
                }, {
                    content: ticketContent,
                    files: [...message.attachments.values()],
                    threadId: ticket.channel,
                    allowedMentions: {
                        parse: []
                    }
                });
                await message.react('✅');
            } catch(e) {
                console.log(e);
                await message.react('❌');
            }

            if(webhookMessage) await TicketMessage.create({
                ticketThread: ticket.channel,
                dmMessage: message.id,
                webhookMessage: webhookMessage.id
            });
        }

        if(message.channel.type === ChannelType.PublicThread) {
            const ticket = await Ticket.findOneAndUpdate({
                channel: message.channel.id
            }, {
                lastMessageAt: Date.now(),
                moderatorReplied: true
            });
            if(!ticket) return;

            let ticketUser;
            try {
                ticketUser = await message.client.users.fetch(ticket.user);
            } catch(e) {
                return Ticket.deleteOne({
                    channel: message.channel.id
                });
            }

            const bot_mentions = [
                `<@${message.client.user.id}>`,
                `<@!${message.client.user.id}>`
            ];
            const bot_mentions_regex = bot_mentions.map(a => new RegExp(utils.escapeRegExp(a)));

            if(!message.content.includes(bot_mentions[0]) && !message.content.includes(bot_mentions[1])) return;

            let content = message.content;
            for(let r of bot_mentions_regex) content = content.replace(r, '');

            let dmMessage;
            try {
                dmMessage = await ticketUser.send({
                    content,
                    files: [...message.attachments.values()]
                });
                await message.react('✅');
            } catch(e) {
                await message.react('❌');
            }

            if(dmMessage) await TicketMessage.create({
                ticketThread: message.channel.id,
                dmMessage: dmMessage.id,
                webhookMessage: message.id
            });
        }
    });

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if(newMessage.channel.type !== ChannelType.DM) return;

        const dbMessage = await TicketMessage.findOne({
            dmMessage: newMessage.id
        });
        if(!dbMessage) return;

        let ticketChannel;
        let ticketMessage;
        let messageWebhook;
        try {
            ticketChannel = await client.channels.fetch(dbMessage.ticketThread);
            ticketMessage = await ticketChannel.messages.fetch(dbMessage.webhookMessage);
            messageWebhook = await ticketMessage.fetchWebhook();
        } catch(e) {}

        return messageWebhook.editMessage(ticketMessage, {
            content: newMessage.content,
            threadId: ticketChannel.id
        });
    });
}