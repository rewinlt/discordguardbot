const Discord = require('discord.js')
const db = require('quick.db');
const Config = require("../../Configuration/Settings.json");
const Salvo_Config = require("../../Configuration/Config.json");

exports.run = async (client, message, args) => {
  
  let salvoembed = new Discord.MessageEmbed().setColor(Config.Embed.Color).setFooter(Config.Embed.Footer).setAuthor(message.member.displayName, message.author.avatarURL({dynamic: true}))
  if (message.author.id !== Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Komutu Sadece <@!${Salvo_Config.Bot.Owner}> Kullanabilir.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  if (args[0] !== 'ekle' && args[0] !== 'çıkar' && args[0] !== 'bilgi') return message.channel.send(salvoembed.setDescription(`**__Kullanım Şekli;__**
  
  \`${Salvo_Config.Bot.Prefix}güvenli ekle\` = Belirtilen Kişiyi Güvenli Listeye Ekler.
  \`${Salvo_Config.Bot.Prefix}güvenli çıkar\` = Belirtilen Kişiyi Güvenli Listeden Çıkarır.
  \`${Salvo_Config.Bot.Prefix}güvenli bilgi\` = Belirtilen Kişinin Güvenli Listede Olup Olmadığı Hakkında Bilgi Verir.`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  
  
if(args[0] == 'ekle') {
  let user = message.mentions.users.first() || client.users.cache.get(args.slice(1).join(' '))
  if(!user) return message.channel.send(salvoembed.setDescription(`Lütfen Bir Kişiyi Etiketleyin`));
  if(user.id == Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Kişiyi Güvenli Listeye Ekleyemezsiniz`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  db.set(`whitelist_${user.id}`, true)
  message.channel.send(salvoembed.setDescription(`${user} Başarılı Bir Şekilde Güvenli Listeye Eklendi`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
}

if (args[0] == 'çıkar') {
  let user = message.mentions.users.first() || client.users.cache.get(args.slice(1).join(' '))
  if(!user) return message.channel.send(salvoembed.setDescription(`Lütfen Bir Kişiyi Etiketleyin`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  if(user.id == Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Kişiyi Güvenli Listeden Çıkaramazsınız`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  let salvo_user = await db.fetch(`whitelist_${user.id}`)
  if (!salvo_user) return message.channel.send(salvoembed.setDescription(`Bu Kullanıcı Zaten Güvenli Listede Değil`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  db.delete(`whitelist_${user.id}`)
  message.channel.send(salvoembed.setDescription(`${user} Başarılı Bir Şekilde Güvenliden Çıkarıldı`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
}

if (args[0] == 'bilgi') {
  let user = message.mentions.users.first() || client.users.cache.get(args.slice(1).join(' '))
  if(!user) return message.channel.send(salvoembed.setDescription(`Lütfen Bir Kişiyi Etiketleyin`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  if(user.id == Salvo_Config.Bot.Owner) return message.channel.send(salvoembed.setDescription(`Bu Kişi Güvenli Listede ve Güvenli Listenin Kontrolünden Sorumlu`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  let salvo_user = await db.fetch(`whitelist_${user.id}`)
  if(salvo_user == true) {
  message.channel.send(salvoembed.setDescription(`${Config.Emojis.Check} ${user} İsimli Kullanıcı Güvenli Listede`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  } else {
  message.channel.send(salvoembed.setDescription(`${Config.Emojis.Delete} ${user} İsimli Kullanıcı Güvenli Listede Değil`)).then(m => m.delete({timeout: Config.Embed.Timeout}));
  }
}

};
exports.conf = {
  aliases: ['güvenli'],
  permLevel: 0
};

exports.help = {
  name: 'güvenli',
  description: 'Salvatore was here',
  usage: 'güvenli'
};