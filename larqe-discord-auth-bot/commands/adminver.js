const { Client, Intents, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

// Veritabanı bağlantısı kur
const dbConnection = mysql.createConnection(config.db);

// Dosyanın doğru yolu
const kayitDosyasi = path.join(__dirname, '../kayitlar.json');

// Dosyanın varlığını kontrol et
if (!fs.existsSync(kayitDosyasi)) {
    console.log("kayitlar.json dosyası bulunamadı.");
} else {
    console.log("kayitlar.json dosyası mevcut.");
}

// Dosyayı okuma
let kayitlar = {};
try {
    kayitlar = JSON.parse(fs.readFileSync(kayitDosyasi, 'utf8'));
} catch (error) {
    console.error("Dosya okunurken bir hata oluştu:", error);
}

// Rank belirleme fonksiyonu
function getRankName(rankSayı) {
    switch (rankSayı) {
        case 0: return "Oyuncu";
        case 1: return "A1 | Deneme Yetkili";
        case 2: return "A2 | Stajyer Admin";
        case 3: return "A3 | Oyun Yetkilisi";
        case 4: return "A4 | Tecrübeli Yetkili";
        case 5: return "A5 | Lider Yetkili";
        case 6: return "Üst Yönetim Ekibi";
        case 7: return "Sunucu Sorumlusu";
        case 8: return "Sunucu Sahibi";
        default: return "Bilinmeyen Seviye";
    }
}

module.exports = {
    name: "adminver",
    description: 'Girilen Kullanıcı Adına adminlik verir',
    type: 1,
    options: [
        {
            name: 'kullanici_adi',
            description: 'MTA kullanıcı adı',
            type: 3, // String
            required: true
        },
        {
            name: 'seviye',
            description: 'Kullanıcı adına vermek istediğiniz admin rütbesini giriniz',
            type: 4, // Integer
            required: true
        }
    ],
    run: async (client, interaction) => {
        const sunucuSahibiId = '777295661343178785'; // Sunucu sahibinin Discord ID'si
        const sunucusahibiid2 = '455965432269111307';
        if (interaction.user.id !== sunucuSahibiId || interaction.user.id !== sunucusahibiid2) {
            const yetkiEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Yetki Hatası")
                .setDescription("Bu komutu yalnızca sunucu sahibi kullanabilir.")
                .setTimestamp();
            return interaction.reply({ embeds: [yetkiEmbed], ephemeral: true });
        }
        const kullaniciAdi = interaction.options.getString('kullanici_adi');
        const adminSeviyesi = interaction.options.getInteger('seviye');

        if (adminSeviyesi < 0 || adminSeviyesi > 8) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata Oluştu")
                .setDescription("Geçersiz admin seviyesi. 0 ile 8 arasında bir değer giriniz.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const rankIsı = getRankName(adminSeviyesi);

        dbConnection.query('SELECT id, admin FROM accounts WHERE username = ?', [kullaniciAdi], (accountError, accountResults) => {
            if (accountError || accountResults.length === 0) {
                console.error("Accounts tablosu hatası:", accountError || "Kullanıcı bulunamadı.");
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Kullanıcı veritabanında bulunamadı.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const userId = accountResults[0].id;
            const mevcutAdminSeviye = accountResults[0].admin;

            dbConnection.query('SELECT charactername FROM characters WHERE account = ?', [userId], (characterError, characterResults) => {
                if (characterError || characterResults.length === 0) {
                    console.error("Characters tablosu hatası:", characterError || "Karakter bulunamadı.");
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Karakter bilgisi bulunamadı.")
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const characterName = characterResults[0].charactername;

                dbConnection.query(
                    'UPDATE accounts SET admin = ? WHERE username = ?',
                    [adminSeviyesi, kullaniciAdi],
                    (updateError) => {
                        if (updateError) {
                            console.error("Admin seviyesi güncelleme hatası:", updateError);
                            const embed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Hata Oluştu")
                                .setDescription("Admin seviyesi güncellenirken bir hata oluştu.")
                                .setTimestamp();
                            return interaction.reply({ embeds: [embed], ephemeral: true });
                        }

                        // Log kaydını yap
                        dbConnection.query(
                            'INSERT INTO yetki_log (username, onceki_seviye, yeni_seviye) VALUES (?, ?, ?)',
                            [kullaniciAdi, mevcutAdminSeviye, adminSeviyesi],
                            (logError) => {
                                if (logError) {
                                    console.error("Loglama hatası:", logError);
                                } else {
                                    console.log("Log başarıyla kaydedildi.");
                                }
                            }
                        );

                        const discordId = kayitlar[characterName];
                        if (!discordId) {
                            console.error("Discord ID bulunamadı.");
                            const embed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Hata Oluştu")
                                .setDescription("Discord ID bulunamadı.")
                                .setTimestamp();
                            return interaction.reply({ embeds: [embed], ephemeral: true });
                        }

                        // Kullanıcıya DM gönder
                        client.users.fetch(discordId)
                            .then(async (user) => {
                                const dmEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle("Admin Seviyesi Güncellenmesi")
                                .setDescription(`Merhaba, **${characterName}** adlı hesabın admin seviyesi başarıyla güncellenmiştir.`)
                                .addFields(
                                    { name: "Eski Seviyeniz:", value: `**${mevcutAdminSeviye}**`, inline: true }, // Düzeltilmiş hali
                                    { name: "Yeni Seviyeniz:", value: `**${rankIsı}**`, inline: true }
                                )
                                .setTimestamp();
                            

                                await user.send({ embeds: [dmEmbed] });
                            })
                            .catch((dmError) => {
                                console.error("DM gönderme hatası:", dmError);
                            });

                        // Kullanıcıya yanıt gönder
                        const successEmbed = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Admin Seviyesi Güncellemesi Başarılı")
                            .setDescription(`**${characterName}** adlı karakterin admin seviyesi başarıyla güncellenmiştir.`)
                            .addFields(
                                { name: "Yeni Rütbeniz:", value: `**${rankIsı}**`, inline: true }
                            )
                            .setTimestamp();

                        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    }
                );
            });
        });
    }
};
