const Discord = require('discord.js');
const client = new Discord.Client();
const db = require('quick.db');
const Config = require("../../Configuration/Settings.json");
const Salvo_Config = require("../../Configuration/Config.json");

exports.run = async (client, message, args) => {
  
let salvoembed = new Discord.MessageEmbed().setColor(Config.Embed.Color).setFooter(Config.Embed.Footer).setAuthor(message.member.displayName, message.author.avatarURL({dynamic: true}))
if (message.author.id !== Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Komutu Sadece <@!${Salvo_Config.Bot.Owner}> Kullanabilir.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
let sagtik = await message.channel.send(salvoembed.setDescription(`**__Sağ Tık Koruma - Kick Engel;__**

Bu işlemi kabul ederseniz whitelistte olan kullanıcılar haricinde 
sağ tık kullanarak üye kickleyen herkes engellenecektir.

✅ : \`Aktif Et\`, ❎ : \`Pasif Bırak\`, 🗑️ : \`İptal Et\`
`))
sagtik.react("✅").then(() => sagtik.react("❎")).then(() => sagtik.react("🗑️"));
const filter = (reaction, user) => {
return(
    ["✅","❎","🗑️"].includes(reaction.emoji.name) &&
    user.id === message.author.id
);
}
sagtik.awaitReactions(filter, {max: 1, time: 120000, errors: ["time"]})
.then((collected) => {
const reaction = collected.first();
if (reaction.emoji.name === "✅") {
    sagtik.edit(salvoembed.setColor("RANDOM").setDescription(`Sağ Tık Koruma - Kick Engel Başarılı Bir Şekilde Aktif Edildi.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
    sagtik.reactions.removeAll().catch(error => console.error("Bir Hata Oluştu: : ", error));
    message.react(Config.Emojis.Check);
    aktifEt();
} else if (reaction.emoji.name === "❎") {
    sagtik.edit(salvoembed.setColor("RANDOM").setDescription(`Sağ Tık Koruma - Kick Engel Başarılı Bir Şekilde Pasif Bırakıldı.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
    sagtik.reactions.removeAll().catch(error => console.error("Bir Hata Oluştu: : ", error));
    message.react(Config.Emojis.Check);
    pasifEt();
} else if (reaction.emoji.name === "🗑️") {
    sagtik.edit(salvoembed.setColor("RANDOM").setDescription(`İşleminiz İptal Edildi.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
    sagtik.reactions.removeAll().catch(error => console.error("Bir Hata Oluştu: : ", error));
    message.react(Config.Emojis.Delete);
} 
})

const aktifEt = async () => {
    db.set(`${message.guild.id}_sagtik_kick`, "aktif")
};

const pasifEt = async () => {
    db.delete(`${message.guild.id}_sagtik_kick`)
};

};
exports.conf = {
  aliases: ['sag-tık-kick', 'sağ-tık-kick'],
  permLevel: 0
};

exports.help = {
  name: 'sag-tık-kick',
  description: 'Salvatore was here',
  usage: 'sag-tık-kick'
};