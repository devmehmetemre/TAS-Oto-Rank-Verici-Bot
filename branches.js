// branches.js
// Branş adları (Roblox oyunundaki TeamPermissionServer.lua ile BİREBİR AYNI olmalı).
// Aynı ranks.js mantığı: ASCII-güvenli komut adı, gerçek Türkçe isim tabloya yazılır.

const BRANCHES = [
	{ name: "Askeri İnzibat", command: "askeriinzibatver" },
	{ name: "Hava Kuvvetleri", command: "havakuvvetleriver" },
	{ name: "Jandarma", command: "jandarmaver" },
	{ name: "Kara Kuvvetleri", command: "karakuvvetleriver" },
	{ name: "Sınır Müfettişleri", command: "sinirmufettisleriver" },
	{ name: "Özel Kuvvetler", command: "ozelkuvvetlerver" },
	{ name: "İsyancılar", command: "isyancilarver" },
];

// Hızlı erişim için: komut adı -> branş adı
const COMMAND_TO_BRANCH = {};
for (const branch of BRANCHES) {
	COMMAND_TO_BRANCH[branch.command] = branch.name;
}

module.exports = { BRANCHES, COMMAND_TO_BRANCH };
