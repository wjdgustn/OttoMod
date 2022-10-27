const fs = require('fs');

let lang = {};
let channelMap = {};

let loaded = false;

const load = () => {
    lang = {};
    channelMap = {};

    for(let f of fs.readdirSync('./lang')) {
        if(!f.endsWith('.json')) continue;

        const langFile = JSON.parse(fs.readFileSync(`./lang/${f}`).toString());
        const langName = f.replace('.json', '');
        lang[langName] = langFile;
        channelMap[langFile.CHANNEL] = langName;
    }

    loaded = true;
}

module.exports.load = load;

module.exports.langByLangName = (langName, key) => {
    if(!loaded) load();

    if(!lang[langName]) langName = 'en';

    return lang[langName][key]
        || lang['en'][key]
        || lang['ko'][key]
        || `missing key "${key}"`;
}

module.exports.getLangList = () => {
    return Object.keys(lang);
}

module.exports.getCommandName = key => {
    if(!loaded) load();

    const result = {
        nameLocalizations: {}
    }
    result.name = module.exports.langByLangName('en', `COMMAND_${key}`);

    for(let langName in lang) {
        if(langName === 'en') continue;
        const str = module.exports.langByLangName(langName, `COMMAND_${key}`);
        if(str) result.nameLocalizations[langName] = str;
    }

    return result;
}

module.exports.getCommandDescription = key => {
    if(!loaded) load();

    const result = {
        descriptionLocalizations: {}
    }
    result.description = module.exports.langByLangName('en', `COMMAND_${key}`)?.substring(0, 100);

    for(let langName in lang) {
        if(langName === 'en') continue;
        const str = module.exports.langByLangName(langName, `COMMAND_${key}`)?.substring(0, 100);
        if(str) result.descriptionLocalizations[langName] = str;
    }

    return result;
}