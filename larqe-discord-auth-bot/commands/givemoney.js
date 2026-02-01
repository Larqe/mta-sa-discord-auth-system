const { Client, Intents, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

// Veritabanı bağlantısı
const dbConnection = mysql.createConnection(config.db);

// Kayıt dosyasının yolu
const kayitDosyasi = path.join(__dirname, '../kayitlar.json');

// Kayıt dosyasını kontrol et ve yükle
if (!fs.existsSync(kayitDosyasi)) {
    fs.writeFileSync(kayitDosyasi, JSON.stringify({}));
}
const kayitlar = JSON.parse(fs.readFileSync(kayitDosyasi));

module.exports = {
    name: "givemoney",
    description: 'Karakterin para değerini değiştirir (Yalnızca admin)',
    type: 1,
    options: [
        {
            name: 'karakter_adı',
            description: 'Para eklenecek karakter adı',
            type: 3, // String
            required: true
        },
        {
            name: 'miktar',
            description: 'Eklemek istediğiniz para miktarı',
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
        const eklenenPara = interaction.options.getInteger('miktar');

        if (eklenenPara <= 0) {
            const paraHataEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata Oluştu")
                .setDescription("Eklemek istediğiniz para miktarı pozitif bir değer olmalıdır.")
                .setTimestamp();
            return interaction.reply({ embeds: [paraHataEmbed], ephemeral: true });
        }

        dbConnection.query(
            'SELECT money FROM characters WHERE charactername = ?',
            [karakterAdi],
            (error, results) => {
                if (error) {
                    console.error("Veritabanı hatası:", error);
                    const dbHataEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Veritabanı sorgusu sırasında bir hata meydana geldi.")
                        .setTimestamp();
                    return interaction.reply({ embeds: [dbHataEmbed], ephemeral: true });
                }

                if (results.length === 0) {
                    const karakterHataEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Belirtilen karakter adına sahip bir kayıt bulunamadı.")
                        .setTimestamp();
                    return interaction.reply({ embeds: [karakterHataEmbed], ephemeral: true });
                }

                const mevcutPara = results[0].money;
                const yeniPara = mevcutPara + eklenenPara;

                dbConnection.query(
                    'UPDATE characters SET money = ? WHERE charactername = ?',
                    [yeniPara, karakterAdi],
                    async (error) => {
                        if (error) {
                            console.error("Para güncelleme hatası:", error);
                            const paraHataEmbed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Hata Oluştu")
                                .setDescription("Para güncelleme işlemi sırasında bir hata oluştu.")
                                .setTimestamp();
                            return interaction.reply({ embeds: [paraHataEmbed], ephemeral: true });
                        }

                        // İşlemi log tablosuna ekle
                        dbConnection.query(
                            'INSERT INTO money_log (karakter_adi, miktar, onceki_para, yeni_para) VALUES (?, ?, ?, ?)',
                            [karakterAdi, eklenenPara, mevcutPara, yeniPara],
                            (logError) => {
                                if (logError) {
                                    console.error("Loglama hatası:", logError);
                                }
                            }
                        );

                        const basariliEmbed = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Para Güncellendi")
                            .setDescription(`**${karakterAdi}** adlı karakterin parası başarıyla güncellendi.`)
                            .addFields(
                                { name: "Eklenen Para:", value: `**${eklenenPara}₺**`, inline: true },
                                { name: "Yeni Para:", value: `**${yeniPara}₺**`, inline: true }
                            )
                            .setTimestamp();

                        await interaction.reply({ embeds: [basariliEmbed] });

                        // Kayıt dosyasından Discord ID'sini al
                        const discordId = kayitlar[karakterAdi];
                        if (discordId) {
                            try {
                                const user = await client.users.fetch(discordId); // Kullanıcıyı getir
                                const dmEmbed = new EmbedBuilder()
                                    .setColor("Blue")
                                    .setTitle("Para Güncellemesi")
                                    .setDescription(`Merhaba, **${karakterAdi}** adlı karakterinizin parası güncellenmiştir.`)
                                    .addFields(
                                        { name: "Eski Para:", value: `**${mevcutPara}₺**`, inline: true },
                                        { name: "Eklenen Para:", value: `**${eklenenPara}₺**`, inline: true },
                                        { name: "Yeni Para:", value: `**${yeniPara}₺**`, inline: true }
                                    )
                                    .setTimestamp();

                                await user.send({ embeds: [dmEmbed] });
                            } catch (err) {
                                console.error("DM gönderim hatası:", err);
                            }
                        } else {
                            console.error(`Kayıt dosyasında **${karakterAdi}** için Discord ID bulunamadı.`);
                        }
                    }
                );
            }
        );
    }
};
