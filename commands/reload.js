const { ApplicationCommandOptionType: Options } = require('discord.js');

const main = require('../main');
const utils = require('../utils');

module.exports = {
    info: {
        name: 'reload',
        description: '봇의 기능들을 리로드합니다.',
        options: [
            {
                name: 'owners',
                description: '디스코드 애플리케이션 소유자 정보를 다시 가져옵니다.',
                type: Options.Subcommand
            },
            {
                name: 'jejudo',
                description: 'jejudo를 재설정합니다.',
                type: Options.Subcommand
            },
            {
                name: 'commands',
                description: '슬래시 커맨드를 다시 등록합니다.',
                type: Options.Subcommand
            },
            {
                name: 'modules',
                description: '슬래시 커맨드 모듈을 다시 불러옵니다.',
                type: Options.Subcommand
            },
            {
                name: 'select',
                description: '셀렉트 메뉴 핸들러를 다시 불러옵니다.',
                type: Options.Subcommand
            },
            {
                name: 'button',
                description: '버튼 핸들러를 다시 불러옵니다.',
                type: Options.Subcommand
            },
            {
                name: 'handler',
                description: '기타 이벤트 핸들러를 다시 불러옵니다.',
                type: Options.Subcommand
            }
        ]
    },
    checkPermission: utils.teamOwnerOnlyHandler,
    handler: async interaction => {
        await interaction.deferReply({
            ephemeral: true
        });

        const target = interaction.options.getSubcommand();

        switch(target) {
            case 'modules':
                main.loadCommands();
                break;
            case 'commands':
                await main.registerCommands();
                break;
            case 'jejudo':
                await main.loadJejudo();
                break;
            case 'owners':
                await main.loadOwners();
                break;
            case 'select':
                main.loadSelectHandler();
                break;
            case 'button':
                main.loadButtonHandler();
                break;
            case 'handler':
                main.loadHandler();
                break;
            default:
                return interaction.editReply('알 수 없는 리로드 대상입니다.');
        }

        await interaction.editReply(`${target}${utils.checkBatchim(target) ? '을' : '를'} 리로드하였습니다.`);
    }
}