// index.js - Botun ana dosyası
require("dotenv").config();
const crypto = require("crypto");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");
const { COMMAND_TO_RANK } = require("./ranks");
const { COMMAND_TO_BRANCH } = require("./branches");
const { RANK_ROLE_IDS, BRANCH_ROLE_IDS } = require("./roleMap");

// ================= AYARLAR =================
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Sheet1";
const GUILD_ID = process.env.GUILD_ID; // rol senkronizasyonu için hangi sunucuda çalışılacağı
// Boş bırakılırsa herkes rütbe/branş komutlarını kullanabilir (Discord'un kendi izin ayarına güvenilir).
const ALLOWED_ROLE_IDS = (process.env.ALLOWED_ROLE_IDS || "")
	.split(",")
	.map((id) => id.trim())
	.filter(Boolean);
// Doğrulama kodunun geçerlilik süresi (dakika)
const VERIFY_CODE_TTL_MINUTES = 15;
// =============================================

// ---- Google Sheets bağlantısı ----
const auth = new google.auth.JWT(
	process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	null,
	(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
	["https://www.googleapis.com/auth/spreadsheets"]
);
const sheets = google.sheets({ version: "v4", auth });

// Sütun sırası: A=UserID, B=Rank, C=Brans, D=Birim, E=DiscordID
const COLUMN_INDEX = { B: 1, C: 2, D: 3, E: 4 };

// UserID'yi tabloda arar, tüm satırı döndürür (bulamazsa null)
async function getRow(userId) {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: SPREADSHEET_ID,
		range: `${SHEET_NAME}!A2:E`, // 1. satır başlık, 2. satırdan itibaren tara
	});
	const rows = res.data.values || [];
	for (let i = 0; i < rows.length; i++) {
		if (rows[i][0] && String(rows[i][0]).trim() === String(userId)) {
			return {
				rowNumber: i + 2, // gerçek tablo satır numarası
				userId: rows[i][0],
				rank: rows[i][1] || "",
				brans: rows[i][2] || "",
				birim: rows[i][3] || "",
				discordId: rows[i][4] || "",
			};
		}
	}
	return null;
}

// Belirtilen sütuna (B=Rank, C=Brans, D=Birim, E=DiscordID) değeri yazar.
// Kullanıcı tabloda yoksa yeni satır olarak ekler (diğer sütunlar boş bırakılır).
async function setField(userId, column, value) {
	const row = await getRow(userId);

	if (row) {
		await sheets.spreadsheets.values.update({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!${column}${row.rowNumber}`,
			valueInputOption: "RAW",
			requestBody: { values: [[value]] },
		});
		return "updated";
	} else {
		const newRow = [userId, "", "", "", ""];
		newRow[COLUMN_INDEX[column]] = value;

		await sheets.spreadsheets.values.append({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!A:E`,
			valueInputOption: "RAW",
			insertDataOption: "INSERT_ROWS",
			requestBody: { values: [newRow] },
		});
		return "created";
	}
}

// ---- Roblox API yardımcıları ----

// Kullanıcı adından Roblox UserID + gerçek kullanıcı adını bulur
async function resolveRobloxUser(username) {
	const res = await fetch("https://users.roblox.com/v1/usernames/users", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
	});
	if (!res.ok) return null;
	const data = await res.json();
	if (!data.data || data.data.length === 0) return null;
	return data.data[0]; // { id, name, displayName }
}

// UserID'den Roblox kullanıcı adını çeker (sadece görünüm için)
async function getRobloxUsername(userId) {
	try {
		const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.name || null;
	} catch (e) {
		return null;
	}
}

// UserID'nin Roblox profil açıklamasını ("Hakkında"/About) çeker
async function getRobloxDescription(userId) {
	const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
	if (!res.ok) return null;
	const data = await res.json();
	return data.description || "";
}

// ---- Doğrulama kodu yönetimi (bellekte tutulur) ----
// [discordId] -> { code, robloxUserId, robloxUsername, expiresAt }
const pendingVerifications = new Map();

function generateVerifyCode() {
	return "TAS-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

// ---- Discord rol senkronizasyonu ----
// Bir kullanıcıya rütbe/branş verildiğinde, doğrulanmışsa (DiscordID bağlıysa)
// Discord'daki karşılık gelen rolü de otomatik ayarlar.
async function syncDiscordRole(guild, discordId, fieldType, value) {
	if (!discordId || !guild) return;

	const roleMap = fieldType === "rank" ? RANK_ROLE_IDS : BRANCH_ROLE_IDS;
	const targetRoleId = roleMap[value];
	const allCategoryRoleIds = Object.values(roleMap).filter(Boolean);

	try {
		const member = await guild.members.fetch(discordId);

		// Aynı kategorideki (rütbe ya da branş) diğer rolleri kaldır, birden fazla
		// rütbe/branş rolü aynı anda üstünde kalmasın.
		const rolesToRemove = member.roles.cache.filter(
			(r) => allCategoryRoleIds.includes(r.id) && r.id !== targetRoleId
		);
		if (rolesToRemove.size > 0) {
			await member.roles.remove(rolesToRemove);
		}

		if (targetRoleId && !member.roles.cache.has(targetRoleId)) {
			await member.roles.add(targetRoleId);
		}
	} catch (error) {
		console.warn(
			`[RoleSync] ${discordId} için Discord rolü güncellenemedi: ${error.message}`
		);
	}
}

// ---- Discord botu ----
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
	console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	// ===== /dogrula =====
	if (interaction.commandName === "dogrula") {
		const username = interaction.options.getString("kullaniciadi");
		await interaction.deferReply({ ephemeral: true });

		const robloxUser = await resolveRobloxUser(username);
		if (!robloxUser) {
			await interaction.editReply(
				`"${username}" adında bir Roblox kullanıcısı bulunamadı. Kullanıcı adını kontrol et.`
			);
			return;
		}

		const code = generateVerifyCode();
		pendingVerifications.set(interaction.user.id, {
			code,
			robloxUserId: robloxUser.id,
			robloxUsername: robloxUser.name,
			expiresAt: Date.now() + VERIFY_CODE_TTL_MINUTES * 60 * 1000,
		});

		await interaction.editReply(
			`**${robloxUser.name}** hesabını doğrulamak için:\n\n` +
				`1) Roblox profilinin **"Açıklama" (About)** kısmına şu kodu ekle:\n` +
				`\`${code}\`\n\n` +
				`2) Kodu ekledikten sonra buraya dön ve **/dogrulatamamla** yaz.\n\n` +
				`Bu kod ${VERIFY_CODE_TTL_MINUTES} dakika geçerlidir.`
		);
		return;
	}

	// ===== /dogrulatamamla =====
	if (interaction.commandName === "dogrulatamamla") {
		const pending = pendingVerifications.get(interaction.user.id);

		if (!pending) {
			await interaction.reply({
				content: "Önce **/dogrula** komutuyla doğrulama başlatmalısın.",
				ephemeral: true,
			});
			return;
		}

		if (Date.now() > pending.expiresAt) {
			pendingVerifications.delete(interaction.user.id);
			await interaction.reply({
				content: "Kodun süresi doldu. **/dogrula** ile tekrar başlat.",
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply({ ephemeral: true });

		const description = await getRobloxDescription(pending.robloxUserId);
		if (description === null) {
			await interaction.editReply("Roblox profiline ulaşılamadı, birazdan tekrar dene.");
			return;
		}

		if (!description.includes(pending.code)) {
			await interaction.editReply(
				`Kod profilinde bulunamadı. "${pending.code}" kodunun Roblox profilinin ` +
					`Açıklama kısmında olduğundan emin ol (kaydettikten sonra birkaç dakika sürebilir), sonra tekrar dene.`
			);
			return;
		}

		// Doğrulama başarılı: Discord ID'sini tabloya yaz
		await setField(pending.robloxUserId, "E", interaction.user.id);
		pendingVerifications.delete(interaction.user.id);

		// Kullanıcının tabloda zaten bir rütbe/branşı varsa, Discord rolünü hemen senkronize et
		if (GUILD_ID) {
			try {
				const guild = await client.guilds.fetch(GUILD_ID);
				const row = await getRow(pending.robloxUserId);
				if (row) {
					if (row.rank) await syncDiscordRole(guild, interaction.user.id, "rank", row.rank);
					if (row.brans) await syncDiscordRole(guild, interaction.user.id, "branch", row.brans);
				}
			} catch (error) {
				console.warn("[Verify] Doğrulama sonrası rol senkronizasyonu başarısız:", error.message);
			}
		}

		await interaction.editReply(
			`Doğrulama tamamlandı! Discord hesabın artık Roblox hesabın **${pending.robloxUsername}** ile eşleşti.`
		);
		return;
	}

	// ===== Rütbe / Branş verme komutları =====
	let fieldType = null; // "rank" veya "branch"
	let value = null;
	let column = null;

	if (COMMAND_TO_RANK[interaction.commandName]) {
		fieldType = "rank";
		value = COMMAND_TO_RANK[interaction.commandName];
		column = "B";
	} else if (COMMAND_TO_BRANCH[interaction.commandName]) {
		fieldType = "branch";
		value = COMMAND_TO_BRANCH[interaction.commandName];
		column = "C";
	} else {
		return; // bu bota ait olmayan bir komut
	}

	if (ALLOWED_ROLE_IDS.length > 0) {
		const memberRoles = interaction.member?.roles?.cache;
		const hasPermission =
			memberRoles && ALLOWED_ROLE_IDS.some((roleId) => memberRoles.has(roleId));
		if (!hasPermission) {
			await interaction.reply({
				content: "Bu komutu kullanma yetkin yok.",
				ephemeral: true,
			});
			return;
		}
	}

	const userId = interaction.options.getInteger("userid");

	await interaction.deferReply();

	try {
		const result = await setField(userId, column, value);
		const username = await getRobloxUsername(userId);
		const displayName = username ? `${username} (${userId})` : `${userId}`;
		const fieldLabel = fieldType === "rank" ? "rütbesi" : "branşı";
		const titleLabel = fieldType === "rank" ? "Rütbe Güncellendi" : "Branş Güncellendi";

		let roleSyncNote = "";
		if (GUILD_ID) {
			const row = await getRow(userId);
			if (row && row.discordId) {
				const guild = await client.guilds.fetch(GUILD_ID);
				await syncDiscordRole(guild, row.discordId, fieldType, value);
				roleSyncNote = "\nDiscord rolü de otomatik güncellendi (hesap doğrulanmış).";
			} else {
				roleSyncNote = "\n(Bu kullanıcı Discord ile doğrulanmamış, sadece oyun tablosuna yazıldı.)";
			}
		}

		const embed = new EmbedBuilder()
			.setColor(0x2ecc71)
			.setTitle(titleLabel)
			.setDescription(
				`**${displayName}** kullanıcısına **${value}** ${fieldLabel} verildi.` +
					(result === "created" ? "\n(Kullanıcı tabloda bulunamadığı için yeni kayıt olarak eklendi.)" : "") +
					roleSyncNote
			)
			.setFooter({ text: "Değişikliğin oyuna yansıması birkaç dakika sürebilir." });

		await interaction.editReply({ embeds: [embed] });
	} catch (error) {
		console.error("Alan güncelleme hatası:", error);
		await interaction.editReply(
			"Bir hata oluştu, güncelleme yapılamadı. Konsol loglarını kontrol edin."
		);
	}
});

client.login(process.env.DISCORD_TOKEN);
