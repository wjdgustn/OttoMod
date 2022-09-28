const { escapeCodeBlock } = require('discord.js');

const User = require('../../../schemas/user');

module.exports = async interaction => {
    const { options } = interaction;

    const user = options.getUser('user');
    const key = options.getString('key');
    const value = options.getString('value');

    try {
        const updated = await User.findOneAndUpdate({
            id: user.id
        }, {
            [key]: value
        }, {
            new: true
        });
        if(!updated) return interaction.reply('해당 유저를 찾을 수 없습니다.');

        return interaction.reply(`${user.username}님의 "${key}" 값을 "${updated[key]}"(으)로 변경했습니다.`);
    } catch(e) {
        return interaction.reply(`오류가 발생하였습니다.\`\`\`js\n${escapeCodeBlock(e.toString())}\n\`\`\``);
    }
}