const { ApplicationCommandOptionType: Options } = require('discord.js');

const { getCommandDescription } = require('../../lang');
const utils = require('../../utils');

const User = require('../../schemas/user');

module.exports = {
    info: {
        name: 'admin',
        ...getCommandDescription('ADMIN_DESCRIPTION'),
        options: [
            {
                name: 'trackerror',
                ...getCommandDescription('ADMIN_TRACKERROR_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'ephemeralonly',
                ...getCommandDescription('ADMIN_EPHEMERALONLY_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'set',
                description: 'null',
                type: Options.SubcommandGroup,
                options: [
                    {
                        name: 'user',
                        ...getCommandDescription('ADMIN_SET_USER_DESCRIPTION'),
                        type: Options.Subcommand,
                        options: [
                            {
                                name: 'user',
                                ...getCommandDescription('ADMIN_SET_USER_USER_DESCRIPTION'),
                                type: Options.User,
                                required: true
                            },
                            {
                                name: 'key',
                                ...getCommandDescription('ADMIN_SET_USER_KEY_DESCRIPTION'),
                                type: Options.String,
                                required: true,
                                choices: Object.keys(User.schema.obj).slice(0, 25).map(k => ({
                                    name: k,
                                    value: k
                                }))
                            },
                            {
                                name: 'value',
                                ...getCommandDescription('ADMIN_SET_USER_VALUE_DESCRIPTION'),
                                type: Options.String,
                                required: true
                            }
                        ]
                    }
                ]
            },
            {
                name: 'get',
                description: 'null',
                type: Options.SubcommandGroup,
                options: [
                    {
                        name: 'user',
                        ...getCommandDescription('ADMIN_GET_USER_DESCRIPTION'),
                        type: Options.Subcommand,
                        options: [
                            {
                                name: 'user',
                                ...getCommandDescription('ADMIN_GET_USER_USER_DESCRIPTION'),
                                type: Options.User,
                                required: true
                            }
                        ]
                    }
                ]
            }
        ]
    },
    checkPermission: utils.teamOnlyHandler,
    handler: utils.subCommandHandler('admin')
}