const Discord = require('discord.js')
const db = require('quick.db');
const Config = require("../../Configuration/Settings.json");
const Salvo_Config = require("../../Configuration/Config.json");

exports.run = async (client, message, args) => {
  let prefix = Salvo_Config.Bot.Prefix;
  let salvoembed = new Discord.MessageEmbed().setColor(Config.Embed.Color).setFooter(Config.Embed.Footer).setAuthor(message.member.displayName, message.author.avatarURL({dynamic: true}))
  if (message.author.id !== Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Komutu Sadece <@!${Salvo_Config.Bot.Owner}> Kullanabilir.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));

  message.channel.send(salvoembed.setDescription(`**Hide Guard Yardım Menüsü;**

  ➥ **Kanal Koruma;**

  • \`${prefix}kanal-koruma-create\` = **Kanal Oluşturulmasını Engeller.**
  • \`${prefix}kanal-koruma-delete\` = **Kanal Silinmesini Engeller.**
  • \`${prefix}kanal-koruma-update\` = **Kanal Düzenlenmesini Engeller.**
  
  ➥ **Rol Koruma;**

  • \`${prefix}rol-koruma-create\` = **Rol Oluşturulmasını Engeller.**
  • \`${prefix}rol-koruma-delete\` = **Rol Silinmesini Engeller.**
  • \`${prefix}rol-koruma-update\` = **Rol Düzenlenmesini Engeller.**
  
  ➥ **Sağ Tık Koruma;**

  • \`${prefix}sağ-tık-ban\` = **Sağ Tık Banları Engeller.**
  • \`${prefix}sağ-tık-kick\` = **Sağ Tık Kickleri Engeller.**
  • \`${prefix}sağ-tık-yetki\` = **Sağ Tık Yetki Verilmesini Engeller.**

  ➥ **Sunucu Koruma;**

  • \`${prefix}bot-koruma\` = **Sunucuya Bot Eklenmesini Engeller.**
  • \`${prefix}sunucu-koruma\` = **Sunucunun Düzenlenmesini Engeller.**
  • \`${prefix}url-koruma\` = **Özel Url'nin Değiştirilmesini Engeller.**

  \`Önemli Not:\` *Güvenli Listede Olan Kullanıcılar Yukarıdaki Hiçbir Koruma Tarafından Engellenmez!*
  
  `))

};
exports.conf = {
  aliases: ['yardım'],
  permLevel: 0
};

exports.help = {
  name: 'yardım',
  description: 'Hide was here',
  usage: 'yardım'
};