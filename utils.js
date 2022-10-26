const {
    EmbedBuilder,
    ComponentType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SelectMenuBuilder
} = require('discord.js');
const Url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const main = require('./main');
const Server = require('./server.json');

let client;

module.exports.setup = c => {
    client = c;
}

const escapeRegExp = s => s.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
module.exports.escapeRegExp = escapeRegExp;

module.exports.checkBatchim = word => {
    if (typeof word !== 'string') return null;

    let lastLetter = word[word.length - 1];

    if(/[a-zA-Z]/.test(lastLetter)) {
        const moem = [ 'a' , 'e' , 'i' , 'o' , 'u' ];
        return moem.includes(lastLetter);
    }

    if(!isNaN(lastLetter)) {
        const k_number = '영일이삼사오육칠팔구십'.split('');
        for(let i = 0; i <= 10; i++) {
            lastLetter = lastLetter.replace(new RegExp(escapeRegExp(i.toString()), 'g'), k_number[i]);
        }
    }
    const uni = lastLetter.charCodeAt(0);

    if (uni < 44032 || uni > 55203) return null;

    return (uni - 44032) % 28 !== 0;
}

module.exports.getYoilString = num => {
    const yoilmap = [
        '일',
        '월',
        '화',
        '수',
        '목',
        '금',
        '토'
    ]

    return yoilmap[num];
}

module.exports.getEnglishMonthString = num => {
    const monthmap = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]

    return monthmap[num - 1];
}

module.exports.chunk = (str, n, put) => {
    return Array.from(Array(Math.ceil(str.length/n)), (_,i)=>str.slice(i*n,i*n+n)).join(put);
}

module.exports.chunkAsArray = (str, n) => {
    return Array.from(Array(Math.ceil(str.length/n)), (_,i)=>str.slice(i*n,i*n+n));
}

module.exports.parseYouTubeLink = link => {
    const parsedUrl = Url.parse(link);
    const parsedQuery = querystring.parse(parsedUrl.query);

    let videoCode;

    if([ 'youtube.com' , 'www.youtube.com' ].includes(parsedUrl.host)) videoCode = parsedQuery.v;
    if([ 'youtu.be' ].includes(parsedUrl.host)) videoCode = parsedUrl.pathname.slice(1);

    return {
        videoCode
    }
}

module.exports.increaseBrightness = (hex, percent) => {
    hex = hex.replace(/^\s*#|\s*$/g, '');

    if(hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }

    const r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    return '#' +
        ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
        ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
        ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}

module.exports.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max + 1);
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports.msToTime = (duration, en = false) => {
    // const weeks = duration / (1000 * 60 * 60 * 24 * 7);
    // const absoluteWeeks = Math.floor(weeks);
    // const w = absoluteWeeks ? (absoluteWeeks + '주 ') : '';

    // const days = (weeks - absoluteWeeks) * 7;
    const days = duration / (1000 * 60 * 60 * 24);
    const absoluteDays = Math.floor(days);
    const d = absoluteDays ? (absoluteDays + (en ? ` Day${absoluteDays > 1 ? 's' : ''} ` : '일 ')) : '';

    const hours = (days - absoluteDays) * 24;
    const absoluteHours = Math.floor(hours);
    const h = absoluteHours ? (absoluteHours + (en ? ` Hour${absoluteHours > 1 ? 's' : ''} ` : '시간 ')) : '';

    const minutes = (hours - absoluteHours) * 60;
    const absoluteMinutes = Math.floor(minutes);
    const m = absoluteMinutes ? (absoluteMinutes + (en ? ` Minute${absoluteMinutes > 1 ? 's' : ''} ` : '분 ')) : '';

    const seconds = (minutes - absoluteMinutes) * 60;
    const absoluteSeconds = Math.floor(seconds);
    const s = absoluteSeconds ? (absoluteSeconds + (en ? ` Second${absoluteSeconds > 1 ? 's' : ''} ` : '초 ')) : '';

    return (/* w + */ d + h + m + s).trim();
}

module.exports.msToTimeNumber = s => {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    return (hrs > 0 ? `${hrs}:` : '') + `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports.parseDiscordCodeBlock = str => {
    let codeBlock = str.match(/```(.+)\n((?:.*?\r?\n?)*)\n```/);
    if(!codeBlock) codeBlock = str.match(/```((?:.*?\r?\n?)*)```/s);
    if(!codeBlock) return null;

    const language = codeBlock.length > 1 ? codeBlock[1] : null;
    const code = codeBlock[codeBlock.length > 1 ? 2 : 1];

    return {
        language,
        code
    }
}

module.exports.subCommandHandler = directory => async interaction => {
    let subCommandGroupExists = false;
    let command = interaction.options.getSubcommand();
    let subCommand;
    if(!fs.existsSync(`./commands/${directory}/${command}.js`)) {
        subCommandGroupExists = true;
        subCommand = command;
        command = interaction.options.getSubcommandGroup();
    }

    const filePath = subCommandGroupExists ? `./commands/${directory}/${command}/${subCommand}.js` : `./commands/${directory}/${command}.js`;

    if(fs.existsSync(filePath)) {
        const file = require.resolve(filePath);
        if(process.argv[2] === '--debug') delete require.cache[file];
        const handler = require(file);
        if(handler.commandHandler) handler.commandHandler(interaction);
        else handler(interaction);
    }
    else interaction.reply({
        content: interaction.str('ERROR_MESSAGE'),
        ephemeral: true
    });
}

module.exports.autoCompleteHandler = directory => async interaction => {
    let command = interaction.options.getSubcommand();
    if(!fs.existsSync(`./commands/${directory}/${command}.js`)) command = interaction.options.getSubcommandGroup();

    if(fs.existsSync(`./commands/${directory}/${command}.js`)) {
        const file = require.resolve(`./commands/${directory}/${command}.js`);
        if(process.argv[2] === '--debug') delete require.cache[file];
        const handler = require(file);
        if(handler.autoCompleteHandler) handler.autoCompleteHandler(interaction);
    }
}

module.exports.missingPermissionMessage = (interaction, permissionName = 'Unknown') => {
    return {
        embeds: [
            new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`🛑 오류`)
                .setDescription(`이 명령어를 사용할 권한이 없습니다!\n\`${interaction.commandName}\` 명령어는 ${permissionName} 권한이 필요합니다.`)
                .setTimestamp()
        ]
    }
}

module.exports.permissionChecker = (checker, permissionName) => async interaction => {
    const result = await checker(interaction);

    if(!result) {
        await interaction.reply(module.exports.missingPermissionMessage(interaction, permissionName));
        return false;
    }

    return true;
}

module.exports.teamOwnerOnlyHandler = async interaction => {
    return module.exports.permissionChecker(interaction => main.getTeamOwner() === interaction.user.id, '봇 소유자')(interaction);
}

module.exports.teamOnlyHandler = async interaction => {
    return module.exports.permissionChecker(interaction => main.getOwnerID().includes(interaction.user.id), '개발자')(interaction);
}

module.exports.jejudoPermissionHandler = async interaction => {
    return module.exports.permissionChecker(() =>
            main.getTeamOwner() === interaction.user.id
            || interaction.dbUser.jejudoPermission, 'jejudo')(interaction);
}

module.exports.textProgressBar = (percentage, size) => {
    percentage /= 100;

    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;

    return `${'▇'.repeat(progress)}${' '.repeat(emptyProgress)}`;
}

module.exports.sendWebhookMessage = async (channel, user = {
    username: '',
    avatarURL: ''
}, message = {}) => {
    let webhook;
    const webhooks = await channel.fetchWebhooks();
    if(!webhooks.size) webhook = await channel.createWebhook({
        name: `${channel.client.user.username} Webhook`
    });
    else webhook = webhooks.first();

    message.username = user.username;
    message.avatarURL = user.avatarURL;

    return webhook.send(message);
}

module.exports.codeBlock = (lang, content) => {
    return `\`\`\`${lang}\n${content}\n\`\`\``;
}

module.exports.jsonCodeBlock = json => {
    return module.exports.codeBlock('json', JSON.stringify(json, null, 2));
}

module.exports.escapeRichText = str => str.replace(/<[^>]*>/g, '');

module.exports.disableComponents = (components = [], except, customIdExactMatch = false, disableURL = false) => {
    if(!Array.isArray(except)) except = [except];

    const rows = [];

    for(let beforeRow of components) {
        const row = new ActionRowBuilder()
            .addComponents(beforeRow.components.map(c => {
                if(customIdExactMatch && except.includes(c.data.custom_id)) return c;
                if(!customIdExactMatch && except.some(e => c.data.custom_id?.startsWith(e))) return c;

                let newComponent;
                switch(c.data.type) {
                    case ComponentType.Button:
                        if(c.data.style === ButtonStyle.Link && !disableURL) return c;

                        newComponent = ButtonBuilder.from(c);
                        break;
                    case ComponentType.SelectMenu:
                        newComponent = SelectMenuBuilder.from(c);
                        break;
                    default:
                        return c;
                }

                newComponent.setDisabled();

                return newComponent;
            }));

        rows.push(row);
    }

    return rows;
}

module.exports.validateURL = url => {
    try {
        const parsed = new URL(url);
        return parsed.href;
    }
    catch (e) {
        return null;
    }
}

module.exports.parseGithubURL = url => {
    const parsedURL = Url.parse(url);
    const pathnameArray = parsedURL.pathname.split('/');
    const username = pathnameArray[1];
    const repo = pathnameArray[2];
    return {
        username,
        repo
    }
}

const defaultUserEmbed = (member, options = {}) => {
    const defaultValues = {
        title: null,
        description: null,
        color: 0xff8282,
        thumbnail: null,
        image: null,
        fields: [],
        footer: {}
    }
    for(let key in defaultValues) options[key] ??= defaultValues[key];

    return new EmbedBuilder()
        .setColor(options.color)
        .setAuthor({
            name: member.displayName,
            iconURL: member.displayAvatarURL()
        })
        .setTitle(options.title)
        .setDescription(options.description)
        .setThumbnail(options.thumbnail)
        .setImage(options.image)
        .addFields(options.fields)
        .setFooter({
            text: options.footer.text || null,
            iconURL: options.footer.iconURL || null
        })
        .setTimestamp()
}
module.exports.defaultUserEmbed = defaultUserEmbed;

module.exports.errorEmbed = (memeber, description) => defaultUserEmbed(memeber, {
    title: '오류',
    description,
    color: 0xff0000
});

module.exports.getCommandMention = (commandName, subCommand) => {
    const commands = client.guilds.cache.get(process.argv[3] || Server.guild).commands.cache;
    const command = commands.find(c => c.name === commandName);

    if(!command) return null;

    return `</${commandName}${subCommand ? ` ${subCommand}` : ''}:${command.id}>`;
}

module.exports.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports.getAllUrlInString = str => {
    const regex = /(https?:\/\/\S+)/g;
    return str.match(regex) || [];
}