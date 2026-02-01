# 🚀 Larqe Discord Auth Bot

MTA:SA sunucunuz ile Discord arasında kesintisiz bir köprü kuran, modern ve gelişmiş bir entegrasyon botu. Bu bot, oyuncularınızın oyun içi karakter verilerine Discord üzerinden anlık olarak erişmesini sağlarken, sunucu yetkililerine de yönetimsel kolaylıklar sunar.

## 🌟 Neden Larqe Auth Bot?

Bu proje, standart bir bottan fazlasını sunar. Veritabanı ile doğrudan iletişim kurarak anlık veri akışı sağlar ve oyuncularınızın sunucuyla olan etkileşimini Discord'a taşır.

### Temel Özellikler

*   **🔒 Güvenli Hesap Eşleme (Auth Sistemi):**
    *   Oyuncular, oyun içerisinden aldıkları özel bir kod ile Discord hesaplarını karakterlerine bağlar.
    *   Sistem, Discord ID'si ile Karakter ismini eşleştirerek güvenli bir `kayitlar.json` veritabanı oluşturur.
    *   Eşleşme sonrası bot, kullanıcının avatarını oyun içi veritabanına dahi işleyebilir.

*   **📊 Detaylı Profil Görüntüleme (`/karakterim`):**
    *   Karakterinizin anlık Sağlık, Zırh, Açlık, Susuzluk değerleri.
    *   Nakit ve Banka bakiyesi.
    *   Oyun içi anlık X, Y, Z konumu ve çevrimiçi/çevrimdışı durumu.
    *   Tüm bu veriler şık ve renkli Embed mesajları ile sunulur.

*   **🎒 Envanter ve Varlık Yönetimi:**
    *   **`/araçlarım`**: Sahip olunan tüm araçları listeler.
    *   **`/eşyalarım`**: Kullanıcının envanterindeki eşyaları gösterir.
    *   **`/silahlarım`** & **`/mermilerim`**: Silah ve mühimmat durumunu raporlar.

*   **🛡️ Yönetim ve Admin Komutları:**
    *   **`/bakiyever` & `/bakiyeal`**: Kullanıcılara oyun içi para ekleme veya silme işlemleri.
    *   **`/vipver`**: Belirlenen süre ve tipte VIP yetkisi tanımlama.
    *   **`/adminver`**: Yetki tanımlamaları için hızlı komutlar.

## ⚙️ Teknik Altyapı

Bot, **Node.js** üzerinde **Discord.js v14** kütüphanesi kullanılarak geliştirilmiştir. Veri işlemleri için **MySQL** bağlantısı kullanır, böylece MTA sunucunuzun veritabanıyla (örneğin `larqedvp`) doğrudan konuşur.

*   **Modern Slash Komutları:** Tüm komutlar `/` öneki ile modern Discord arayüzüne entegredir.
*   **Hızlı ve Hafif:** Gereksiz yük oluşturmaz, `croxydb` ve yerel JSON önbellekleme ile hızlı yanıt verir.

---

## 🚀 Kurulum Rehberi

Botu kendi sunucunuza kurmak için aşağıdaki adımları sırasıyla uygulayın.

### 📋 Gereksinimler
*   [Node.js](https://nodejs.org/en/download/) (v16.9.0 veya üzeri önerilir)
*   Bir MTA:SA Sunucusu ve erişilebilir MySQL Veritabanı
*   Bir Discord Bot Token'ı ([Discord Developer Portal](https://discord.com/developers/applications))

### 1. Adım: Kurulum
Projeyi indirdiğiniz klasörde bir terminal (CMD veya PowerShell) açın ve gerekli modülleri yükleyin:

```bash
npm install
```

### 2. Adım: Yapılandırma
`config.json` dosyasını bir metin editörü (VS Code, Notepad++ vb.) ile açın ve aşağıdaki alanları doldurun:

```json
{
  "clientId": "BOTUNUZUN_ID_ADRESI",
  "guildId": "SUNUCU_ID_ADRESI",
  "TOKEN": "BURAYA_BOT_TOKENI_GELECEK",
  "db": {
      "host": "localhost",       // Veritabanı sunucusu (genelde localhost)
      "user": "root",            // Veritabanı kullanıcı adı
      "password": "",            // Veritabanı şifresi
      "database": "larqedvp"     // MTA sunucunuzun veritabanı adı
    }
}
```

> **Not:** `clientId` ve `guildId`, eğik çizgi (slash) komutlarının sunucunuza anında kaydedilmesi için önemlidir.

### 3. Adım: Başlatma
Her şey hazırsa botu başlatın. Terminale şu komutu yazın:

```bash
node index.js
```
*Veya klasördeki `baslat.bat` dosyasına çift tıklayarak otomatik başlatabilirsiniz.*

Bot açıldığında konsolda şunları göreceksiniz:
> `[COMMAND] ... komutu yüklendi.`
> `[EVENT] ... eventi yüklendi.`
> `Veritabanına başarıyla bağlanıldı.`

---

## 🎮 Kullanım Örneği

1.  Oyuncu MTA sunucusuna girer ve `/kodal` (veya sunucunuzdaki karşılığı) yazarak bir doğrulama kodu edinir (Örn: `12345`).
2.  Discord sunucunuza gelir ve şu komutu yazar:
    > `/hesapbagla kod:12345`
3.  Bot veritabanını kontrol eder. Kod doğruysa:
    *   ✅ Kullanıcının Discord takma adını karakter ismi yapar.
    *   ✅ Discord avatarını oyun veritabanına kaydeder.
    *   ✅ Hesapları kalıcı olarak eşleştirir.

Artık oyuncu `/karakterim` yazdığında kendi verilerini görebilecektir!

---
*Geliştirici: Larqe*
