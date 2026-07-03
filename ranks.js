// ranks.js
// Rütbe adları (Roblox oyunundaki PlayerDataService.lua ile BİREBİR AYNI olmalı).
// Her rütbe için ASCII-güvenli bir Discord komut adı üretiyoruz
// (Discord komut isimleri Türkçe karakterlerde/casing'de sorun çıkarabildiği için
// komutlarda "yuzbasiver" gibi sade harfler, tabloya yazarken gerçek "Yüzbaşı" kullanılır).

const RANKS = [
	{ name: "Er", command: "erver" },
	{ name: "Onbaşı", command: "onbasiver" },
	{ name: "Uzman Onbaşı", command: "uzmanonbasiver" },
	{ name: "Çavuş", command: "cavusver" },
	{ name: "Uzman Çavuş", command: "uzmancavusver" },
	{ name: "Astsubay Çavuş", command: "astsubaycavusver" },
	{ name: "Astsubay Üstçavuş", command: "astsubayustcavusver" },
	{ name: "Astsubay Başçavuş", command: "astsubaybascavusver" },
	{ name: "Astsubay Kıdemli Çavuş", command: "astsubaykidemlicavusver" },
	{ name: "Astsubay Kıdemli Başçavuş", command: "astsubaykidemlibascavusver" },
	{ name: "Asteğmen", command: "astegmenver" },
	{ name: "Teğmen", command: "tegmenver" },
	{ name: "Üsteğmen", command: "ustegmenver" },
	{ name: "Yüzbaşı", command: "yuzbasiver" },
	{ name: "Binbaşı", command: "binbasiver" },
	{ name: "Yarbay", command: "yarbayver" },
	{ name: "Albay", command: "albayver" },
	{ name: "Tuğgeneral", command: "tuggeneralver" },
	{ name: "Tümgeneral", command: "tumgeneralver" },
	{ name: "Korgeneral", command: "korgeneralver" },
	{ name: "Orgeneral", command: "orgeneralver" },
	{ name: "Paşa", command: "pasaver" },
	{ name: "Genelkurmay", command: "genelkurmayver" },
	{ name: "Genelkurmay Başkanı", command: "genelkurmaybaskaniver" },
	{ name: "Yüksek Askeri Şube", command: "yuksekaskerisubever" },
];

// Hızlı erişim için: komut adı -> rütbe adı
const COMMAND_TO_RANK = {};
for (const rank of RANKS) {
	COMMAND_TO_RANK[rank.command] = rank.name;
}

module.exports = { RANKS, COMMAND_TO_RANK };
