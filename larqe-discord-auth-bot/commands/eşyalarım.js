const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, EmbedBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
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

// Eşyalar isimleri (örnek olarak sadece bazılarını ekledim, daha fazlasını ekleyebilirsiniz)
const itemNames = {
    1: "Sosisli",
    2: "iPhone 11",
    3: "Araç Anahtarı",
    4: "Ev Anahtarı",
    5: "İşyeri Anahtarı",
    6: "Telsiz",
    7: "Telefon Defteri",
    8: "Sandviç",
    9: "Sprunk",
    10: "Zar",
    11: "Mexican Taco",
    12: "Hamburger",
    13: "Donut",
    14: "Kurabiye",
    15: "Su",
    16: "Kıyafet",
    17: "Saat",
    18: "City Guide",
    19: "MP3 Player",
    20: "Standard Fighting for Dummies",
    21: "Boxing for Dummies",
    22: "Kung Fu for Dummies",
    23: "Knee Head Fighting for Dummies",
    24: "Grab Kick Fighting for Dummies",
    25: "Elbow Fighting for Dummies",
    26: "Gaz Maskesi",
    27: "Flashbang",
    28: "Glowstick",
    29: "Door Ram",
    30: "Cannabis Sativa",
    31: "Cocaine Alkaloid",
    32: "Lysergic Acid",
    33: "Unprocessed PCP",
    34: "Cocaine",
    35: "Morphine",
    36: "Ecstasy",
    37: "Heroin",
    38: "Marijuana",
    39: "Methamphetamine",
    40: "Epinephrine (Adrenaline)",
    41: "LSD",
    42: "Shrooms",
    43: "PCP",
    44: "Chemistry Set",
    45: "Kelepçe",
    46: "Rope",
    47: "Kelepçe Anahtarı",
    48: "Sırt Çantası",
    49: "Balık Oltası",
    50: "Los Santos Highway Code",
    51: "Chemistry 101",
    52: "Police Officer's Manual",
    53: "Alkol Ölçer",
    54: "Ghettoblaster",
    55: "Business Card",
    56: "Kar Maskesi",
    57: "Benzin Bidonu",
    58: "Efes Pilsen Bira",
    59: "Mudkip",
    60: "Kasa",
    61: "Emergency Light Strobes",
    62: "İstanblue Votka",
    63: "Jack Daniels Viski",
    64: "LSPD Rozeti",
    65: "LSFD Badge",
    66: "Blindfold",
    67: "GPS",
    68: "Lottery Ticket",
    69: "Sözlük",
    70: "Sargı Bezi",
    71: "Not Defteri",
    72: "Not",
    73: "Elevator Remote",
    74: "Bomb",
    75: "Bomb Remote",
    76: "Riot Shield",
    77: "İskambil Destesi",
    78: "San Andreas Pilot Certificate",
    79: "Porn Tape",
    80: "Generic Item",
    81: "Buzdolabı",
    82: "Modifiyeci Kartı",
    83: "Kahve",
    84: "Escort 9500ci Radar Detector",
    85: "Emergency Siren",
    86: "LSN Identifcation",
    87: "LS Government Badge",
    88: "Kulaklık",
    89: "Yemek",
    90: "Motocross Kaskı",
    91: "Eggnog",
    92: "Turkey",
    93: "Christmas Pudding",
    94: "Christmas Present",
    95: "İçecek",
    96: "Macbook pro A1286 Core i7",
    97: "LSFD Procedures Manual",
    98: "Garage Remote",
    99: "Mixed Dinner Tray",
    100: "Small Milk Carton",
    101: "Small Juice Carton",
    102: "Cabbage",
    103: "Raf",
    104: "Taşınabilir TV",
    105: "Sigara Paketi",
    106: "Sigara",
    107: "Çakmak",
    108: "Pancake",
    109: "Meyve",
    110: "Sebze",
    111: "Taşınabilir GPS",
    112: "San Andreas Highway Patrol badge",
    113: "Pack of Glowsticks",
    114: "Vehicle Upgrade",
    116: "Mermi",
    117: "Rampa",
    118: "HGS",
    119: "Sanitary Andreas ID",
    120: "Dalış Tüpü",
    121: "Box with supplies",
    122: "Açık Mavi Bandana",
    123: "Kırmızı Bandana",
    124: "Sarı Bandana",
    125: "Mor Bandana",
    126: "Görev Kemeri",
    127: "FAA Badge",
    128: "Modifiyeci",
    129: "Direct Imports ID",
    130: "Araç Alarm Sistemi",
    131: "LSCSD Badge",
    132: "Prescription Bottle",
    133: "Los Santos - Driver Belgesi",
    134: "Para",
    135: "Mavi Bandana",
    136: "Kahverengi Bandana",
    137: "Snake Cam",
    138: "Bait Vehicle System",
    139: "Araç Takip Sistemi",
    140: "Orange Light Strobes",
    141: "Megafon",
    142: "Los Santos Cab & Bus ID",
    143: "Mobile Data Terminal",
    144: "Yellow Strobe",
    145: "El Feneri",
    146: "Los Santos District Court Identification Card",
    147: "Duvar Kağıdı",
    148: "Silah Taşıma Ruhsatı",
    149: "Silah Bulundurma Ruhsatı",
    150: "Kredi Kartı",
    151: "Lift Remote",
    152: "Kimlik Kartı",
    153: "Driver's License - Motorbike",
    154: "Fishing Permit",
    155: "Driver's License - Boat",
    156: "Superior Court of San Andreas ID",
    157: "Toolbox",
    158: "Yeşil Bandana",
    159: "Cargo Group ID",
    160: "El Çantası",
    161: "Fleming Architecture and Construction ID",
    162: "Çelik Yelek",
    163: "Valiz",
    164: "Tıbbı Çanta",
    165: "DVD",
    166: "ClubTec VS1000",
    167: "Framed Picture (Golden Frame)",
    168: "Orange Bandana",
    169: "Keyless Digital Door Lock",
    170: "Keycard",
    171: "Biker Helmet",
    172: "Full Face Helmet",
    173: "Noter Satış Sözleşmesi Evrağı",
    174: "FAA Electronical Map Book",
    175: "Poster",
    176: "Speaker",
    177: "Remote Dispatch Device",
    178: "Kitap",
    179: "Car Motive",
    180: "SAPT ID",
    181: "Smoking package",
    182: "Rolled Joint",
    183: "Viozy Membership Card",
    184: "HP Charcoal Window Film",
    185: "CXP70 Window Film",
    186: "Viozy Border Edge Cutter (Red Anodized)",
    187: "Viozy Solar Spectrum Tranmission Meter",
    188: "Viozy Tint Chek 2800",
    189: "Viozy Equalizer Heatwave Heat Gun",
    190: "Viozy 36 Multi-Purpose Cutter Bucket",
    191: "Viozy Tint Demonstration Lamp",
    192: "Viozy Triumph Angled Scraper",
    193: "Viozy Performax 48oz Hand Sprayer",
    194: "Viozy Vehicle Ignition - 2010 ((20 /chance))",
    195: "Viozy Vehicle Ignition - 2011 ((30 /chance))",
    196: "Viozy Vehicle Ignition - 2012 ((40 /chance))",
    197: "Viozy Vehicle Ignition - 2013 ((50 /chance))",
    198: "Viozy Vehicle Ignition - 2014 ((70 /chance))",
    199: "Viozy Vehicle Ignition - 2015 ((90 /chance))",
    200: "Viozy Vehicle Ignition - 2016",
    201: "Viozy Vehicle Ignition - 2017",
    202: "Viozy Vehicle Ignition - 2018",
    203: "Viozy Hidden Vehicle Tracker 315 Pro ((Undetectable))",
    204: "Viozy Hidden Vehicle Tracker 272 Micro ((30 /chance))",
    205: "Viozy HVT 358 Portable Spark Nano 4.0 ((50 /chance))",
    206: "Wheat Seed",
    207: "Barley Seed",
    208: "Oat Seed",
    209: "FLU Device",
    210: "Coca-Cola Christmas",
    211: "A Christmas Lottery Ticket",
    212: "Snow Tires",
    213: "Pinnekjott",
    214: "Generic Drug",
    215: "Akustik Gitar",
    227: "Nargile",
    228: "Fotoğraf",
    229: "Tuborg Bira",
    230: "Yeni Rakı",
    280: "Rozet",
    361: "İşlenmemiş Kenevir",
    333: "Saksı",
    248: "Bilardo Masası",
    249: "Araç Ruhsatı",
    250: "Balık Yemi",
    251: "Simit",
    252: "Açma",
    284: "Çeyrek Bilet",
    285: "Yarım Bilet",
    286: "Tam Bilet",
    287: "At Kafası",
    288: "Pişmiş Biftek",
    289: "Çiğ Biftek",
    290: "Albino Balığı",
    291: "Dağ Alabalığı",
    292: "Deniz Alabalığı",
    293: "Dere Alabalığı",
    317: "Çeyrek Bilet",
    318: "Yarım Bilet",
    319: "Tam Bilet",
    890: "Beyaz Pitbull",
    891: "Siyah Pitbull",
    892: "Gri Pitbull",
    893: "Golden",
    894: "Alman Kurdu",
    895: "Husky",
    897: "Köpek Maması",
    404: "Sırdan",
    405: "Midye",
    344: "Çadır",
    345: "Nargile",
    406: "Sosisli Tezgahı",
    407: "Dondurma Tezgah",
    408: "Çin Yemeği Tezgahı",
    272: "Maymuncuk",
    273: "Mataryal",
    409: "Barbekü Tezgahı",
    283: "Tasma",
    417: "Köpek Maması",
    418: "Havalı Korna #1",
    419: "Havalı Korna #2",
    420: "Havalı Korna #3",
    421: "Havalı Korna #4",
    422: "Havalı Korna #5",
    423: "Havalı Korna #6",
    424: "Piyango Bileti",
    450: "Adliye Rozet #",
    515: "Tamirci Kartı",
    555: "İstiridye",
    556: "Kırmızı İnci",
    557: "Mavi İnci",
    558: "Yeşil İnci",
    559: "Beyaz İnci",
    560: "Çeyrek Altın",
    561: "Cumhuriyet Altın",
    562: "Altın Bilezik",
    563: "Kazı Kazan",
    568: "İşlenmemiş Taş",
    569: "İşlenmemiş Kömür",
    570: "İşlenmemiş Bakır",
    571: "İşlenmemiş Demir",
    572: "İşlenmemiş Altın",
    573: "İşlenmiş Taş",
    574: "İşlenmiş Kömür",
    575: "İşlenmiş Bakır",
    576: "İşlenmiş Demir",
    577: "İşlenmiş Altın",
    578: "Kazma",
    579: "Barbekü",
    580: "Tamir Kiti",
    581: "Kriko Kiti",
    582: "Silah Kasası",
    583: "Premium Silah Kasası",
    584: "Levye",
    585: "Kokain Tohumu",
    586: "Marijuana Tohumu",
    587: "Eroin Tohumu",
    588: "Bant",
    589: "Tütün",
    590: "Kaçak Sigara Paketi",
    591: "Pizza",
    592: "Piliç",
    593: "Omlet",
    594: "Salata Tabağı",
    10061: "Yara Bandı",
    10060: "Ağrı Kesici",
    10058: "Saglık Çantası",
    10059: "Maske",
    10056: "Elma",
    10057: "Elma Suyu",
    10062: "Sarma Çarşaf",
    10063: "Meth Otu",
    10064: "İşlenmiş Meth",
    668: "Kenevir Otu",
    669: "Kenevir",
    10070: "Boru Kebabı",
    10071: "Ayran",
    10072: "Şalgam",
    10073: "Şırdan",
    10074: "İplik",
    10075: "Kumaş",
    10076: "Kıyafet",
    10077: "Mantar",
    10078: "Mantar Zehri",
    10079: "Bilet",
    10080: "Silah Ruhsatı",
    10081: "Marijuana Tohumu",
    10082: "Havuç Tohumu",
    10083: "Turp Tohumu",
    10084: "Maydanoz Tohumu",
    10085: "Marul Tohumu",
    10086: "Soğan Tohumu",
    10087: "Marijuana",
    10088: "Havuç",
    10089: "Turp",
    10090: "Maydanoz",
    10091: "Marul",
    10092: "Soğan",
    10093: "Marijuana tohumu",
    10094: "Gübre",
    10095: "Saat",
    10096: "Kolye",
    10097: "Müzik Çalar",
    10098: "Televizyon",
    1001: "Kömür",
    1002: "Altın",
    1003: "Elmas"
    
    
};

module.exports = {
    name: "esyalarım",
    description: 'Eğer Hesabınızı Bağladıysanız Eşyalarınızı Listeler',
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

                // Eşyaları getir ve adetlerini say
                const [itemResults] = await dbConnection.query('SELECT itemID, itemValue, COUNT(*) as itemCount FROM items WHERE owner = ? AND itemID NOT IN (115, 116) GROUP BY itemID', [characterId]);

                if (itemResults.length > 0) {
                    let itemText = "";
                    itemResults.forEach(item => {
                        const itemName = itemNames[item.itemID] || `Bilinmeyen Eşya (${item.itemID})`;
                        const itemCount = item.itemCount;
                        itemText += `${itemCount}x ${itemName}\n`;
                    });

                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`${character.charactername} - Eşyalar`)
                        .setDescription("```" + itemText + "```")
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Hata Oluştu")
                        .setDescription("Hiçbir eşya bulunamadı.")
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
