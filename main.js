const {
    Client,
    Team,
    EmbedBuilder,
    GatewayIntentBits,
    Partials,
    InteractionType,
    ActivityType
} = require('discord.js');
const fs = require('fs');
const {
    Jejudo,
    SummaryCommand,
    EvaluateCommand,
    ShellCommand,
    DocsCommand
} = require('jejudo');
const path = require('path');
const util = require('util');
const awaitModalSubmit = require('await-modal-submit');

const setting = require('./setting.json');
const Server = require('./server.json');
const utils = require('./utils');
const lang = require('./lang');

const User = require('./schemas/user');
const Ticket = require('./schemas/ticket');
const CommandHistory = require('./schemas/commandHistory');
const InteractionHistory = require('./schemas/interactionHistory');
const TicketMessage = require('./schemas/ticketMessage');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

let JejudoHandler;

let application
let owners = [];
let ownerID = [];
module.exports.getOwners = () => owners;
module.exports.getOwnerID = () => ownerID;

const ServerCache = {
    role: {},
    channel: {},
    emoji: {}
}
module.exports.Server = ServerCache;

utils.setup(client);
awaitModalSubmit(client);

const connect = require('./schemas');
connect();

let permissionHandler = {};
let commandHandler = {};
let autoCompleteHandler = {};
let selectHandler = {};
let buttonHandler = {};
let commands = [];

const debug = process.argv[2] === '--debug';
if(debug && !process.argv[3]) {
    console.log('Debug guild missing');
    process.exit(1);
}

const loadOwners = async () => {
    application = await client.application.fetch();
    owners = application.owner instanceof Team ? application.owner.members.map(a => a.user) : [application.owner];
    ownerID = owners.map(a => a.id);
}

const loadJejudo = () => {
    const globalVariables = {
        client,
        permissionHandler,
        commandHandler,
        autoCompleteHandler,
        selectHandler,
        buttonHandler,
        commands,
        main: module.exports,
        utils,
        Discord: require('discord.js'),
        lang,
        User,
        Ticket,
        CommandHistory,
        InteractionHistory,
        TicketMessage
    }

    JejudoHandler = new Jejudo(client, {
        command: 'j',
        textCommand: [
            'jeju',
            'jejudo',
            'j',
            'dok',
            'dokdo'
        ],
        prefix: `<@${client.user.id}> `,
        owners: ownerID,
        registerDefaultCommands: false,
        secrets: [
            setting.MONGODB_HOST,
            setting.MONGODB_PORT,
            setting.MONGODB_USER,
            setting.MONGODB_PASSWORD
        ],
        globalVariables,
        noPermission: i => {
            return i.reply(utils.missingPermissionMessage(i, 'jejudo'));
        }
    });

    const editedEvaluateCommand = new EvaluateCommand(JejudoHandler);
    editedEvaluateCommand.data.name = 'js';

    const editedShellCommand = new ShellCommand(JejudoHandler);
    editedShellCommand.data.name = 'sh';

    JejudoHandler.registerCommand(new SummaryCommand(JejudoHandler));
    JejudoHandler.registerCommand(editedEvaluateCommand);
    JejudoHandler.registerCommand(editedShellCommand);
    JejudoHandler.registerCommand(new DocsCommand(JejudoHandler));

    module.exports.getGlobalVariable = () => globalVariables;
}

const loadCommands = () => {
    permissionHandler = {};
    commandHandler = {};
    autoCompleteHandler = {};
    commands = [];

    commands.push(JejudoHandler.commandJSON);

    const registerLoop = (c, sub) => {
        c.forEach(c => {
            if(!c.endsWith('.js') && !fs.existsSync(path.join('./commands', c, 'index.js'))) return registerLoop(fs.readdirSync(path.join('./commands', c)), c);
            const file = require.resolve('./' + path.join('commands', sub || '', c));
            delete require.cache[file];
            const module = require(file);
            if(module.checkPermission) permissionHandler[module.info.name] = module.checkPermission;
            commandHandler[module.info.name] = module.handler;
            if(module.autoCompleteHandler) autoCompleteHandler[module.info.name] = module.autoCompleteHandler;
            if(module.setup) module.setup(client);

            commands.push(module.info);
        });
    }

    registerLoop(fs.readdirSync('./commands'));
}

const loadSelectHandler = () => {
    selectHandler = {};
    fs.readdirSync('./selectHandler').forEach(c => {
        const file = require.resolve(`./selectHandler/${c}`);
        delete require.cache[file];
        selectHandler[c.replace('.js', '')] = require(`./selectHandler/${c}`);
    });
}

const loadButtonHandler = () => {
    buttonHandler = {};
    fs.readdirSync('./buttonHandler').forEach(c => {
        const file = require.resolve(`./buttonHandler/${c}`);
        delete require.cache[file];
        buttonHandler[c.replace('.js', '')] = require(`./buttonHandler/${c}`);
    });
}

const registerCommands = async () => {
    if(debug) await client.guilds.cache.get(process.argv[3]).commands.set(commands);
    else await client.application.commands.set(commands);
    console.log('registered commands.');
}

const cacheServer = async () => {
    console.log('cache start');
    const guild = await client.guilds.cache.get(Server.guild);
    ServerCache.guild = guild;
    console.log('guild cached');
    // for(let r in Server.role)
    //     ServerCache.role[r] = await ServerCache.adofai_gg.roles.fetch(Server.role[r]);
    // console.log('role cached');
    for(let c in Server.channel)
        ServerCache.channel[c] = await client.channels.fetch(Server.channel[c]);
    console.log('channel cached');
    for(let e in Server.emoji)
        ServerCache.emoji[e] = client.emojis.cache.get(Server.emoji[e]) || await guild.emojis.fetch(Server.emoji[e]);
    console.log('emoji cached');

    console.log('cache finish');
}

const loadHandler = () => {
    fs.readdirSync('./handler').forEach(f => {
        const file = require.resolve(`./handler/${f}`);
        delete require.cache[file];
        require(file)(client);

        console.log(`loaded handler ${f}`);
    });
}

module.exports.loadOwners = loadOwners;
module.exports.loadJejudo = loadJejudo;
module.exports.loadCommands = loadCommands;
module.exports.loadSelectHandler = loadSelectHandler;
module.exports.loadButtonHandler = loadButtonHandler;
module.exports.registerCommands = registerCommands;
module.exports.loadHandler = loadHandler;

client.once('ready', async () => {
    console.log(`Logined as ${client.user.tag}`);

    await loadOwners();
    loadJejudo();
    loadCommands();
    // loadSelectHandler();
    loadButtonHandler();
    cacheServer();
    if(debug) client.guilds.cache.get(process.argv[3] || Server.guild).commands.fetch();
    registerCommands();
    loadHandler();

    client.user.setActivity('DM me to send a message to MOD TEAM', {
        type: ActivityType.Watching
    });
});

client.on('interactionCreate', async interaction => {
    if(!interaction.guild) return;

    let locale = interaction.locale.substring(0, 2);
    if(!lang.getLangList().includes(locale)) locale = 'en';

    interaction.str = k => lang.langByLangName(locale, k);

    let user = await User.findOneAndUpdate({
        id: interaction.user.id
    }, {
        lang: locale
    }, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true
    });

    if(interaction.isChatInputCommand() || interaction.isContextMenuCommand()) await CommandHistory.create({
        id: interaction.id,
        guild: interaction.guild?.id,
        channel: interaction.channel.id,
        user: interaction.user.id,
        command: interaction.toString(),
        commandName: interaction.commandName,
        options: interaction.options._hoistedOptions,
        subCommand: interaction.options.getSubcommand(false),
        subCommandGroup: interaction.options.getSubcommandGroup(false),
        locale: interaction.locale
    });

    if(user.blacklist && !ownerID.includes(user.id)) return;

    interaction.dbUser = user;

    if(user.ephemeralOnly) {
        interaction.originalReply = interaction.reply;
        interaction.originalDeferReply = interaction.deferReply;

        interaction.reply = options => {
            if(typeof options === 'string') options = { content: options };
            options.ephemeral = true;

            return interaction.originalReply(options);
        }

        interaction.deferReply = options => {
            if(!options) options = {};
            options.ephemeral = true;

            return interaction.originalDeferReply(options);
        }
    }

    if(JejudoHandler) JejudoHandler.handleInteraction(interaction);

    if(interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        if(!interaction.commandName) return;

        if(commandHandler[interaction.commandName]) {
            const checkPermission = permissionHandler[interaction.commandName];
            if(checkPermission) {
                const check = await permissionHandler[interaction.commandName](interaction);
                if(!check) return;
            }
            commandHandler[interaction.commandName](interaction);
        }
    }

    if(interaction.isSelectMenu()) {
        const params = interaction.values[0].split('_');
        const handler = selectHandler[params[0]];
        if(handler) handler(interaction);

        await InteractionHistory.create({
            type: 'SELECT_MENU',
            guild: interaction.guild?.id,
            channel: interaction.channel.id,
            user: interaction.user.id,
            customId: interaction.customId,
            values: interaction.values
        });
    }

    if(interaction.isButton()) {
        const params = interaction.customId.split('_');
        const handler = buttonHandler[params[0]];
        if(handler) handler(interaction);

        await InteractionHistory.create({
            type: 'BUTTON',
            guild: interaction.guild?.id,
            channel: interaction.channel.id,
            user: interaction.user.id,
            customId: interaction.customId
        });
    }

    if(interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        if(!interaction.commandName) return;

        if(autoCompleteHandler[interaction.commandName]) autoCompleteHandler[interaction.commandName](interaction);
    }
});

client.on('messageCreate', async message => {
    if(message.author.bot) return;

    if(JejudoHandler) JejudoHandler.handleMessage(message);
});

client.on('debug', d => {
    if(debug) console.log(d);
});

process.on('uncaughtException', async e => {
    console.error(e);

    const recentCommands = await CommandHistory.find().sort({
        _id: -1
    }).limit(3);
    let err = util.inspect(e, {
        depth: 1,
        colors: true
    });
    if(err.length > 4000) err = util.inspect(e, {
        depth: 1
    });
    const errMessage = {
        embeds: [
            new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('오류 발생')
                .setDescription(`${err.length > 4000 ? '첨부파일 확인' : `\`\`\`ansi\n${err}\n\`\`\``}`)
                .addFields([{
                    name: '최근 명령어(최신순)',
                    value: `\`\`\`\n${recentCommands.map(a => a.command.substring(0, 330)).join('\n')}\n\`\`\``
                }])
                .setTimestamp()
        ]
    }
    if(err.length > 4000) errMessage.files = [{
        name: 'error.log',
        attachment: Buffer.from(err)
    }];

    const users = await User.find({
        trackError: true
    });

    for(let u of users) {
        try {
            const user = await client.users.fetch(u.id);
            await user.send(errMessage);
        } catch(e) {
            console.log(e);
        }
    }
});

client.login(setting.TOKEN);