# Asker Oyunu - Discord Rütbe Verme Botu

Discord'da `/erver`, `/onbasiver`, `/albayver` gibi 25 ayrı komutla, bir Roblox
UserID'sine o rütbeyi verir. Rütbe doğrudan oyunun kullandığı Google E-Tablo'ya
yazılır; Roblox oyunu bu tabloyu zaten periyodik olarak yeniden çektiği için
(PlayerDataService.lua, 60 saniyede bir) rütbe değişikliği birkaç dakika içinde
oyuna yansır.

---

## 1) Discord Bot Oluşturma

1. https://discord.com/developers/applications adresine git, **New Application**
   ile yeni bir uygulama oluştur, bir isim ver (örn. "Rütbe Botu").
2. Sol menüden **Bot** sekmesine git, **Reset Token** ile bir token üret,
   kopyala → bunu `.env` dosyasındaki `DISCORD_TOKEN` alanına yapıştıracaksın.
   (Bu token'ı kimseyle paylaşma, botunun şifresi gibidir.)
3. Yine **Bot** sekmesinde **Privileged Gateway Intents** kısmında hiçbirini
   açmana gerek yok (bu bot mesaj okumuyor, sadece slash komut kullanıyor).
4. Sol menüden **OAuth2 > General** sekmesine git, üstteki **Application ID**
   değerini kopyala → `.env` dosyasındaki `CLIENT_ID` alanına yapıştır.
5. Yine **OAuth2 > URL Generator** sekmesine git:
   - **Scopes**: `bot` ve `applications.commands` seç.
   - **Bot Permissions**: `Manage Roles` yeterli (istersen `Administrator` da
     seçebilirsin, ama gerekmez).
   - Altta oluşan linki kopyala, tarayıcıda aç, botu sunucuna ekle.
6. (Opsiyonel ama test için önerilir) Discord'da sunucuna sağ tıkla,
   **Sunucuyu Kopyala Kimliği** (Copy Server ID) yap — Geliştirici Modu kapalıysa
   önce Discord Ayarlar > Gelişmiş > Geliştirici Modu'nu aç. Bu ID'yi
   `.env` dosyasındaki `GUILD_ID` alanına yapıştır (komutların anında aktif
   olması için).

---

## 2) Google Sheets API (Servis Hesabı) Kurulumu

Bu adım, botun tabloya **yazabilmesi** için gerekli (şu anki "Publish to Web"
linki sadece okumaya izin veriyor, yazmaya değil).

1. https://console.cloud.google.com adresine git, yeni bir proje oluştur
   (örn. "asker-oyunu-bot").
2. Üstteki arama çubuğuna **"Google Sheets API"** yaz, aç, **Enable** butonuna bas.
3. Sol menüden **APIs & Services > Credentials** git.
4. **Create Credentials > Service Account** seç, bir isim ver (örn.
   "rutbe-bot"), oluştur.
5. Oluşan servis hesabına tıkla, **Keys** sekmesine git, **Add Key > Create
   New Key > JSON** seç. Bir `.json` dosyası inecek — bu dosyayı sakla,
   içinde `client_email` ve `private_key` alanları var:
   - `client_email` değerini `.env` dosyasındaki `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     alanına yapıştır.
   - `private_key` değerini (BEGIN/END satırları dahil, tırnak işaretleri
     olmadan) `.env` dosyasındaki `GOOGLE_PRIVATE_KEY` alanına yapıştır.
     İçinde `\n` karakterleri olacak, olduğu gibi bırak — kod bunları
     otomatik olarak gerçek satır sonuna çeviriyor.
6. **En kritik adım:** Google E-Tablonu aç, sağ üstteki **Paylaş** butonuna
   bas, `client_email` adresini (örn. `rutbe-bot@proje-adi.iam.gserviceaccount.com`)
   **Düzenleyen (Editor)** yetkisiyle ekle. Bu yapılmazsa bot tabloya yazamaz.
7. Tablonun linkine bak: `https://docs.google.com/spreadsheets/d/BURASI/edit`
   — `BURASI` kısmını `.env` dosyasındaki `SPREADSHEET_ID` alanına yapıştır.
8. Tablonun alt sekme adını (genelde "Sayfa1" ya da "Sheet1") `.env`
   dosyasındaki `SHEET_NAME` alanına yaz — **birebir aynı** olmalı (büyük/küçük
   harf dahil).

---

## 3) Yerel Kurulum ve Test

1. [Node.js](https://nodejs.org) (18 veya üzeri) bilgisayarına kurulu olmalı.
2. Bu klasörde bir terminal aç:
   ```
   npm install
   ```
3. `.env.example` dosyasını kopyalayıp adını `.env` yap, içini az önceki
   adımlarda topladığın bilgilerle doldur.
4. Komutları Discord'a kaydet (sadece bir kere, ya da komutları
   değiştirdiğinde tekrar):
   ```
   npm run deploy-commands
   ```
5. Botu başlat:
   ```
   npm start
   ```
6. Discord'da bir kanala `/erver userid:123456` gibi yaz, denemesini gör.

---

## 4) 7/24 Çalıştırma (Railway ile Deploy)

1. Bu klasörü bir GitHub reposuna yükle (`.env` dosyasını **YÜKLEME**,
   sadece `.env.example` yeterli — `.gitignore` dosyası zaten `.env`'i
   dışarıda bırakır).
2. https://railway.app adresine git, GitHub hesabınla giriş yap.
3. **New Project > Deploy from GitHub repo** ile bu reponu seç.
4. Railway projesi otomatik algılayıp `npm install` + `npm start` çalıştırır.
5. Railway panelinde **Variables** sekmesine git, `.env` dosyandaki tüm
   değerleri tek tek ekle (DISCORD_TOKEN, CLIENT_ID, GUILD_ID,
   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID,
   SHEET_NAME, ALLOWED_ROLE_IDS).
   - `GOOGLE_PRIVATE_KEY` için: değeri olduğu gibi (içindeki `\n`'ler dahil)
     yapıştırman yeterli.
6. Komutları Discord'a kaydetmek için Railway'in **"Run a command"** / CLI
   özelliğiyle bir kere `npm run deploy-commands` çalıştır (ya da yerelinde
   zaten çalıştırdıysan tekrar gerekmez, komutlar Discord tarafında kayıtlı
   kalır).
7. Deploy tamamlanınca bot 7/24 ayakta kalır, bilgisayarını kapatsan bile çalışır.

---

## Notlar

- `ALLOWED_ROLE_IDS` boş bırakılırsa, komutları varsayılan olarak
  **"Rolleri Yönet"** yetkisi olan herkes kullanabilir (Discord'un kendi
  izin sistemi üzerinden). Sunucu Ayarları > Entegrasyonlar kısmından bunu
  istediğin role özel olarak daraltabilirsin. Ekstra bir kod-seviyesi kilit
  istersen `ALLOWED_ROLE_IDS` alanına rol ID'lerini virgülle ayırarak yaz.
- Bir kullanıcı tabloda hiç yoksa, komut onu **yeni bir satır olarak** rütbesiyle
  birlikte ekler (Branş ve Birim boş bırakılır, sonradan tablodan elle doldurabilirsin).
- Google E-Tablo'daki değişikliğin **yayınlanmış CSV linkine** yansıması
  Google tarafında birkaç dakika sürebilir; ayrıca Roblox oyunu bu CSV'yi
  60 saniyede bir yeniden çekiyor. Yani rütbe verildikten sonra oyuna
  yansıması 1-5 dakika sürebilir, bu normaldir.

---

## 5) Roblox Doğrulama + Otomatik Discord Rolü

Tablona artık **E sütunu (DiscordID)** ekleniyor otomatik olarak; elle bir şey
eklemene gerek yok, ama isteğe bağlı olarak E1 hücresine "DiscordID" yazıp
başlık ekleyebilirsin (sadece görünüm için, kod başlığa bakmıyor).

**Kullanıcılar için akış:**
1. `/dogrula kullaniciadi:RobloxKullaniciAdi` yazar.
2. Bot ona bir kod verir (örn. `TAS-A1B2C3`).
3. Roblox profiline gidip **"Açıklama" (About)** kısmına o kodu ekler, kaydeder.
4. `/dogrulatamamla` yazar.
5. Bot kontrol eder, doğrularsa Discord ID'sini tabloya (E sütunu) yazar.

**Rütbe/branş verildiğinde Discord rolünün de otomatik değişmesi için:**
1. Discord sunucunda her rütbe/branş için bir rol oluştur (örn. "Albay", "Kara
   Kuvvetleri" gibi — isimler istediğin gibi olabilir, önemli olan rol ID'si).
2. **Bot rolünü** bu rollerin **üstüne** taşı (Sunucu Ayarları > Roller —
   listede ne kadar yukarıdaysa o kadar "güçlü" sayılır; botun rolü verdiği
   tüm rütbe/branş rollerinin üstünde olmalı, yoksa Discord izin vermez).
3. `roleMap.js` dosyasını aç, her rütbe/branş için ilgili rolün ID'sini
   (Geliştirici Modu açıkken role sağ tık > Kimliği Kopyala) tırnakların
   içine yapıştır. Boş bıraktığın satırlar için sadece tabloya yazılır,
   Discord rolü atanmaz.
4. `.env` dosyanda `GUILD_ID` alanının dolu olduğundan emin ol (rol
   senkronizasyonu hangi sunucuda çalışılacağını bu değerden anlar).
5. Botu yeniden başlat (Railway'deyse yeniden deploy et).

Bundan sonra `/albayver userid:...` çalıştırdığında, o kullanıcı doğrulanmışsa
Discord'daki eski rütbe rolü otomatik kaldırılıp yeni rol otomatik verilir —
sonuçta gelen mesajda "Discord rolü de otomatik güncellendi" notu görürsün.
Doğrulanmamış kullanıcılarda sadece tabloya yazılır, Discord tarafı etkilenmez.

**Not:** Doğrulama kodları bot çalışırken bellekte tutulur — bot yeniden
başlarsa bekleyen (tamamlanmamış) doğrulamalar sıfırlanır, kullanıcı
`/dogrula`'yı tekrar çalıştırması yeterlidir. Tamamlanmış doğrulamalar
(tabloya yazılanlar) etkilenmez, kalıcıdır.
