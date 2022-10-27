const {
    EmbedBuilder
} = require('discord.js');

const { Server } = require('../main');
const utils = require('../utils');

const messageCache = {};

const spamBanDirectMessages = [
    `
(KOR) 안녕하세요, Rhythm Doctor Lounge 관리 팀에서 보내드리는 메시지입니다.
스팸 링크 봇 활동으로 인해 RDL 서버에서 추방/차단되었습니다. 계정이 탈취되었기에 차단 말고는 다른 선택지가 없었습니다.

현재 디스코드 상에서는 무료 니트로, 공짜 스팀 선물 등을 미끼로 한 수많은 사기가 난립하고 있습니다. 무료 선물에 혹하여 링크를 클릭하거나 개인정보를 입력하지 마십시오. 계정정보 및 개인정보가 탈취되어 공격자에게 악용될 수 있습니다.

* 조치 방법
- 디스코드 계정의 비밀번호를 당장 변경하여 공격자의 접근을 차단하세요. 계정에 더 이상 접근할 수 없다면 디스코드 지원 팀 에게 문의하세요. https://dis.gd/report
- 공격자가 은행 정보, 신용카드 정보, 암호화폐 지갑 등 금융 정보를 탈취했을 가능성도 있습니다. 은행 및 제공업체에 연락하여 계좌정지 및 지급정지를 요청하시기 바라며, 모든 암호화폐 잔액을 새로운 지갑으로 옮기시기 바랍니다. 전에 이용하던 지갑은 방치 및 폐기하세요.
- 또한 공격자는 브라우저에 저장되어 있던 암호 데이터를 탈취했을 수도 있습니다. 모든 웹 사이트의 암호를 변경하시기 바라며, 웹 사이트마다 독특한 암호를 사용하시기 바랍니다.

* 계정 보안을 지키는 방법
- 온라인에서 처음 만나는 낯선 사람들을 믿지 마세요. 그 어떠한 개인정보도 온라인 상에서 공유하지 마세요.
- 알 수 없는 링크는 진짜같이 보이더라도 클릭하지 마세요. 피싱 링크는 종종 오타(discor**cl**, stea**rn** 등)가 포함되어  있습니다. 링크는 클릭 전 반드시 확인해보시기 바랍니다.
- 모든 곳에서 2단계 인증을 켜는 것이 계정 보안에 더욱 효과적입니다. https://support.discord.com/hc/ko/articles/219576828

계정 권한을 다시 복구하고 2단계 인증을 켰다면, 다음 설문지를 작성하여 차단 해제를 요청하실 수 있습니다. https://forms.gle/batx8QHB2NUjiTjw8
    `,
    `
(ENG) Hello, You have been kicked/banned from 'Rhythm Doctor Lounge' server for spamming scam links. As your account was compromised, we had no choice but to ban you.

Many scams are happening on Discord right now, such as fake giveaways. Please do not click on links or enter personal information to be tempted by the offer or gifts. Your account and personal information has been hijacked by attackers and used to spread phishing links.

* Take Action Now
- Change your Discord account's password immediately to cut off access from the attackers. If you are unable to access your account anymore, contact the Discord support team. https://dis.gd/report
- Scammers might have access to your financial information, such as bank account, credit card, PayPal, or cryptocurrency wallet. Contact your banks and providers to get your accounts frozen and cards canceled. For cryptocurrency, you should transfer all of your funds from that wallet into a new one.
- Scammers also might extract your passwords stored in your web browser. Change all of your passwords right away. Use the unique password for each account.

* Best Practices
- Be wary of any strangers who contact you online. Never share any personal details, nothing at all.
- Do not click random unknown links even it looks legitimate. Phishing links will often contain typos (like discor**cl**. stea**rn**), so check them rather than click them.
- It is best to turn on Two-Factor Authentication for your account security. https://support.discord.com/hc/en-us/articles/219576828

If you retrieved your account and have 2FA enabled, use this form to appeal the ban. https://forms.gle/batx8QHB2NUjiTjw8
    `
].map(a => a.trim());

module.exports = client => {
    client.on('messageCreate', async message => {
        for(let user in messageCache) {
            const cache = messageCache[user];
            cache.messages = cache.messages.filter(msg => msg.message.createdTimestamp > Date.now() - 60000);
            if(!cache.messages) delete messageCache[user];
        }

        if(!message.guild || message.author.bot || !message.member.bannable) return;

        const links = utils.getAllUrlInString(message.content);
        if(!links.length) return;

        if(!messageCache[message.author.id]) messageCache[message.author.id] = {
            messages: []
        };
        messageCache[message.author.id].messages.push({
            message,
            links
        });

        const recentLinkMessages = links.map(link => {
            return messageCache[message.author.id].messages.filter(msg => msg.links.includes(link));
        });
        if(!recentLinkMessages.some(a => a.length >= 3)) return;

        try {
            await Promise.all(spamBanDirectMessages.map(a => message.author.send(a)));
        } catch(e) {
            await Server.channel.security.send(`**Warning : This User Blocked DM**\nUser ID : ${message.author.id}\nOr user already Banned`);
        }

        await message.member.ban({
            deleteMessageSeconds: 60,
            reason: 'Scan action detected. (Repeatedly posted the same link)'
        });
        await Server.channel.security.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Scam Action detected in #${message.channel.name}! (Repeatedly posted the same link)`)
                    .setDescription(`Deleted Message:\n\`\`\`${message.content}\`\`\` \n${Server.emoji.kick}  **Member Banned As a result**`)
                    .setFooter({
                        text: `${message.author.tag} • ID : ${message.author.id}`
                    })
                    .setTimestamp()
            ]
        });
        await Server.channel.violations.send(`**${message.author.tag}** was banned by Scam Action. Mods can check details in ${Server.channel.security}.`);
    });
}