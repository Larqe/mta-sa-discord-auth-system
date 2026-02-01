const { Client, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const mysql = require('mysql2');
const config = require('../config.json');

// Veritabanı bağlantısı
const dbConnection = mysql.createConnection(config.db);

// Veritabanı bağlantısını kontrol et
dbConnection.connect((err) => {
    if (err) {
        console.error('MySQL bağlantı hatası:', err);
    } else {
        console.log('MySQL veritabanına bağlandı!');
    }
});

const usersData = JSON.parse(fs.readFileSync('kayitlar.json', 'utf8'));

module.exports = {
    name: "vip",
    description: 'VIP değerini değiştirir veya kaldırır (Yalnızca admin)',
    type: 1,
    options: [
        {
            name: 'işlem',
            description: 'VIP al veya ver',
            type: 3, // String
            required: true,
            choices: [
                { name: "al", value: "al" },
                { name: "ver", value: "ver" }
            ]
        },
        {
            name: 'karakter_adı',
            description: 'VIP işlemi yapılacak karakter adı',
            type: 3, // String
            required: true
        },
        {
            name: 'vip_seviyesi',
            description: 'Verilecek VIP seviyesi (sadece /vip ver için)',
            type: 4, // Integer
            required: false
        },
        {
            name: 'gün',
            description: 'VIP süresi (minimum 1, maksimum 30 gün, sadece /vip ver için)',
            type: 4, // Integer
            required: false
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

        const işlem = interaction.options.getString('işlem');
        const karakterAdi = interaction.options.getString('karakter_adı');
        const vipSeviyesi = interaction.options.getInteger('vip_seviyesi') || 0;
        const gün = interaction.options.getInteger('gün') || 0;

        if (işlem === "ver") {
            if (gün < 1 || gün > 30 || vipSeviyesi <= 0) {
                return interaction.reply({
                    content: "Lütfen geçerli bir VIP seviyesi ve 1 ile 30 arasında bir gün değeri girin.",
                    ephemeral: true
                });
            }

            dbConnection.query(
                'SELECT id FROM characters WHERE charactername = ?',
                [karakterAdi],
                async (error, results) => {
                    if (error || results.length === 0) {
                        console.error("Karakter bulunamadı veya veritabanı hatası:", error);
                        const karakterHataEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Hata Oluştu")
                            .setDescription("Belirtilen karakter adına sahip bir kayıt bulunamadı.")
                            .setTimestamp();
                        return interaction.reply({ embeds: [karakterHataEmbed], ephemeral: true });
                    }

                    const charId = results[0].id;
                    const vipEndTick = gün * 24 * 60 * 60 * 1000;

                    dbConnection.query(
                        'INSERT INTO vipplayers (char_id, vip_type, vip_end_tick, karakterIsmi) VALUES (?, ?, ?, ?)',
                        [charId, vipSeviyesi, vipEndTick, karakterAdi],
                        async (insertError) => {
                            if (insertError) {
                                console.error("VIP ekleme hatası:", insertError);
                                const vipHataEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Hata Oluştu")
                                    .setDescription("VIP ekleme işlemi sırasında bir hata oluştu.")
                                    .setTimestamp();
                                return interaction.reply({ embeds: [vipHataEmbed], ephemeral: true });
                            }

                            // Loglama işlemi
                            dbConnection.query(
                                'INSERT INTO vip_log (karakter_adi, vip_seviyesi, gun, islem) VALUES (?, ?, ?, ?)',
                                [karakterAdi, vipSeviyesi, gün, 'ver'],
                                (logError) => {
                                    if (logError) {
                                        console.error("Loglama sırasında hata oluştu:", logError);
                                    }
                                }
                            );

                            // Discord DM gönderimi
                            const discordId = usersData[karakterAdi];
                            if (!discordId) {
                                return interaction.reply({
                                    content: `**${karakterAdi}** karakterine ait bir Discord kullanıcısı bulunamadı.`,
                                    ephemeral: true
                                });
                            }

                            const user = await client.users.fetch(discordId);
                            const dmEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle("VIP Verildi")
                                .setDescription(`Tebrikler! Karakteriniz **${karakterAdi}** için VIP seviyesi başarıyla tanımlandı.`)
                                .addFields(
                                    { name: "VIP Seviyesi:", value: `${vipSeviyesi}`, inline: true },
                                    { name: "VIP Süresi:", value: `${gün} gün`, inline: true }
                                )
                                .setTimestamp();

                            await user.send({ embeds: [dmEmbed] });

                            const vipVerEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle("VIP Verildi")
                                .setDescription(`**${karakterAdi}** adlı karaktere VIP seviyesi başarıyla verildi.`)
                                .addFields(
                                    { name: "VIP Seviyesi:", value: `${vipSeviyesi}`, inline: true },
                                    { name: "VIP Süresi:", value: `${gün} gün`, inline: true }
                                )
                                .setTimestamp();

                            return interaction.reply({ embeds: [vipVerEmbed] });
                        }
                    );
                }
            );
        } else if (işlem === "al") {
            dbConnection.query(
                'DELETE FROM vipplayers WHERE karakterIsmi = ?',
                [karakterAdi],
                async (error, results) => {
                    if (error || results.affectedRows === 0) {
                        console.error("VIP kaldırma hatası veya kayıt bulunamadı:", error);
                        const vipHataEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Hata Oluştu")
                            .setDescription("VIP kaldırma işlemi sırasında bir hata oluştu veya kayıt bulunamadı.")
                            .setTimestamp();
                        return interaction.reply({ embeds: [vipHataEmbed], ephemeral: true });
                    }

                    // Loglama işlemi
                    dbConnection.query(
                        'INSERT INTO vip_log (karakter_adi, vip_seviyesi, gun, islem) VALUES (?, ?, ?, ?)',
                        [karakterAdi, 0, 0, 'al'],
                        (logError) => {
                            if (logError) {
                                console.error("Loglama sırasında hata oluştu:", logError);
                            }
                        }
                    );

                    const discordId = usersData[karakterAdi];
                    if (!discordId) {
                        return interaction.reply({
                            content: `**${karakterAdi}** karakterine ait bir Discord kullanıcısı bulunamadı.`,
                            ephemeral: true
                        });
                    }

                    const user = await client.users.fetch(discordId);
                    const dmEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("VIP Kaldırıldı")
                        .setDescription(`Üzgünüz! **${karakterAdi}** karakterinize tanımlı VIP kaldırılmıştır.`)
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });

                    const vipAlEmbed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("VIP Kaldırıldı")
                        .setDescription(`**${karakterAdi}** adlı karakterin VIP seviyesi başarıyla kaldırıldı.`)
                        .setTimestamp();

                    return interaction.reply({ embeds: [vipAlEmbed] });
                }
            );
        } else {
            const işlemHataEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata")
                .setDescription("Geçersiz işlem. `al` veya `ver` seçmelisiniz.")
                .setTimestamp();
            return interaction.reply({ embeds: [işlemHataEmbed], ephemeral: true });
        }
    }
};
