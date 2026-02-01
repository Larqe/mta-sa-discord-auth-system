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

// Veritabanı ve JSON dosyasına gerekli işlemleri ekliyoruz
module.exports = {
    name: "bakiyeal",
    description: 'Karakterin bakiyesini alır',
    type: 1,
    options: [
        {
            name: 'karakter_adı',
            description: 'MTA karakter adı',
            type: 3, // String
            required: true
        },
        {
            name: 'miktar',
            description: 'Almak istediğiniz bakiye miktarı',
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
        
        const karakterAdi = interaction.options.getString('karakter_adı');
        const alinanBakiye = interaction.options.getInteger('miktar');

        if (alinanBakiye <= 0) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata Oluştu")
                .setDescription("Almak istediğiniz bakiye miktarı pozitif bir değer olmalıdır.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // İlk olarak 'characters' tablosundan karakteri ve mevcut bakiyeyi alıyoruz
        dbConnection.query('SELECT account, bakiye FROM characters WHERE charactername = ?', [karakterAdi], (charError, charResults) => {
            if (charError) {
                console.error("Karakter sorgusu hatası:", charError);
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Karakter sorgusunda bir hata oluştu.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (charResults.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Belirtilen karakter adıyla eşleşen bir karakter bulunamadı.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const accountId = charResults[0].account;
            const mevcutBakiye = charResults[0].bakiye;

            if (mevcutBakiye < alinanBakiye) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Yetersiz Bakiye")
                    .setDescription("Bu işlem için yeterli bakiye bulunmamaktadır.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const yeniBakiye = mevcutBakiye - alinanBakiye;

            // Bakiyeyi güncelleme işlemi
            dbConnection.query(
                'UPDATE characters SET bakiye = ? WHERE charactername = ?',
                [yeniBakiye, karakterAdi],
                (updateError) => {
                    if (updateError) {
                        console.error("Bakiye güncelleme hatası:", updateError);
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Hata Oluştu")
                            .setDescription("Bakiyeyi güncellerken bir hata meydana geldi.")
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    // Discord'da kullanıcıya DM gönder
                    if (kayitlar[karakterAdi]) {
                        const discordId = kayitlar[karakterAdi];

                        client.users.fetch(discordId)
                            .then(async (user) => {
                                const dmEmbed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setTitle("Bakiye Güncellemesi")
                                    .setDescription(`Merhaba, **${karakterAdi}** adlı karakterinizin bakiyesi başarıyla güncellenmiştir.`)
                                    .addFields(
                                        { name: "Alınan Bakiye:", value: `**${alinanBakiye}₺**`, inline: true },
                                        { name: "Yeni Bakiye:", value: `**${yeniBakiye}₺**`, inline: true }
                                    )
                                    .setTimestamp();

                                await user.send({ embeds: [dmEmbed] });
                            })
                            .catch((err) => {
                                console.error("DM gönderme hatası:", err);
                            });
                    }

                    // Log kaydını veritabanına ekle
                    dbConnection.query(
                        'INSERT INTO bakiyeal_log (username, miktar, onceki_bakiye, yeni_bakiye) VALUES (?, ?, ?, ?)',
                        [karakterAdi, -alinanBakiye, mevcutBakiye, yeniBakiye],
                        (logError) => {
                            if (logError) {
                                console.error("Loglama hatası:", logError);
                                const embed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Loglama Hatası")
                                    .setDescription("Bakiye işlemine ait log kaydının veritabanına eklenmesinde hata meydana geldi.")
                                    .setTimestamp();
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            }
                        }
                    );

                    // Kullanıcıya yanıt ver
                    const successEmbed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("Bakiye Güncellemesi Başarılı")
                        .setDescription(`**${karakterAdi}** adlı karakterin bakiyesi başarıyla güncellenmiştir.`)
                        .addFields(
                            { name: "Alınan Bakiye:", value: `**${alinanBakiye}₺**`, inline: true },
                            { name: "Yeni Bakiye:", value: `**${yeniBakiye}₺**`, inline: true }
                        )
                        .setTimestamp();

                    return interaction.reply({ embeds: [successEmbed], ephemeral: true });
                }
            );
        });
    }
};
