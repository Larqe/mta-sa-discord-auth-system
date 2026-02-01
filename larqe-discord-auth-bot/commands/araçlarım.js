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

module.exports = {
    name: "araçlarım",
    description: 'Eğer Hesabınızı Bağladıysanız Araçlarınızı Listeler',
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

                const [vehicleResults] = await dbConnection.query('SELECT * FROM vehicles WHERE owner = ?', [characterId]);

                if (vehicleResults.length > 0) {
                    const vehicleFields = await Promise.all(vehicleResults.map(async (vehicle) => {
                        const vehicleModelID = vehicle.model;
                        const vehicleBrand = vehicle.vehbrand;
                        const vehicleYear = vehicle.vehyear;
                        const vehicleLocation = `X: ${vehicle.x}, Y: ${vehicle.y}, Z: ${vehicle.z}`;
                        const vehicleFuel = vehicle.fuel;
                        const vehicleEngine = vehicle.engine;
                        const vehicleLocked = vehicle.locked;
                        const vehicleLights = vehicle.lights;
                        const vehicleHP = vehicle.hp;
                        const vehiclePlate = vehicle.plate;
                        const vehicleTax = vehicle.vergi;
                        const vehicleTotalTax = vehicle.toplamvergi;
                        const vehicleFine = vehicle.ceza;
                        const vehicleFineReason = vehicle.cezasebep;

                        const [modelResults] = await dbConnection.query('SELECT vehbrand, vehmodel, vehyear FROM vehicles_shop WHERE vehmtamodel = ?', [vehicleModelID]);
                        const vehicleModel = modelResults.length > 0 ? `${modelResults[0].vehbrand} ${modelResults[0].vehmodel}` : 'Bilinmeyen Model';

                        return {
                            name: "Araç Bilgileri",
                            value: `\`\`\`Model: ${modelResults[0].vehmodel}\`\`\`\n\`\`\`Marka: ${modelResults[0].vehbrand}\`\`\`\n\`\`\`Yıl: ${modelResults[0].vehyear}\`\`\`\n\`\`\`Konum: ${vehicleLocation}\`\`\`\n\`\`\`Yakıt: ${vehicleFuel}\`\`\`\n\`\`\`Motor Durumu: ${vehicleEngine}\`\`\`\n\`\`\`Kilit Durumu: ${vehicleLocked}\`\`\`\n\`\`\`Işık Durumu: ${vehicleLights}\`\`\`\n\`\`\`Can Durumu: ${vehicleHP}\`\`\`\n\`\`\`Plaka: ${vehiclePlate}\`\`\`\n\`\`\`Vergi: ${vehicleTax}\`\`\`\n\`\`\`Toplam Vergi: ${vehicleTotalTax}\`\`\`\n\`\`\`Ceza: ${vehicleFine}\`\`\`\n\`\`\`Ceza Sebep: ${vehicleFineReason}\`\`\``,
                            inline: true
                        };
                    }));

                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`${characterName} - Araçlar`)
                        .addFields(vehicleFields)
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Hiçbir araç bulunamadı.")
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
};
