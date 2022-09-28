module.exports = async interaction => {
    await interaction.duckUser.update({
        trackError: !interaction.dbUser.trackError
    });

    return interaction.reply({
        content: `이제 오류를 DM으로 받${interaction.dbUser.trackError ? '지 않' : ''}습니다!`,
        ephemeral: true
    });
}