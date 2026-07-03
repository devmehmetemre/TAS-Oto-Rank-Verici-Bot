// index.js - Botun ana dosyası
require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");
const { COMMAND_TO_RANK } = require("./ranks");

// ================= AYARLAR =================
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Sheet1";
// Boş bırakılırsa herkes komutları kullanabilir (Discord'un kendi izin ayarına güvenilir).
// Ekstra bir kod-seviyesi kilit istersen buraya rol ID'lerini virgülle yaz: "12345,67890"
const ALLOWED_ROLE_IDS = (process.env.ALLOWED_ROLE_IDS || "")
	.split(",")
	.map((id) => id.trim())
	.filter(Boolean);
// =============================================

// ---- Google Sheets bağlantısı ----
const auth = new google.auth.JWT(
	process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	null,
	(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
	["https://www.googleapis.com/auth/spreadsheets"]
);
const sheets = google.sheets({ version: "v4", auth });

// UserID'yi tabloda arar, satır numarasını döndürür (bulamazsa null)
async function findRowByUserId(userId) {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: SPREADSHEET_ID,
		range: `${SHEET_NAME}!A2:A`, // 1. satır başlık, 2. satırdan itibaren tara
	});
	const rows = res.data.values || [];
	for (let i = 0; i < rows.length; i++) {
		if (rows[i][0] && String(rows[i][0]).trim() === String(userId)) {
			return i + 2; // gerçek tablo satır numarası (A2'den başladığımız için +2)
		}
	}
	return null;
}

// Rütbeyi tabloya yazar. Kullanıcı tabloda yoksa yeni satır olarak ekler.
async function setRank(userId, rankName) {
	const rowNumber = await findRowByUserId(userId);

	if (rowNumber) {
		await sheets.spreadsheets.values.update({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!B${rowNumber}`, // B sütunu = Rank
			valueInputOption: "RAW",
			requestBody: { values: [[rankName]] },
		});
		return "updated";
	} else {
		await sheets.spreadsheets.values.append({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!A:D`,
			valueInputOption: "RAW",
			insertDataOption: "INSERT_ROWS",
			requestBody: { values: [[userId, rankName, "", ""]] }, // UserID, Rank, Brans, Birim
		});
		return "created";
	}
}

// Roblox kullanıcı adını UserID'den çeker (sadece güzel görünüm için, hata olursa sorun değil)
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

// ---- Discord botu ----
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
	console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const rankName = COMMAND_TO_RANK[interaction.commandName];
	if (!rankName) return; // bu bota ait olmayan bir komut

	// Ekstra kod-seviyesi rol kontrolü (ALLOWED_ROLE_IDS doluysa)
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
		const result = await setRank(userId, rankName);
		const username = await getRobloxUsername(userId);
		const displayName = username ? `${username} (${userId})` : `${userId}`;

		const embed = new EmbedBuilder()
			.setColor(0x2ecc71)
			.setTitle("Rütbe Güncellendi")
			.setDescription(
				`**${displayName}** kullanıcısına **${rankName}** rütbesi verildi.` +
					(result === "created" ? "\n(Kullanıcı tabloda bulunamadığı için yeni kayıt olarak eklendi.)" : "")
			)
			.setFooter({ text: "Değişikliğin oyuna yansıması birkaç dakika sürebilir." });

		await interaction.editReply({ embeds: [embed] });
	} catch (error) {
		console.error("Rütbe verme hatası:", error);
		await interaction.editReply(
			"Bir hata oluştu, rütbe verilemedi. Konsol loglarını kontrol edin."
		);
	}
});

client.login(process.env.DISCORD_TOKEN);
