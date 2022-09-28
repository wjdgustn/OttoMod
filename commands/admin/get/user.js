const { escapeCodeBlock } = require('discord.js');

const User = require('../../../schemas/user');

module.exports = async interaction => {
    const user = interaction.options.getUser('user');

    const dbUser = await User.findOne({
        id: user.id
    });
    if(!dbUser) return interaction.reply({
        content: '해당 유저를 찾을 수 없습니다.',
        ephemeral: true
    });

    return interaction.reply({
        content: `\`\`\`json\n${escapeCodeBlock(JSON.stringify(dbUser, null, 2))}\n\`\`\``,
        ephemeral: true
    });
}