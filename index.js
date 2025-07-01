const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const moment = require("moment");
const fs = require("fs");
const os = require("os");
const path = require("path");
const sanitizeHtml = require("sanitize-html");

// Bot Configuration
const bot = new TelegramBot("8043984408:AAGJxqVdQv67fTDKobKE1axIMrtG6grDYVM", {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

// Express Server Configuration
const app = express();
const PORT = process.env.PORT || 5000;

// Bot Settings
const adminChatId = -1002772299767;
const publicChatId = -1002772299767;
const channelUsername = "@hayoti_tajribam";
const userState = {};
const userStats = {};
const orderHistory = [];
const bannedUsers = new Set();

// Service Prices (in UZS)
const servicePrices = {
  "🌐 Web-sayt": {
    "0 dan sayt": '100,000 - 1,000,000 so\'m',
    "Template dan sayt": '50,000 - 300,000 so\'m',
    "Saytni yangilash": '50,000 - 600,000 so\'m',
    "Landing page": '50,000 - 200,000 so\'m',
    "E-commerce sayt": '100,000 - 1,500,000 so\'m'
  },
  "🔑 Domen & Hosting": {
    "Domen (.com)": '150,000 so\'m',
    "Domen (.uz)": '150,000 so\'m',
    "Hosting (yillik)": '400,000 so\'m',
    "SSL sertifikat": '200,000 so\'m',
    "Backup xizmati": '250,000 so\'m'
  },
  "🤖 Bot xizmatlari": {
    "Oddiy bot": '80,000 so\'m (chegirmada)',
    "E-commerce bot": '200,000 so\'m (chegirmada)',
    "CRM bot": '200,000 so\'m',
    "Inline bot": '120,000 so\'m',
    "Payment bot": '250,000 so\'m'
  },
  "📈 Trading o'quv kursi": {
    "Boshlang'ich kurs": '500,000 so\'m',
    "O'rta daraja": '800,000 so\'m',
    "Professional": '1,200,000 so\'m',
    "VIP mentorlik": '2,000,000 so\'m',
    "Guruh kursi": '300,000 so\'m'
  }
};

// Trading course data
const tradingCourses = {
  beginner: {
    title: "📚 Boshlang'ich Trading Kursi",
    duration: "4 hafta",
    lessons: 16,
    description: "Trading asoslari, bozor tahlili, risk menejment",
    price: "500,000 so'm",
    features: [
      "✅ Trading asoslari",
      "✅ Texnik tahlil",
      "✅ Risk menejment", 
      "✅ Demo trading",
      "✅ 24/7 qo'llab-quvvatlash"
    ]
  },
  intermediate: {
    title: "🎯 O'rta Daraja Kursi",
    duration: "6 hafta", 
    lessons: 24,
    description: "Murakkab strategiyalar, portfel boshqaruvi",
    price: "800,000 so'm",
    features: [
      "✅ Murakkab strategiyalar",
      "✅ Portfel boshqaruvi",
      "✅ Psixologiya", 
      "✅ Real trading",
      "✅ Shaxsiy mentor"
    ]
  },
  professional: {
    title: "🚀 Professional Kurs",
    duration: "8 hafta",
    lessons: 32, 
    description: "Professional treyderlik, algoritm trading",
    price: "1,200,000 so'm",
    features: [
      "✅ Algoritm trading",
      "✅ Quant strategiyalar",
      "✅ Risk modellari",
      "✅ Professional dasturlar", 
      "✅ Sertifikat"
    ]
  },
  vip: {
    title: "👑 VIP Mentorlik",
    duration: "12 hafta",
    lessons: "Unlimited",
    description: "Shaxsiy mentor, real pul bilan trading",
    price: "2,000,000 so'm", 
    features: [
      "✅ 1-on-1 mentorlik",
      "✅ Real kapital",
      "✅ Professional dasturlar",
      "✅ Kunlik maslahatlar",
      "✅ Profit sharing"
    ]
  }
};

// Enhanced Animation System
class AnimationEngine {
  static async typeWriter(chatId, text, options = {}) {
    const chunks = text.match(/.{1,50}/g) || [text];
    let currentText = "";

    const sentMessage = await bot.sendMessage(chatId, "⌨️ Yozilmoqda...", options);

    for (let i = 0; i < chunks.length; i++) {
      currentText += chunks[i];
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        await bot.editMessageText(currentText + "▌", {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          ...options
        });
      } catch (e) {}
    }

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      ...options
    });

    return sentMessage;
  }

  static async progressBar(chatId, text, options = {}) {
    const progressSteps = [
      "▱▱▱▱▱▱▱▱▱▱ 0%",
      "▰▱▱▱▱▱▱▱▱▱ 10%", 
      "▰▰▱▱▱▱▱▱▱▱ 20%",
      "▰▰▰▱▱▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱▱▱ 40%",
      "▰▰▰▰▰▱▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱▱▱ 60%",
      "▰▰▰▰▰▰▰▱▱▱ 70%",
      "▰▰▰▰▰▰▰▰▱▱ 80%", 
      "▰▰▰▰▰▰▰▰▰▱ 90%",
      "▰▰▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await bot.sendMessage(chatId, `🔄 Yuklanmoqda...\n${progressSteps[0]}`, options);

    for (let i = 1; i < progressSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        await bot.editMessageText(`🔄 Yuklanmoqda...\n${progressSteps[i]}`, {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          ...options
        });
      } catch (e) {}
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      ...options
    });

    return sentMessage;
  }

  static async spinnerAnimation(chatId, text, options = {}) {
    const spinners = ["🔄", "🔃", "⚡", "✨", "🎯", "🚀"];
    let currentSpinner = 0;

    const sentMessage = await bot.sendMessage(chatId, `${spinners[0]} Yuklanmoqda...`, options);

    const interval = setInterval(async () => {
      currentSpinner = (currentSpinner + 1) % spinners.length;
      try {
        await bot.editMessageText(`${spinners[currentSpinner]} Yuklanmoqda...`, {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          ...options
        });
      } catch (e) {}
    }, 300);

    setTimeout(async () => {
      clearInterval(interval);
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        ...options
      });
    }, 2000);

    return sentMessage;
  }
}

// Improved message sanitizer
function sanitizeMessage(text) {
  return sanitizeHtml(text, {
    allowedTags: ['b', 'i', 'u', 's', 'code', 'pre', 'a', 'em', 'strong'],
    allowedAttributes: {
      'a': ['href'],
      'code': ['class']
    },
    textFilter: function(text) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  });
}

// Enhanced logging
function logToFile(content) {
  const filePath = path.join(__dirname, "logs.txt");
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  fs.appendFileSync(filePath, `${timestamp} - ${content}${os.EOL}`);
}

function saveOrderToFile(order) {
  const filePath = path.join(__dirname, "orders.json");
  let orders = [];

  try {
    if (fs.existsSync(filePath)) {
      orders = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error("Order file read error:", error);
    logToFile(`Order file error: ${error.message}`);
  }

  orders.push({
    ...order,
    timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    id: orders.length + 1
  });

  try {
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
    logToFile(`Order saved: ${order.name} - ${order.service}`);
  } catch (error) {
    console.error("Order file write error:", error);
    logToFile(`Order save error: ${error.message}`);
  }
}

function updateUserStats(userId) {
  if (!userStats[userId]) {
    userStats[userId] = {
      messageCount: 0,
      lastActive: moment().format("YYYY-MM-DD HH:mm:ss"),
      joinDate: moment().format("YYYY-MM-DD HH:mm:ss"),
      orderCount: 0,
      tradingCourses: []
    };
  }

  userStats[userId].messageCount++;
  userStats[userId].lastActive = moment().format("YYYY-MM-DD HH:mm:ss");
}

function isAdmin(userId) {
  const adminIds = [123456789, 987654321]; // Add your admin IDs here
  return adminIds.includes(userId);
}

function isPublicChat(chatId) {
  return chatId === publicChatId;
}

function getPublicChatWelcome(firstName) {
  return `🎉 <b>Assalomu alaykum, ${firstName}!</b>

🌟 <i>Professional IT Solutions ga xush kelibsiz!</i>

💼 <b>Bizning xizmatlar:</b>
• 🌐 Web-sayt yaratish va dizayni
• 🤖 Telegram bot dasturlash
• 🔑 Domen va hosting xizmati
• 📱 Mobil ilovalar yaratish
• 📈 Trading o'quv kurslari
• 🧤 Innovatsion IT loyihalar

📞 <b>Buyurtma berish:</b> Botga shaxsiy xabar yuboring
👨‍💻 <b>Mutahassis:</b> @KXNexsus
📺 <b>Kanal:</b> ${channelUsername}

💡 <i>Sifatli xizmat va professional yondashuv!</i>`;
}

// Enhanced Main Menu
function sendMainMenu(chatId) {
  const welcomeText = `🏠 <b>Bosh menyu</b>

🌟 <i>Professional IT xizmatlar va ta'lim markazi</i>

📋 <b>Mavjud xizmatlar:</b>
• 💻 IT xizmatlar
• 📈 Trading ta'limi
• 🧤 Innovatsion loyihalar

⚡ Quyidagi bo'limlardan birini tanlang:`;

  return AnimationEngine.progressBar(chatId, welcomeText, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["🌐 Web-sayt", "🔑 Domen & Hosting"],
        ["🤖 Bot xizmatlari", "📈 Trading kurslari"],
        ["🧤 Innovatsion loyiha", "📦 Buyurtma berish"],
        ["💰 Narxlar", "📊 Statistika"],
        ["📞 Bog'lanish", "👨‍💼 Admin panel"],
        ["ℹ️ Ma'lumotlar", "❌ Menyuni yopish"]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
  });
}

// Trading Menu Functions
function sendTradingMenu(chatId) {
  const text = `📈 <b>Trading O'quv Kurslari</b>

🎓 <i>Professional treyderlik o'rganing!</i>

💎 <b>Kurs darajalari:</b>
• 📚 Boshlang'ich - 500,000 so'm
• 🎯 O'rta daraja - 800,000 so'm  
• 🚀 Professional - 1,200,000 so'm
• 👑 VIP Mentorlik - 2,000,000 so'm

🔥 Qaysi darajani tanlaysiz?`;

  return AnimationEngine.typeWriter(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["📚 Boshlang'ich kurs", "🎯 O'rta daraja"],
        ["🚀 Professional kurs", "👑 VIP Mentorlik"],
        ["👥 Guruh kursi", "📋 Kurs haqida"],
        ["💼 Trading strategiyalar", "📊 Bozor tahlili"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

function sendTradingCourseInfo(chatId, courseType) {
  const course = tradingCourses[courseType];
  if (!course) return;

  const text = `${course.title}

⏱️ <b>Davomiyligi:</b> ${course.duration}
📚 <b>Darslar soni:</b> ${course.lessons}
💰 <b>Narxi:</b> ${course.price}

📝 <b>Tavsif:</b>
${course.description}

✨ <b>Kurs tarkibi:</b>
${course.features.join('\n')}

🎁 <b>Bonus:</b>
• Telegram guruhga kirish
• PDF materiallar
• Video darslar
• Amaliy topshiriqlar

💡 <i>Professional treyder bo'ling!</i>`;

  return AnimationEngine.spinnerAnimation(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["📝 Kursga yozilish", "📞 Maslahat olish"],
        ["🔙 Trading menyuga qaytish"]
      ],
      resize_keyboard: true
    }
  });
}

function sendTradingStrategies(chatId) {
  const text = `💼 <b>Trading Strategiyalar</b>

🎯 <b>Asosiy strategiyalar:</b>

📊 <b>1. Texnik Tahlil</b>
• Support va Resistance
• Moving Average
• RSI va MACD
• Candlestick pattern

📈 <b>2. Fundamental Tahlil</b>
• Iqtisodiy yangiliklar
• Kompaniya hisobotlari
• Bozor kayfiyati
• Global hodisalar

⚡ <b>3. Risk Menejment</b>
• Stop Loss va Take Profit
• Position sizing
• Risk/Reward ratio
• Diversifikatsiya

🚀 <b>4. Psixologiya</b>
• Emotsiyalarni nazorat qilish
• Sabr-toqat
• Intizom
• Stress boshqaruvi

💡 <i>Har bir strategiya batafsil o'rgatiladi!</i>`;

  return AnimationEngine.typeWriter(chatId, text, {
    parse_mode: "HTML"
  });
}

function sendMarketAnalysis(chatId) {
  const text = `📊 <b>Bugungi Bozor Tahlili</b>

📅 <b>Sana:</b> ${moment().format("DD.MM.YYYY")}

📈 <b>Asosiy bozorlar:</b>

💰 <b>Forex:</b>
• EUR/USD: 📈 1.0850 (+0.25%)
• GBP/USD: 📉 1.2650 (-0.15%)
• USD/JPY: 📈 150.25 (+0.40%)

📊 <b>Crypto:</b>
• Bitcoin: 📈 $42,500 (+2.1%)
• Ethereum: 📈 $2,650 (+1.8%)
• BNB: 📉 $320 (-0.5%)

🏆 <b>Aksiyalar:</b>
• Apple: 📈 $195.50 (+1.2%)
• Tesla: 📉 $240.25 (-2.3%)
• Google: 📈 $142.80 (+0.8%)

🔥 <b>Bugungi imkoniyatlar:</b>
• Gold pullback kutilmoqda
• Tech aksiyalar kuchli
• Crypto volatil

⚠️ <i>Bu ma'lumotlar ta'limiy maqsadda!</i>`;

  return AnimationEngine.progressBar(chatId, text, {
    parse_mode: "HTML"
  });
}

// Enhanced Admin Panel
function sendAdminPanel(chatId, userId) {
  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, "❌ Sizda admin huquqlari yo'q!");
  }

  const text = `👨‍💼 <b>Admin Panel</b>

🎛️ <i>Boshqaruv markazi</i>

📊 <b>Tezkor ma'lumotlar:</b>
• Foydalanuvchilar: ${Object.keys(userStats).length}
• Buyurtmalar: ${orderHistory.length}
• Ban qilinganlar: ${bannedUsers.size}

⚙️ Quyidagi amallardan birini tanlang:`;

  return AnimationEngine.spinnerAnimation(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["📊 Batafsil statistika", "📋 Buyurtmalar"],
        ["👥 Foydalanuvchilar", "📢 Xabar yuborish"],
        ["🚫 Ban/Unban", "🗂️ Loglarni ko'rish"],
        ["💰 Daromad hisoboti", "📈 Trading statistika"],
        ["⚙️ Bot sozlamalar", "🔄 Botni qayta yuklash"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

function sendDetailedStats(chatId, userId) {
  if (!isAdmin(userId)) return;

  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const totalUsers = Object.keys(userStats).length;
  const totalOrders = orderHistory.length;
  const activeUsers = Object.values(userStats).filter(user => 
    moment().diff(moment(user.lastActive), 'hours') < 24
  ).length;

  const statsText = `📊 <b>Batafsil Statistika</b>

🕒 <b>Server ma'lumotlari:</b>
• Ish vaqti: ${Math.floor(uptime / 3600)}s ${Math.floor((uptime % 3600) / 60)}d
• Xotira: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• CPU: ${os.loadavg()[0].toFixed(2)}%

👥 <b>Foydalanuvchilar:</b>
• Jami: ${totalUsers}
• Faol (24s): ${activeUsers}
• Ban qilingan: ${bannedUsers.size}

📦 <b>Buyurtmalar:</b>
• Jami: ${totalOrders}
• Bugun: ${orderHistory.filter(o => moment(o.timestamp).isSame(moment(), 'day')).length}
• Bu hafta: ${orderHistory.filter(o => moment(o.timestamp).isSame(moment(), 'week')).length}

💰 <b>Moliyaviy:</b>
• Taxminiy daromad: ${totalOrders * 150000} so'm
• O'rtacha buyurtma: 150,000 so'm

📅 <b>Sana:</b> ${moment().format("DD.MM.YYYY HH:mm")}

🔥 <i>Bot professional darajada ishlayapti!</i>`;

  return AnimationEngine.typeWriter(chatId, statsText, { parse_mode: "HTML" });
}

// Price List Function
function sendPriceList(chatId) {
  let priceText = `💰 <b>Xizmat narxlari</b>

💎 <i>Sifatli va arzon xizmatlar</i>

`;

  Object.entries(servicePrices).forEach(([category, services]) => {
    priceText += `\n<b>${category}</b>\n`;
    Object.entries(services).forEach(([service, price]) => {
      priceText += `• ${service}: ${price}\n`;
    });
  });

  priceText += `\n💡 <i>Narxlar taxminiy bo'lib, loyiha murakkabligiga qarab o'zgarishi mumkin.</i>

🎁 <b>Chegirmalar mavjud!</b>`;

  AnimationEngine.spinnerAnimation(chatId, priceText, { parse_mode: "HTML" });
}

// Contact Information
function sendContactInfo(chatId) {
  const contactText = `📞 <b>Bog'lanish ma'lumotlari</b>

🎯 <i>Har doim aloqada</i>

👨‍💻 <b>Dasturchi:</b> @KXNexsus
📧 <b>Email:</b> info@kxnexsus.uz
📱 <b>Telefon:</b> +998 90 123 45 67
🌐 <b>Website:</b> https://kxnexsus.uz
📺 <b>Kanal:</b> ${channelUsername}

⏰ <b>Ish vaqti:</b> 09:00 - 18:00 (Dushanba-Juma)
📍 <b>Manzil:</b> Toshkent, Uzbekiston

💬 <i>Savollaringiz uchun doimo tayyormiz!</i>`;

  AnimationEngine.spinnerAnimation(chatId, contactText, { parse_mode: "HTML" });
}

// Error Handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.message);
  logToFile(`Polling error: ${error.message}`);
});

bot.on("error", (error) => {
  console.error("Bot error:", error);
  logToFile(`Bot error: ${error.message}`);
});

// Delete webhook
bot.deleteWebHook().then(() => {
  console.log("Webhook o'chirildi");
}).catch((err) => {
  console.log("Webhook yo'q yoki xato:", err.message);
});

// Set enhanced bot commands
const commands = [
  { command: "start", description: "🚀 Botni ishga tushirish" },
  { command: "menu", description: "🏠 Asosiy menyuni ochish" },
  { command: "trading", description: "📈 Trading kurslari" },
  { command: "help", description: "❓ Yordam olish" },
  { command: "prices", description: "💰 Xizmat narxlari" },
  { command: "contact", description: "📞 Bog'lanish" },
  { command: "stats", description: "📊 Statistika" },
  { command: "admin", description: "👨‍💼 Admin panel" }
];

bot.setMyCommands(commands);

// Enhanced Command Handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (bannedUsers.has(userId)) {
    return bot.sendMessage(chatId, "🚫 Siz botdan foydalanish uchun ban qilingansiz.");
  }

  updateUserStats(userId);

  if (isPublicChat(chatId)) {
    const publicWelcome = getPublicChatWelcome(msg.from.first_name);
    return AnimationEngine.sendAnimatedMessage(chatId, publicWelcome, { 
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "🤖 Botga shaxsiy xabar", url: `https://t.me/${process.env.BOT_USERNAME || 'KXNexsusBot'}` },
          { text: "📺 Kanalga obuna", url: `https://t.me/${channelUsername.replace("@", "")}` }
        ]]
      }
    });
  }

  userState[chatId] = { step: 0, serviceType: null };

  try {
    const res = await bot.getChatMember(channelUsername, userId);
    if (!["member", "administrator", "creator"].includes(res.status)) {
      return bot.sendMessage(
        chatId,
        `🔔 <b>Kanalga obuna bo'ling!</b>

📺 Iltimos, quyidagi kanalga obuna bo'ling: ${channelUsername}

🎁 Obuna bo'lgandan keyin botdan to'liq foydalanishingiz mumkin!`,
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [
              [{ text: "🔗 Kanalga o'tish", url: `https://t.me/${channelUsername.replace("@", "")}` }],
              ["✅ Obuna bo'ldim, tekshirish"]
            ],
            resize_keyboard: true
          }
        }
      );
    }
  } catch (err) {
    console.error(err);
    logToFile(`Subscription check error: ${err.message}`);
  }

  const welcomeText = `🎉 <b>Xush kelibsiz, ${msg.from.first_name}!</b>

🚀 <i>Professional IT xizmatlar va Trading ta'limi olamiga xush kelibsiz!</i>

🌟 <b>Bizning xizmatlar:</b>
• 🌐 Zamonaviy web-saytlar
• 🤖 Aqlli Telegram botlar  
• 🔑 Domen va hosting
• 📱 Mobile ilovalar
• 📈 Trading o'quv kurslari
• 🧤 Innovatsion loyihalar

💫 <i>Sifat va ishonch kafolatlaymiz!</i>

📞 <b>Savollar uchun:</b> @KXNexsus`;

  await AnimationEngine.progressBar(chatId, welcomeText, { parse_mode: "HTML" });
  setTimeout(() => sendMainMenu(chatId), 2000);
});

bot.onText(/\/menu|\/menyu/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);
  sendMainMenu(chatId);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);

  const helpText = `🤖 <b>Yordam bo'limi</b>

📋 <b>Mavjud buyruqlar:</b>
/start - 🚀 Botni ishga tushirish
/menu - 🏠 Asosiy menyuni ochish
/trading - 📈 Trading kurslari
/help - ❓ Ushbu yordam xabarini ko'rsatish
/prices - 💰 Xizmat narxlarini ko'rish
/contact - 📞 Bog'lanish ma'lumotlari
/stats - 📊 Bot statistikasi
/admin - 👨‍💼 Admin panel

🛠️ <b>Qo'llab-quvvatlash:</b>
📞 Telegram: @KXNexsus
📧 Email: info@kxnexsus.uz
📺 Kanal: ${channelUsername}

💡 <i>Qo'shimcha yordam kerak bo'lsa, biz bilan bog'laning!</i>`;

  AnimationEngine.spinnerAnimation(chatId, helpText, { parse_mode: "HTML" });
});

bot.onText(/\/prices|\/narxlar/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);
  sendPriceList(chatId);
});

bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);
  sendContactInfo(chatId);
});

bot.onText(/\/stats|\/statistika/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);
  sendStatistics(chatId);
});

bot.onText(/\/trading/, (msg) => {
  const chatId = msg.chat.id;
  updateUserStats(msg.from.id);
  sendTradingMenu(chatId);
});

bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  updateUserStats(userId);
  sendAdminPanel(chatId, userId);
});

// Enhanced Message Handler
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  if (bannedUsers.has(userId)) {
    return bot.sendMessage(chatId, "🚫 Siz botdan foydalanish uchun ban qilingansiz.");
  }

  updateUserStats(userId);

  if (isPublicChat(chatId)) {
    const keywords = ['bot', 'sayt', 'dasturlash', 'xizmat', 'narx', 'buyurtma', 'loyiha', 'trading', 'kurs'];
    const hasKeyword = keywords.some(keyword => text.toLowerCase().includes(keyword));

    if (hasKeyword || text.includes('@')) {
      return bot.sendMessage(chatId, `📞 <b>Buyurtma berish uchun:</b>

🤖 Botga shaxsiy xabar yuboring: @KXNexsusBot
👨‍💻 Yoki to'g'ridan-to'g'ri: @KXNexsus

💡 <i>Shaxsiy chatda barcha xizmatlar mavjud!</i>`, {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
      });
    }
    return;
  }

  // Handle subscription check
  if (text === "✅ Obuna bo'ldim, tekshirish") {
    try {
      const res = await bot.getChatMember(channelUsername, userId);
      if (["member", "administrator", "creator"].includes(res.status)) {
        bot.sendMessage(chatId, "✅ Obuna tasdiqlandi! Rahmat!", { parse_mode: "HTML" });
        setTimeout(() => sendMainMenu(chatId), 1000);
      } else {
        bot.sendMessage(chatId, "❌ Hali ham obuna bo'lmagansiz! Iltimos, kanalga obuna bo'ling.");
      }
    } catch (err) {
      bot.sendMessage(chatId, "❗ Obuna tekshiruvda xatolik yuz berdi.");
    }
    return;
  }

  // Enhanced menu handlers
  if (!userState[chatId] || userState[chatId].step === 0) {
    switch (text) {
      case "🌐 Web-sayt":
        sendWebsiteMenu(chatId);
        break;
      case "🔑 Domen & Hosting":
        sendDomainMenu(chatId);
        break;
      case "🤖 Bot xizmatlari":
        sendBotMenu(chatId);
        break;
      case "📈 Trading kurslari":
        sendTradingMenu(chatId);
        break;
      case "📚 Boshlang'ich kurs":
        sendTradingCourseInfo(chatId, 'beginner');
        break;
      case "🎯 O'rta daraja":
        sendTradingCourseInfo(chatId, 'intermediate');
        break;
      case "🚀 Professional kurs":
        sendTradingCourseInfo(chatId, 'professional');
        break;
      case "👑 VIP Mentorlik":
        sendTradingCourseInfo(chatId, 'vip');
        break;
      case "💼 Trading strategiyalar":
        sendTradingStrategies(chatId);
        break;
      case "📊 Bozor tahlili":
        sendMarketAnalysis(chatId);
        break;
      case "🧤 Innovatsion loyiha":
        sendInnovationMenu(chatId);
        break;
      case "💰 Narxlar":
        sendPriceList(chatId);
        break;
      case "📦 Buyurtma berish":
        userState[chatId] = { step: 1, serviceType: "default_buyurtma" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "👨‍💼 Admin panel":
        sendAdminPanel(chatId, userId);
        break;
      case "📊 Batafsil statistika":
        sendDetailedStats(chatId, userId);
        break;
      case "ℹ️ Ma'lumotlar":
        const userInfo = `📁 <b>Sizning ma'lumotlaringiz:</b>

👤 <b>Ism:</b> ${msg.from.first_name || "Noma'lum"}
👤 <b>Familiya:</b> ${msg.from.last_name || "Noma'lum"}
📝 <b>Username:</b> ${msg.from.username ? "@" + msg.from.username : "Yo'q"}
🆔 <b>ID:</b> ${msg.from.id}
🌐 <b>Til:</b> ${msg.from.language_code || "Noma'lum"}

🔒 <i>Ma'lumotlaringiz xavfsiz saqlanadi!</i>`;

        AnimationEngine.spinnerAnimation(chatId, userInfo, { parse_mode: "HTML" });
        break;
      case "📞 Bog'lanish":
        sendContactInfo(chatId);
        break;
      case "❌ Menyuni yopish":
        userState[chatId] = { step: 0 };
        bot.sendMessage(chatId, "✅ Menyu yopildi.\n\n/menu buyrug'ini yuboring yoki 🔄 tugmasini bosing", {
          reply_markup: {
            keyboard: [["🔄 Menyuni ochish"]],
            resize_keyboard: true
          }
        });
        break;
      case "🔄 Menyuni ochish":
        sendMainMenu(chatId);
        break;

      // Website service handlers
      case "🆕 0 dan sayt":
        userState[chatId] = { step: 1, serviceType: "order_0dan" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📋 Template dan sayt":
        userState[chatId] = { step: 1, serviceType: "order_template" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🔄 Saytni yangilash":
        userState[chatId] = { step: 1, serviceType: "order_update" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📄 Landing page":
        userState[chatId] = { step: 1, serviceType: "order_landing" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🛒 E-commerce sayt":
        userState[chatId] = { step: 1, serviceType: "order_ecommerce" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;

      // Domain service handlers
      case "🌐 Domen (.com)":
        userState[chatId] = { step: 1, serviceType: "domain_com" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🇺🇿 Domen (.uz)":
        userState[chatId] = { step: 1, serviceType: "domain_uz" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💾 Hosting xizmati":
        userState[chatId] = { step: 1, serviceType: "hosting" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🔒 SSL sertifikat":
        userState[chatId] = { step: 1, serviceType: "ssl" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💿 Backup xizmati":
        userState[chatId] = { step: 1, serviceType: "backup" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;

      // Bot service handlers
      case "🔹 Oddiy bot":
        userState[chatId] = { step: 1, serviceType: "bot_simple" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🛒 E-commerce bot":
        userState[chatId] = { step: 1, serviceType: "bot_ecommerce" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📊 CRM bot":
        userState[chatId] = { step: 1, serviceType: "bot_crm" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "⚡ Inline bot":
        userState[chatId] = { step: 1, serviceType: "bot_inline" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💳 Payment bot":
        userState[chatId] = { step: 1, serviceType: "bot_payment" };
        AnimationEngine.typeWriter(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;

      // Innovation menu handlers
      case "📽️ Video ko'rish":
        bot.sendMessage(chatId, `🎬 <b>Loyiha videosi</b>

🧤 Soqovlar uchun maxsus qo'lqop loyihamizni ko'ring!

📹 <a href="https://drive.google.com/file/d/1-5uau7c7YabLrJ9Beo5cO1-QNb6jmskt/view?usp=drivesdk">Videoni bu yerda ko'ring</a>

💡 <i>Bu loyiha hayotni o'zgartiradi!</i>`, {
          parse_mode: "HTML",
          disable_web_page_preview: false
        });
        break;
      case "💝 Donat qilish":
        bot.sendMessage(chatId, `💝 <b>Loyihani qo'llab-quvvatlash</b>

🎯 <i>Sizning yordam muhim!</i>

💰 <b>Donat qilish usullari:</b>
• 💳 Karta orqali
• 📱 Click/Payme
• 💵 Naqd pul

📞 <b>To'lov uchun:</b> @KXNexsus

🙏 <i>Har qanday yordam uchun rahmat!</i>`, {
          parse_mode: "HTML"
        });
        break;
      case "📋 Loyiha haqida":
        bot.sendMessage(chatId, `📋 <b>Innovatsion qo'lqop loyihasi</b>

🎯 <b>Maqsad:</b>
Soqovlar uchun imo-ishoralarni nutqqa aylantiradigan qo'lqop yaratish

🔬 <b>Texnologiya:</b>
• AI va machine learning
• Sensor texnologiyalar
• Audio sintez

👥 <b>Kimlar uchun:</b>
• Soqov va kar-soqov insonlar
• Ularning oila a'zolari
• Jamiyat

💡 <i>Bu dunyo-foyda yordam beradi!</i>`, {
          parse_mode: "HTML"
        });
        break;
      case "🛠️ Qanday ishlaydi":
        bot.sendMessage(chatId, `🛠️ <b>Qo'lqop qanday ishlaydi?</b>

🔄 <b>Jarayon:</b>
1️⃣ Qo'lqop imo-ishoralarni sezadi
2️⃣ AI orqali ularni tahlil qiladi  
3️⃣ So'zga aylantirib ovozga chiqaradi
4️⃣ Mikrofon orqali eshitiladi

⚡ <b>Xususiyatlar:</b>
• Real-time ishlash
• Yuqori aniqlik
• Chiroyli dizayn
• Batareya bilan ishlash

🚀 <i>Texnologiya kelajagi!</i>`, {
          parse_mode: "HTML"
        });
        break;
      case "🎯 Maqsadimiz":
        bot.sendMessage(chatId, `🎯 <b>Bizning maqsadimiz</b>

🌟 <b>Asosiy g'oya:</b>
Soqov insonlarning hayotini osonlashtirish va ularni jamiyatga yaxshiroq integratsiya qilish

💫 <b>Natijalar:</b>
• Muloqot osonligi
• Ishga joylashish imkoniyati
• Ta'lim olish qulayligi
• Ijtimoiy hayotda faollik

🤝 <b>Hamkorlik:</b>
• Xalqaro tashkilotlar bilan
• Ta'lim muassasalari bilan
• Tibbiyot markazlari bilan

❤️ <i>Bizning missiyamiz - yordam berish!</i>`, {
          parse_mode: "HTML"
        });
        break;
      case "🔙 Bosh menyuga qaytish":
        userState[chatId] = { step: 0 };
        sendMainMenu(chatId);
        break;

      default:
        bot.sendMessage(chatId, `❓ <b>Noma'lum buyruq!</b>

🔍 Iltimos, menyudan tanlang yoki quyidagi buyruqlarni ishlating:
• /menu - Asosiy menyu
• /help - Yordam

💡 <i>Savol bo'lsa: @KXNexsus</i>`, {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🏠 Bosh menyu"]],
            resize_keyboard: true
          }
        });
    }
    return;
  }

  const state = userState[chatId];

  if (text === "🔙 Bosh menyuga qaytish") {
    userState[chatId] = { step: 0 };
    return sendMainMenu(chatId);
  }

  // Order processing
  switch (state.step) {
    case 1:
      state.name = text;
      state.step = 2;
      AnimationEngine.typeWriter(chatId, "📞 <b>Telefon raqamingizni kiriting:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            [{ text: "📱 Raqamni yuborish", request_contact: true }],
            ["🔙 Bosh menyuga qaytish"]
          ],
          resize_keyboard: true,
        },
      });
      break;
    case 2:
      if (msg.contact) {
        state.phone = msg.contact.phone_number;
      } else {
        state.phone = text;
      }
      state.step = 3;
      AnimationEngine.typeWriter(chatId, "📝 <b>Loyiha haqida batafsil ma'lumot bering:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["🔙 Bosh menyuga qaytish"]],
          resize_keyboard: true,
        },
      });
      break;
    case 3:
      state.description = text;
      state.step = 4;
      AnimationEngine.typeWriter(chatId, "💰 <b>Taxminiy byudjetingiz (so'mda):</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["🔙 Bosh menyuga qaytish"]],
          resize_keyboard: true,
        },
      });
      break;
    case 4:
      state.budget = text;

      const serviceName = {
        order_0dan: "0 dan sayt yaratish",
        order_template: "Template dan sayt",
        order_update: "Saytni yangilash",
        order_landing: "Landing page",
        order_ecommerce: "E-commerce sayt",
        domain_com: "Domen (.com)",
        domain_uz: "Domen (.uz)",
        hosting: "Hosting xizmati",
        ssl: "SSL sertifikat",
        backup: "Backup xizmati",
        bot_simple: "Oddiy bot",
        bot_ecommerce: "E-commerce bot",
        bot_crm: "CRM bot",
        bot_inline: "Inline bot",
        bot_payment: "Payment bot",
        default_buyurtma: "Umumiy buyurtma",
        trading_course: "Trading kursi"
      }[state.serviceType] || "Umumiy buyurtma";

      const orderData = {
        name: state.name,
        phone: state.phone,
        service: serviceName,
        description: state.description,
        budget: state.budget,
        userId: userId,
        username: msg.from.username || "Yo'q",
        chatId: chatId
      };

      const summary = `📥 <b>Yangi Buyurtma!</b>

👤 <b>Ism:</b> ${state.name}
📞 <b>Telefon:</b> ${state.phone}
🛠 <b>Xizmat:</b> ${serviceName}
📝 <b>Tavsif:</b> ${state.description}
💰 <b>Byudjet:</b> ${state.budget}
👨‍💻 <b>Username:</b> @${msg.from.username || "Yo'q"}
🆔 <b>User ID:</b> ${userId}
📅 <b>Sana:</b> ${moment().format("DD.MM.YYYY HH:mm")}`;

      orderHistory.push(orderData);
      saveOrderToFile(orderData);

      if (userStats[userId]) {
        userStats[userId].orderCount++;
      }

      AnimationEngine.spinnerAnimation(chatId, `✅ <b>Buyurtmangiz qabul qilindi!</b>

🎉 <i>Rahmat! Sizning buyurtmangiz muvaffaqiyatli ro'yxatga olindi.</i>

🕐 <b>Keyingi qadam:</b>
Bizning mutaxassislar 1-2 soat ichida siz bilan bog'lanishadi.

📞 <b>Shoshilinch holatlarda:</b> @KXNexsus

💼 <b>Buyurtma raqami:</b> #${orderHistory.length}`, {
        parse_mode: "HTML"
      });

      bot.sendMessage(adminChatId, summary, {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["✅ Qabul qilish", "❌ Rad etish"],
            [`💬 Javob berish: @${msg.from.username || msg.from.id}`]
          ],
          resize_keyboard: true
        }
      });

      userState[chatId] = { step: 0 };
      setTimeout(() => sendMainMenu(chatId), 3000);
      break;
  }
});

// Express Routes with enhanced styling
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Professional Trading Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container { 
                background: rgba(255,255,255,0.1); 
                padding: 40px; 
                border-radius: 20px; 
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 600px;
                width: 90%;
            }
            h1 { 
                margin-bottom: 30px; 
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .status { 
                font-size: 1.5em; 
                margin: 20px 0; 
                padding: 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
            .info { 
                margin: 15px 0; 
                font-size: 1.2em; 
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                border-left: 4px solid #fff;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            .status { animation: pulse 2s infinite; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Professional Trading Bot</h1>
            <div class="status">✅ Bot aktiv ishlayapti!</div>
            <div class="grid">
                <div class="info">⏰ Server vaqti<br>${moment().format("DD.MM.YYYY HH:mm:ss")}</div>
                <div class="info">🚀 Uptime<br>${Math.floor(process.uptime() / 3600)}s ${Math.floor((process.uptime() % 3600) / 60)}d</div>
                <div class="info">👥 Foydalanuvchilar<br>${Object.keys(userStats).length}</div>
                <div class="info">📦 Buyurtmalar<br>${orderHistory.length}</div>
                <div class="info">💾 Xotira<br>${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB</div>
                <div class="info">🌐 Port<br>${PORT}</div>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get("/stats", (req, res) => {
  const stats = {
    totalUsers: Object.keys(userStats).length,
    totalOrders: orderHistory.length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    status: "active",
    version: "2.0.0",
    features: ["IT Services", "Trading Courses", "Admin Panel", "Enhanced Animations"]
  };
  res.json(stats);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server ${PORT}-portda ishlamoqda`);
  logToFile(`Server started on port ${PORT}`);
});

console.log("🤖 Professional Trading Bot ishga tushdi!");
logToFile("Bot started successfully with enhanced features");

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  logToFile(`Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 3600000);
