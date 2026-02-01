const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const mysql = require('mysql2/promise'); // mysql2/promise modülünü kullanıyoruz
const config = require('../config.json');
const db = require("croxydb");
const fs = require('fs').promises;

// Veritabanı bağlantısı kurma fonksiyonu
async function connectDatabase() {
    try {
        const dbConnection = await mysql.createConnection(config.db);
        console.log('Veritabanına başarıyla bağlanıldı.');
        return dbConnection;
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
        throw error; 
    }
}

module.exports = {
    name: "karakterim",
    description: 'Eğer Hesabınızı Bağladıysanız Karakterinizi Listeler',
    type: 1,
    options: [],
    run: async (client, interaction) => {
        const kullaniciid = interaction.user.id;
        const kullaniciavatar = interaction.user.avatar;
        const kullaniciavatarimg = `https://cdn.discordapp.com/avatars/${kullaniciid}/${kullaniciavatar}.png?size=1024`;
        try {
            const kullaniciid = interaction.user.id;
            console.log(`Kullanıcı ID: ${kullaniciid}`);

            const kayitDosyasi = 'kayitlar.json';
            const kayitlar = JSON.parse(await fs.readFile(kayitDosyasi, 'utf8'));
            console.log(`Kayıtlar: ${JSON.stringify(kayitlar)}`);

            if (!Object.values(kayitlar).includes(kullaniciid)) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Bu hesap bağlanmamış. Lütfen önce hesabınızı bağlayın.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const characterName = Object.keys(kayitlar).find(key => kayitlar[key] === kullaniciid);
            console.log(`Karakter Adı: ${characterName}`);

            const dbConnection = await connectDatabase();
            const [results] = await dbConnection.query('SELECT * FROM characters WHERE charactername = ?', [characterName]);
            if (results.length > 0) {
                const character = results[0];
                const [accounts] = await dbConnection.query('SELECT online FROM accounts WHERE id = ?',[character.account]);
                const accountdurum = accounts[0];
                // Tarih formatını ayarla
                const dateFormat = new Intl.DateTimeFormat('tr-TR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                const zaman = dateFormat.format(new Date(character.lastlogin));

                let durum  = "";
                if(accountdurum.online == 0)
                {
                    durum = "Hayır, Şehirde Değil";
                }
                else
                {
                    durum = "Evet, Şehirde Dolaşıyor";
                }

                const embed = new EmbedBuilder()
                .setColor("#00FF00") // Yeşil renk
                .setTitle(`${character.charactername} - Karakter Bilgileri`)
                .addFields(
                    { name: "Para", value: "```" + `${character.money}` + "```", inline: true },
                    { name: "Banka Parası", value: "```" + `${character.bankmoney}` + "```", inline: true },
                    { name: "Konum", value: "```X: " + `${character.x}` + ", Y: " + `${character.y}` + ", Z: " + `${character.z}` + "```", inline: false },
                    { name: "Şehirdemi ?", value: "```" + `${durum}` + "```", inline: true },
                    { name: "Sağlık Durumu", value: "```" + `${character.health}` + "```", inline: true },
                    { name: "Zırh Durumu", value: "```" + `${character.armor}` + "```", inline: true },
                    { name: "Açlık", value: "```" + `${character.hunger}` + "```", inline: true },
                    { name: "Susuzluk", value: "```" + `${character.thirst}` + "```", inline: true },
                    { name: "Yaş", value: "```" + `${character.age}` + "```", inline: true },
                    { name: "Son Giriş", value: "```" + `${zaman}` + "```", inline: false }                  
                )
                .setImage(`${kullaniciavatarimg}`)
                .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } else {
                console.log("Karakter bulunamadı");
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Hata Oluştu")
                    .setDescription("Karakter bilgileri bulunamadı.")
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error(`Hata: ${error}`);
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Hata Oluştu")
                .setDescription("Beklenmedik bir hata oluştu.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}
