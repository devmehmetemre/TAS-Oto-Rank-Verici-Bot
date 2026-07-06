// deploy-commands.js
// Bu dosyayı SADECE komutları Discord'a kaydetmek/güncellemek için çalıştırırsın:
//   node deploy-commands.js
// Bot her açıldığında bunu çalıştırman gerekmez, sadece komutlar değiştiğinde.
//
// GUILD_ID .env'de doluysa komutlar SADECE o sunucuya kaydedilir (anında görünür, test için ideal).
// GUILD_ID boşsa komutlar GLOBAL kaydedilir (tüm sunucularda çalışır ama yayılması ~1 saat sürebilir).

require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { RANKS } = require("./ranks");
const { BRANCHES } = require("./branches");

const rankCommands = RANKS.map((rank) => {
	return new SlashCommandBuilder()
		.setName(rank.command)
		.setDescription(`Bir kullanıcıya "${rank.name}" rütbesini verir`)
		.addIntegerOption((option) =>
			option
				.setName("userid")
				.setDescription("Roblox UserID (sayısal)")
				.setRequired(true)
				.setMinValue(1)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.toJSON();
});

const branchCommands = BRANCHES.map((branch) => {
	return new SlashCommandBuilder()
		.setName(branch.command)
		.setDescription(`Bir kullanıcıya "${branch.name}" branşını verir`)
		.addIntegerOption((option) =>
			option
				.setName("userid")
				.setDescription("Roblox UserID (sayısal)")
				.setRequired(true)
				.setMinValue(1)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.toJSON();
});

const verifyCommands = [
	new SlashCommandBuilder()
		.setName("dogrula")
		.setDescription("Discord hesabını Roblox hesabınla eşleştirmeye başlar")
		.addStringOption((option) =>
			option
				.setName("kullaniciadi")
				.setDescription("Roblox kullanıcı adın")
				.setRequired(true)
		)
		.toJSON(),
	new SlashCommandBuilder()
		.setName("dogrulatamamla")
		.setDescription("Roblox profiline eklediğin kodu kontrol edip doğrulamayı tamamlar")
		.toJSON(),
];

const commands = [...rankCommands, ...branchCommands, ...verifyCommands];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`${commands.length} komut kaydediliyor...`);

		if (process.env.GUILD_ID) {
			await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
				{ body: commands }
			);
			console.log("Komutlar sunucuya (guild) kaydedildi. Anında kullanılabilir.");
		} else {
			await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
				body: commands,
			});
			console.log("Komutlar global olarak kaydedildi. Yayılması ~1 saat sürebilir.");
		}
	} catch (error) {
		console.error("Komutlar kaydedilirken hata oluştu:", error);
	}
})();
