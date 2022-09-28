const { ApplicationCommandOptionType: Options } = require('discord.js');

const utils = require('../../utils');

const User = require('../../schemas/user');

module.exports = {
    info: {
        name: 'admin',
        description: '봇 관리자용 명령어들입니다.',
        options: [
            {
                name: 'trackerror',
                description: '봇의 오류 트래킹 DM을 토글합니다.',
                type: Options.Subcommand
            },
            {
                name: 'ephemeralonly',
                description: '모든 명령어 결과를 ephemeral로 표시합니다.',
                type: Options.Subcommand
            },
            {
                name: 'set',
                description: 'null',
                type: Options.SubcommandGroup,
                options: [
                    {
                        name: 'user',
                        description: '유저의 DB를 수정합니다.',
                        type: Options.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'DB를 수정할 유저입니다.',
                                type: Options.User,
                                required: true
                            },
                            {
                                name: 'key',
                                description: '수정할 키입니다.',
                                type: Options.String,
                                required: true,
                                choices: Object.keys(User.schema.obj).slice(0, 25).map(k => ({
                                    name: k,
                                    value: k
                                }))
                            },
                            {
                                name: 'value',
                                description: '수정할 값입니다.',
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
                        description: '유저의 DB를 확인합니다.',
                        type: Options.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'DB를 확인할 유저입니다.',
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