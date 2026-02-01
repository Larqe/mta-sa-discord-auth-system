const { Client, Intents, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');
const fs = require('fs');
const config = require('../config.json');

// Veritabanı bağlantısı kur
const dbConnection = mysql.createConnection(config.db);

// JSON dosyası
const kayitDosyasi = 'kayitlar.json';

// Eğer kayıt dosyası yoksa oluştur
if (!fs.existsSync(kayitDosyasi)) {
    fs.writeFileSync(kayitDosyasi, JSON.stringify({}));
}

module.exports = {
    name: "hesapbagla",
    description: 'MTA hesabınızı Discord hesabınıza bağlamaya yarayan bir kod',
    type: 2,
    options: [
        {
            name: 'kod',
            description: 'MTA hesap kodu',
            type: 3,
        }
    ],
    run: async (client, interaction) => {
        const kullaniciid = interaction.user.id;
        const kullaniciavatar = interaction.user.avatar;
        const kullaniciavatarimg = `https://cdn.discordapp.com/avatars/${kullaniciid}/${kullaniciavatar}.png?size=1024`;

        const kod = interaction.options.getString('kod');
        if (!kod) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata Oluştu")
                .setDescription("Lütfen Kod Girmeyi Uunutmayın.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        dbConnection.query('SELECT id FROM accounts WHERE dckod = ?', [kod], (error, results) => {
            if (error) {
                console.error(error);
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Lütfen Tekrar Deneyin.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (results.length > 0) {
                const accountId = results[0].id;

                dbConnection.query('SELECT charactername FROM characters WHERE account = ?', [accountId], (error, results) => {
                    if (error) {
                        console.error(error);
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Hata Oluştu")
                            .setDescription("Lütfen Tekrar Deneyin.")
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    if (results.length > 0) {
                        const characterName = results[0].charactername;

                        
                        interaction.member.setNickname(characterName)
                            .then(() => {
                                
                                const kayitlar = JSON.parse(fs.readFileSync(kayitDosyasi));
                                if (Object.values(kayitlar).includes(interaction.user.id)) {
                                    const embed = new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle("Uyarı")
                                        .setDescription("Bu Hesap Zaten Bağlanmış.")
                                        .setTimestamp();
                                    return interaction.reply({ embeds: [embed], ephemeral: true });
                                }

                                kayitlar[characterName] = interaction.user.id;
                                fs.writeFileSync(kayitDosyasi, JSON.stringify(kayitlar, null, 4));

                                
                                dbConnection.query('UPDATE accounts SET dcavatar = ? WHERE id = ?', [kullaniciavatarimg, accountId], (error) => {
                                    if (error) {
                                        console.error(error);
                                        const embed = new EmbedBuilder()
                                            .setColor("Red")
                                            .setTitle("Hata Oluştu")
                                            .setDescription("Veritabanı güncellenirken bir hata oluştu.")
                                            .setTimestamp();
                                        return interaction.reply({ embeds: [embed], ephemeral: true });
                                    }

                                    const embed = new EmbedBuilder()
                                        .setColor("Green")
                                        .setTitle("İşlem Başarılı Bir Şekilde Gerçekleşti.")
                                        .setDescription("Hesabınız Başarılı Bir Şekilde Bağlandı. Not: 2.Karakteriniz var ise ilk karakterinizi sildirmeniz gerekmektedir , her discord hesabı bir karaktere özeldir")
                                        .addFields(
                                            { name: "Karakter Adı:", value: "```" + `${characterName}` + "```", inline: true },
                                            { name: "Discord ID:", value: "```" + `${kullaniciid}` + "```", inline: true },
                                            { name: "Discord Avatar Kod:", value: "```" + `${kullaniciavatar}` + "```", inline: true }                                            
                                        )
                                        .setImage(`${kullaniciavatarimg}`)
                                        .setTimestamp();
                                    return interaction.reply({ embeds: [embed] });
                                });
                            })
                            .catch(err => {
                                console.error(err);
                                const embed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Hata Oluştu")
                                    .setDescription("Reisim Senin Adını Değişmeye Gücüm Yetmiyor, Yetkiliye Başvur.")
                                    .setTimestamp();
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Hata Oluştu")
                            .setDescription("Karakter Bulunamadı , Yada Kod Almadınız")
                            .setTimestamp();
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                });
            } else {
                
                const kayitlar = JSON.parse(fs.readFileSync(kayitDosyasi));
                if (Object.values(kayitlar).includes(interaction.user.id)) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Bu Hesap Zaten Başkası Tarafından Bağlanmış")
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Böyle Bir Kod Yok yada Alınmadı")
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
        });
    }
};
