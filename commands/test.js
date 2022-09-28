module.exports = {
    info: {
        name: 'test',
        description: '테스트'
    },
    handler: async interaction => {
        return interaction.reply('제비탈모');
    }
}