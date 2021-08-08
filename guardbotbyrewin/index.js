const Discord = require('discord.js');
const client = new Discord.Client({fetchAllMembers: true});       
const Config = require("./Configuration/Config.json");
const settings = require("./Configuration/Settings.json");
const fs = require("fs");
const request = require("request");
const db = require("quick.db");
const moment = require("moment");
require("moment-duration-format");
const AsciiTable = require('ascii-table');
global.conf = Config;
global.client = client;
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
let Prefix = Config.Bot.Prefix;


fs.readdirSync('./Commands').forEach(dir => {
const commandFiles = fs.readdirSync(`./Commands/${dir}/`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const salvo = require(`./Commands/${dir}/${file}`);
  var table = new AsciiTable('Rewin DEV Command Table');
  table.setHeading("Command", 'Status', "Aliases")
  if (salvo.help.name) {
  client.commands.set(salvo.help.name, salvo);
  table.addRow(salvo.help.name, "✔️", salvo.conf.aliases)
} else {
  table.addRow(salvo.help.name, "❌")
  continue;
    }
    salvo.conf.aliases.forEach(alias => {
      client.aliases.set(alias, salvo.help.name);
    });
    console.log(table.toString())
  }
})

client.on("message", message => {
  let client = message.client;
  if (message.author.bot) return;
  if (!message.content.startsWith(Prefix)) return;
  let command = message.content.split(' ')[0].slice(Prefix.length);
  let params = message.content.split(' ').slice(1);
  let perms = client.elevation(message);
  let cmd;
  if (client.commands.has(command)) {
    cmd = client.commands.get(command);
  } else if (client.aliases.has(command)) {
    cmd = client.commands.get(client.aliases.get(command));
  }
  if (cmd) {
    if (perms < cmd.conf.permLevel) return;
    cmd.run(client, message, params, perms);
  }
});

client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === Config) permlvl = 4;
  return permlvl;
};




client.on("ready", async () => {
client.user.setPresence({ activity: { name: Config.Bot.Activity }, status: Config.Bot.Status }, {type: Config.Bot.Status_Type});
client.channels.cache.get(Config.Bot.Voice_Channel).join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
});




// DATABASE BACKUP - QUİCK.DB
const backup = () => {
  fs.copyFile('./json.sqlite', `./Database/Data • ${moment().format('D-M-YYYY • H.mm.ss')} • salvocode.sqlite`, err => {
      if (err) return console.log(err);
      console.log(`Database Yedeklendi. ${moment().format('D-M-YYYY - H.mm.ss')}`);
  });
};

client.on('ready', () => {
  setInterval(() => backup(), 1000 * 60 * 60 * 24); 
});






// CEZA İŞLEM
const yetkiler = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezaislem(kisiID, cezaturu) {
  let uye = client.guilds.cache.get(settings.Server.Id).members.cache.get(kisiID);
  if (!uye) return;
  if (cezaturu == "ban") return uye.ban({ reason: "Rewin Guard Koruma" }).catch();
  if (cezaturu == "jail") return uye.roles.cache.has(settings.Roles.Booster_Role) ? uye.roles.set([settings.Roles.Booster_Role, settings.Roles.Jail_Role]) : uye.roles.set([settings.Roles.Jail_Role]);
};





// KANAL KORUMA - KANAL SİLME ENGEL
client.on("channelDelete", async channel => {
  let salvoguard = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
  if(!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${channel.guild.id}_kanalkoruma_delete`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
    return;
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  await channel.clone({ reason: "Rewin Guard Kanal Koruma" }).then(async kanal => {
  if (channel.parentID != null) await kanal.setParent(channel.parentID);
  await kanal.setPosition(channel.position);
  if (channel.type == "category") await channel.guild.channels.cache.filter(k => k.parentID == channel.id).forEach(x => x.setParent(kanal.id));
  });
  let logkanal = client.channels.cache.get(settings.Channels.Channel_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kanal Silindi;**

  • \`Silen Kişi:\` ${salvoguard.executor} 
  • \`Silen Kişi ID:\` **${salvoguard.executor.id}**
  • \`Silinen Kanal:\` **${channel.name}**
  • \`İşlem:\` **Kanal Açıldı, ${salvoguard.executor} Cezalandırıldı**`)); }  
  }  
} else {
  return;
  }
});





// KANAL KORUMA - KANAL OLUŞTURMA ENGEL
client.on("channelCreate", async channel => {
  let salvoguard = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());
  if(!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${channel.guild.id}_kanalkoruma_create`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  channel.delete({reason: "Rewin Guard Kanal Koruma"});
  cezaislem(salvoguard.executor.id, "jail");
  let logkanal = client.channels.cache.get(settings.Channels.Channel_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kanal Oluşturuldu;**
  
  • \`Oluşturan Kişi:\` ${salvoguard.executor} 
  • \`Oluşturan Kişi ID:\` **${salvoguard.executor.id}**
  • \`Oluşturulan Kanal:\` **${channel.name}**
  • \`İşlem:\` **Kanal Silindi, ${salvoguard.executor} Cezalandırıldı**`)); }  
  }
} else {
  return;
  }
});







// KANAL KORUMA - KANAL UPDATE ENGEL
client.on("channelUpdate", async (oldChannel, newChannel) => {
  let salvoguard = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${newChannel.guild.id}_kanalkoruma_update`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
  newChannel.edit({
  name: oldChannel.name,
  });
  } else if (newChannel.type === "text") {
  newChannel.edit({
  name: oldChannel.name,
  topic: oldChannel.topic,
  nsfw: oldChannel.nsfw,
  rateLimitPerUser: oldChannel.rateLimitPerUser
  });
  } else if (newChannel.type === "voice") {
  newChannel.edit({
  name: oldChannel.name,
  bitrate: oldChannel.bitrate,
  userLimit: oldChannel.userLimit,
  });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
  let thisPermOverwrites = {};
  perm.allow.toArray().forEach(p => {
  thisPermOverwrites[p] = true;
  });
  perm.deny.toArray().forEach(p => {
  thisPermOverwrites[p] = false;
  });
  newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  let logkanal = client.channels.cache.get(settings.Channels.Channel_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kanal Düzenlendi;**
  
  • \`Güncelleyen Kişi:\` ${salvoguard.executor} 
  • \`Güncelleyen Kişi ID:\` **${salvoguard.executor.id}**
  • \`Güncellenen Kanal:\` **${oldChannel.name}**
  • \`İşlem:\` **Kanal Eski Haline Getirildi, ${salvoguard.executor} Cezalandırıldı**`)); } 
}
} else {
  return;
  }
});





// ROL KORUMA - ROL SİLME ENGEL
client.on("roleDelete", async role => {
  let salvoguard = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${role.guild.id}_rolkoruma_delete`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  let newrol = await role.guild.roles.create({
  data: {
  color: role.hexColor,
  name: role.name,
  permissions: role.permissions,
  hoist: role.hoist,
  position: role.position,
  mentionable: role.mentionable
  },
  reason: "Rewin Guard Rol Koruma"
  });
  let logkanal = client.channels.cache.get(settings.Channels.Role_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Rol Silindi;**
  
  • \`Silen Kişi:\` ${salvoguard.executor} 
  • \`Silen Kişi ID:\` **${salvoguard.executor.id}**
  • \`Silinen Rol:\` **${role.name}**
  • \`İşlem:\` **Rol Oluşturuldu, ${salvoguard.executor} Cezalandırıldı**`)); } 
}
} else {
  return;
  }
});





// ROL KORUMA - ROL OLUŞTURMA ENGEL
client.on("roleCreate", async role => {
  let salvoguard = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${role.guild.id}_rolkoruma_create`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  role.delete({ reason: "Rewin Guard Rol Koruma" });
  cezaislem(salvoguard.executor.id, "jail");
  let logkanal = client.channels.cache.get(settings.Channels.Role_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Rol Oluşturuldu;**
  
  • \`Oluşturan Kişi:\` ${salvoguard.executor} 
  • \`Oluşturan Kişi ID:\` **${salvoguard.executor.id}**
  • \`Oluşturulan Rol: \` **${role.name}**
  • \`İşlem:\` **Rol Silindi, ${salvoguard.executor} Cezalandırıldı**`)); } 
}
} else {
  return;
  }
});





// ROL KORUMA - ROL UPDATE ENGEL
client.on("roleUpdate", async (oldRole, newRole) => {
  let salvoguard = await newRole.guild.fetchAuditLogs({type: 'ROLE_UPDATE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || !newRole.guild.roles.cache.has(newRole.id) || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${newRole.guild.id}_rolkoruma_update`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  if (yetkiler.some(p => !oldRole.permissions.has(p) && newRole.permissions.has(p))) {
  newRole.setPermissions(oldRole.permissions);
  newRole.guild.roles.cache.filter(r => !r.managed && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_GUILD"))).forEach(r => r.setPermissions(36818497));
  };
  newRole.edit({
  color: oldRole.hexColor,
  name: oldRole.name,
  permissions: oldRole.permissions,
  mentionable: oldRole.mentionable,
  hoist: oldRole.hoist
  });
  let logkanal = client.channels.cache.get(settings.Channels.Role_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Rol Güncellendi;**
  
  • \`Güncelleyen Kişi:\` ${salvoguard.executor}
  • \`Güncelleyen Kişi ID:\` **${salvoguard.executor.id}**
  • \`Güncellenen Rol:\` **${oldRole.name}**
  • \`İşlem:\` **Rol Eski Haline Getirildi, ${salvoguard.executor} Cezalandırıldı.**`)); } 
}
} else {
  return;
  }
});





// SAĞ TIK KORUMA - KİCK ENGEL
client.on("guildMemberRemove", async member => {
  let salvoguard = await member.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${member.guild.id}_sagtik_kick`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  let logkanal = client.channels.cache.get(settings.Channels.Right_Click);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kullanıcı Sunucudan Sağ Tık ile Atıldı;**
  
  • \`Atan Kişi:\` ${salvoguard.executor}
  • \`Atan Kişi ID:\` **${salvoguard.executor.id}**
  • \`Atılan Kişi:\` ${member}
  • \`Atılan Kişi ID:\` **${member.id}**
  • \`İşlem:\` **${salvoguard.executor} Cezalandırıldı.**`)); } 
}
} else {
  return;
  }
});





// SAĞ TIK KORUMA - BAN ENGEL
client.on("guildBanAdd", async (guild, user) => {
  let salvoguard = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor) return;
  if(db.has(`${guild.id}_sagtik_ban`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  guild.members.unban(user.id, "Sağ Tık İle Banlandığı İçin Banı Açıldı").catch(console.error);
  let logkanal = client.channels.cache.get(settings.Channels.Right_Click);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kullanıcı Sunucudan Sağ Tık ile Banlandı;**
  
  • \`Banlayan Kişi:\` ${salvoguard.executor}
  • \`Banlayan Kişi ID:\` **${salvoguard.executor.id}**
  • \`Banlanan Kişi:\` ${user}
  • \`Banlanan Kişi ID:\` **${user.id}**
  • \`İşlem:\` **${user} İsimli Kullanıcının Banı Kaldırıldı, ${salvoguard.executor} Cezalandırıldı.**`)); } 
}
} else {
  return;
  }
});





// SAĞ TIK KORUMA - YETKİ ENGEL
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (newMember.roles.cache.size > oldMember.roles.cache.size) {
  let salvoguard = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${newMember.guild.id}_sagtik_yetki`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  if (yetkiler.some(p => !oldMember.hasPermission(p) && newMember.hasPermission(p))) {
  cezaislem(salvoguard.executor.id, "jail");
  newMember.roles.set(oldMember.roles.cache.map(r => r.id));
  let logkanal = client.channels.cache.get(settings.Channels.Right_Click);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Kullanıcıya Sağ Tık ile Yetki Verildi;**
  
  • \`Yetki Veren Kişi:\` ${salvoguard.executor}
  • \`Yetki Veren Kişi ID:\` **${salvoguard.executor.id}**
  • \`Yetki Verilen Kişi:\` ${newMember}
  • \`Yetki Verilen Kişi ID:\` **${newMember.id}**
  • \`İşlem:\` **${newMember} İsimli Kullanıcıdan Yetki Alındı, ${salvoguard.executor} Cezalandırıldı.**`)); } 
    }
  }
}
} else {
  return;
  }
});





// BOT KORUMA
client.on("guildMemberAdd", async member => {
  let salvoguard = await member.guild.fetchAuditLogs({type: 'BOT_ADD'}).then(audit => audit.entries.first());
  if (!member.user.bot || !salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${member.guild.id}_botkoruma`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  cezaislem(member.id, "ban");
  let logkanal = client.channels.cache.get(settings.Channels.Other_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Bir Bot Eklendi;**
  
  • \`Ekleyen Kişi:\` ${salvoguard.executor}
  • \`Ekleyen Kişi ID:\` **${salvoguard.executor.id}**
  • \`Eklenen Bot:\` ${member}
  • \`Eklenen Bot ID:\` **${member.id}**
  • \`İşlem:\` **${member} İsimli Bot Banlandı, ${salvoguard.executor} Cezalandırıldı.**`)); } 
}
} else {
  return;
  }
});





// URL KORUMA
client.on("guildUpdate", async (oldUrl, newUrl) => {
  newUrl.fetchAuditLogs().then(async (audit) => {
  let salvoguard = audit.entries.first().executor
  if(db.has(`${newUrl.id}_urlkoruma`)) {
  if(salvoguard.id == Config.Bot.Owner) return;
  if(salvoguard.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.id}`)) {
  } else {
  if(oldUrl.vanityURLCode !== newUrl.vanityURLCode) {
  request({
  method: "PATCH",
  url: `https://discord.com/api/guilds/${newUrl.id}/vanity-url`,
  headers: {
  Authorization: `${Config.Bot.Token}`},
  json: {code: `${oldUrl.vanityURLCode}`}});
  newUrl.members.cache.get(salvoguard.id).ban({reason: "Url Değiştirdiği İçin Banlandı"})
  let logkanal = client.channels.cache.get(settings.Channels.Other_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Özel Url Değiştirildi;**
  
  • \`Değiştiren Kişi:\` ${salvoguard}
  • \`Değiştiren Kişi ID:\` **${salvoguard.id}**
  • \`Eski Url:\` ${oldUrl}
  • \`Yeni Url:\` **${newUrl}**
  • \`İşlem:\` **Url Tekrar \`${oldUrl}\` Olarak Düzeltildi, ${salvoguard} Cezalandırıldı.**`)); } 
  }
  }
} else {
  return;
}
})
});





// GUILD UPDATE
client.on("guildUpdate", async (oldGuild, newGuild) => {
  let salvoguard = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!salvoguard || !salvoguard.executor || Date.now()-salvoguard.createdTimestamp > 5000) return;
  if(db.has(`${newGuild.id}_sunucukoruma`)) {
  if(salvoguard.executor.id == Config.Bot.Owner) return;
  if(salvoguard.executor.id == Config.Bot.Client_ID) return;
  if(db.fetch(`whitelist_${salvoguard.executor.id}`)) {
  } else {
  cezaislem(salvoguard.executor.id, "jail");
  if (newGuild.name !== oldGuild.name) newGuild.setName(oldGuild.name);
  if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}));
  let logkanal = client.channels.cache.get(settings.Channels.Other_Log);
  if (logkanal) { logkanal.send(new Discord.MessageEmbed()
  .setColor(settings.Embed.Color)
  .setDescription(`**Sunucu Üzerinde Bir Değişiklik Yapıldı;**
  
  • \`Değiştiren Kişi:\` ${salvoguard.executor}
  • \`Değiştiren Kişi ID:\` **${salvoguard.executor.id}**
  • \`İşlem:\` **Sunucu Eski Haline Getirildi, ${salvoguard.executor} Cezalandırıldı.**`)); } 
}
} else {
  return;
  }
});






client.login(Config.Bot.Token).then(a => {
  console.log('Token Doğru Bot Başlatılıyor...')}).catch(a => {
  return console.error('Token Yanlış!')
})
