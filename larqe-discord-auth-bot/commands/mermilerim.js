const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, EmbedBuilder } = require("discord.js");
const mysql = require('mysql2/promise'); // mysql2/promise modülünü kullanıyoruz
const config = require('../config.json');
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

// GTA SA silah ID'leri ve isimleri eşleştirmesi
const weaponNames = {
    0: 'Fist',
    1: 'Brassknuckle',
    2: 'Golfclub',
    3: 'Nightstick',
    4: 'Knife',
    5: 'Bat',
    6: 'Shovel',
    7: 'Poolstick',
    8: 'Katana',
    9: 'Chainsaw',
    22: 'Colt 45',
    23: 'Silenced',
    24: 'Deagle',
    25: 'Shotgun',
    26: 'Sawed-off',
    27: 'Combat Shotgun',
    28: 'Uzi',
    29: 'MP5',
    30: 'AK-47',
    31: 'M4',
    32: 'Tec-9',
    33: 'Rifle',
    34: 'Sniper',
    35: 'Rocket Launcher',
    36: 'Rocket Launcher HS',
    37: 'Flamethrower',
    38: 'Minigun',
    16: 'Grenade',
    17: 'Teargas',
    18: 'Molotov',
    39: 'Satchel',
    41: 'Spraycan',
    42: 'Fire Extinguisher',
    43: 'Camera',
    10: 'Dildo',
    11: 'Dildo',
    12: 'Vibrator',
    14: 'Flower',
    15: 'Cane',
    44: 'Nightvision',
    45: 'Infrared',
    46: 'Parachute',
    40: 'Bomb'
};

module.exports = {
    name: "mermilerim",
    description: 'Eğer Hesabınızı Bağladıysanız Mermilerinizi Listeler',
    type: 1,
    options: [],
    run: async (client, interaction) => {
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
            const [characterResults] = await dbConnection.query('SELECT * FROM characters WHERE charactername = ?', [characterName]);

            if (characterResults.length > 0) {
                const character = characterResults[0];
                const characterId = character.id;

                const [ammoResults] = await dbConnection.query('SELECT * FROM items WHERE owner = ? AND itemID = 116', [characterId]);

                if (ammoResults.length > 0) {
                    const ammoCounts = {};

                    ammoResults.forEach(item => {
                        const [weaponId, ammoAmount] = item.itemValue.split(':').map(Number);
                        if (!ammoCounts[weaponId]) {
                            ammoCounts[weaponId] = { totalAmmo: 0, clipCount: 0, clipSize: ammoAmount };
                        }
                        ammoCounts[weaponId].totalAmmo += ammoAmount;
                        ammoCounts[weaponId].clipCount++;
                    });

                    const ammoFields = Object.keys(ammoCounts).map(weaponId => {
                        const weaponName = weaponNames[weaponId] || `Bilinmeyen Silah (${weaponId})`;
                        const { totalAmmo, clipCount, clipSize } = ammoCounts[weaponId];

                        return {
                            name: weaponName,
                            value: "```" + `Toplam Mermi: ${totalAmmo}` + "```" + "\n" +
                                   "```" + `Şarjör Sayısı: ${clipCount}` + "```" + "\n" +
                                   "```" + `Bir Şarjördeki Mermi: ${clipSize}` + "```",
                            inline: false
                        };
                        
                    });

                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`${character.charactername} - Mermiler`)
                        .addFields(ammoFields)
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Uyarı")
                        .setDescription("Karakter Mermisizdir.")
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } else {
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
