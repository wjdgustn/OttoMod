const { ApplicationCommandOptionType: Options } = require('discord.js');

const main = require('../main');
const { getCommandDescription } = require('../lang');
const utils = require('../utils');

module.exports = {
    info: {
        name: 'reload',
        ...getCommandDescription('RELOAD_DESCRIPTION'),
        options: [
            {
                name: 'owners',
                ...getCommandDescription('RELOAD_OWNERS_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'jejudo',
                ...getCommandDescription('RELOAD_JEJUDO_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'commands',
                ...getCommandDescription('RELOAD_COMMANDS_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'modules',
                ...getCommandDescription('RELOAD_MODULES_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'lang',
                ...getCommandDescription('RELOAD_LANG_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'select',
                ...getCommandDescription('RELOAD_SELECT_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'button',
                ...getCommandDescription('RELOAD_BUTTON_DESCRIPTION'),
                type: Options.Subcommand
            },
            {
                name: 'handler',
                ...getCommandDescription('RELOAD_HANDLER_DESCRIPTION'),
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
            case 'lang':
                lang.load();
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
                return interaction.editReply(interaction.str('UNKNOWN_RELOAD_TARGET'));
        }

        await interaction.editReply(interaction.str('RELOADED')
            .replace('{target}', target)
            .replace('{el_rel}', utils.checkBatchim(target) ? '을' : '를')
        );
    }
}