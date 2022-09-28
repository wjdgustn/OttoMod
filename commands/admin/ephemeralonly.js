module.exports = async interaction => {
    await interaction.duckUser.update({
        ephemeralOnly: !interaction.dbUser.ephemeralOnly
    });

    return interaction.reply({
        content: `이제 모든 명령어 결과가 ephemeral로 표시${interaction.dbUser.ephemeralOnly ? '되지 않습' : '됩'}니다!`,
        ephemeral: true
    });
}