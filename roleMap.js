// roleMap.js
// Her rütbe/branş için bir Discord ROL ID'si eşleştir. Discord'da o rütbe/branş
// adında bir rol oluştur, role sağ tıkla > "Kimliği Kopyala" (Copy ID) yap
// (Geliştirici Modu açık olmalı: Discord Ayarlar > Gelişmiş > Geliştirici Modu),
// aşağıdaki tırnakların içine yapıştır.
//
// Bir rütbe/branş için rol istemiyorsan, o satırı boş ("") bırakabilirsin —
// o zaman sadece tabloya yazılır, Discord rolü atanmaz.
//
// ÖNEMLİ: Botun rolü, sunucu rol sıralamasında verdiğin TÜM bu rollerin
// ÜSTÜNDE olmalı, yoksa Discord botun rol vermesine izin vermez.

const RANK_ROLE_IDS = {
	"Er": "1522500573029597257",
	"Onbaşı": "1522500593380364399",
	"Uzman Onbaşı": "1522500610581205164",
	"Çavuş": "1522500820728283166",
	"Uzman Çavuş": "1522500834452045885",
	"Astsubay Çavuş": "1522501128644984882",
	"Astsubay Üstçavuş": "1522501168217985095",
	"Astsubay Başçavuş": "1522501215513219112",
	"Astsubay Kıdemli Çavuş": "1522501241349869638",
	"Astsubay Kıdemli Başçavuş": "1522501396371476611",
	"Asteğmen": "1522501435520974918",
	"Teğmen": "1522501465334091837",
	"Üsteğmen": "1522501484242014238",
	"Yüzbaşı": "1522504934967349378",
	"Binbaşı": "1522501499421196298",
	"Yarbay": "1522501531683913859",
	"Albay": "1522501623493034177",
	"Tuğgeneral": "1522501651179765801",
	"Tümgeneral": "1522501673820491946",
	"Korgeneral": "1522501693680652318",
	"Orgeneral": "1522501755756220417",
	"Paşa": "",
	"Genelkurmay": "1522501785221333124",
	"Genelkurmay Başkanı": "1522501839030059120",
	"Yüksek Askeri Şube": "1522501873226223616",
};

const BRANCH_ROLE_IDS = {
	"Askeri İnzibat": "1522503085438533773",
	"Hava Kuvvetleri": "1522502916055761038",
	"Jandarma": "1522502883612823622",
	"Kara Kuvvetleri": "1522502782563778570",
	"Sınır Müfettişleri": "1522502834770153522",
	"Özel Kuvvetler": "1522502965326250004",
	"İsyancılar": "1522503019046899744",
};

module.exports = { RANK_ROLE_IDS, BRANCH_ROLE_IDS };
