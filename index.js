
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
const adminChatId = -277229767;
const publicChatId = -277229767; // Ommaviy chat ID
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
    "E-commerce sayt": '100,000 - 1,500,000 so\'m',
    "Admin": 'https://t.me/m_kimyonazarov'
  },
  "🔑 Domen & Hosting": {
    "Domen (.com)": '150,000 so\'m',
    "Domen (.uz)": '150,000 so\'m',
    "Hosting (yillik)": '400,000 so\'m',
    "SSL sertifikat": '200,000 so\'m',
    "Backup xizmati": '250,000 so\'m',
    "Admin": 'https://t.me/m_kimyonazarov'
  },
  "🤖 Bot xizmatlari": {
    "Oddiy bot": '80,000 so\'m (chegirmada)',
    "E-commerce bot": '200,000 so\'m (chegirmada)',
    "CRM bot": '200,000 so\'m',
    "Inline bot": '120,000 so\'m',
    "Payment bot": '250,000 so\'m',
    "Admin": 'https://t.me/m_kimyonazarov'
  },
};

// Animation helper function
function sendAnimatedMessage(chatId, text, options = {}) {
  const loadingText = "⏳ Yuklanmoqda";
  const loadingSteps = ["⏳", "🔄", "✨", "🎯"];
  let currentStep = 0;
  
  // Sanitize the text before sending
  const sanitizedText = options.parse_mode === "HTML" ? sanitizeMessage(text) : text;
  
  return bot.sendMessage(chatId, loadingText, options).then(sentMessage => {
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % loadingSteps.length;
      bot.editMessageText(`${loadingSteps[currentStep]} Yuklanmoqda...`, {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        ...options
      }).catch(() => {});
    }, 300);
    
    setTimeout(() => {
      clearInterval(interval);
      bot.editMessageText(sanitizedText, {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        ...options
      }).catch(() => {
        bot.sendMessage(chatId, sanitizedText, options);
      });
    }, 1200);
    
    return sentMessage;
  });
}

// Utility Functions
function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

function sanitizeMessage(text) {
  return sanitizeHtml(text, {
    allowedTags: ['b', 'i', 'u', 's', 'code', 'pre', 'a'],
    allowedAttributes: {
      'a': ['href']
    },
    textFilter: function(text) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  });
}

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
  }
  
  orders.push({
    ...order,
    timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    id: orders.length + 1
  });
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error("Order file write error:", error);
  }
}

function updateUserStats(userId) {
  if (!userStats[userId]) {
    userStats[userId] = {
      messageCount: 0,
      lastActive: moment().format("YYYY-MM-DD HH:mm:ss"),
      joinDate: moment().format("YYYY-MM-DD HH:mm:ss"),
      orderCount: 0
    };
  }
  
  userStats[userId].messageCount++;
  userStats[userId].lastActive = moment().format("YYYY-MM-DD HH:mm:ss");
}

function isAdmin(userId) {
  const adminIds = [adminChatId, 6813216374];
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
• 🧤 Innovatsion IT loyihalar

📞 <b>Buyurtma berish:</b> Botga shaxsiy xabar yuboring
👨‍💻 <b>Mutahassis:</b> <a href="https://t.me/KXNexsus">KX Nexsus</a>
📺 <b>Kanal:</b> ${channelUsername}
🤖 <b>Botni yaxshilash haqidagi fikiringgizni <a href="https://t.me/m_kimyonazarov">Muhammadxojaga</a> yozing. Sizning fikiringgiz biz uchun muhum! </b>

💡 <i>Sifatli xizmat va professional yondashuv!</i>`;
}

// Main Menu Function
function sendMainMenu(chatId) {
  const welcomeText = `🏠 <b>Bosh menyu</b>

🌟 <i>Professional IT xizmatlar markazi</i>

📋 Quyidagi xizmatlardan birini tanlang:`;

  sendAnimatedMessage(chatId, welcomeText, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["🌐 Web-sayt", "🔑 Domen & Hosting"],
        ["🤖 Bot xizmatlari", "🧤 Innovatsion loyiha"],
        ["📦 Buyurtma berish", "💰 Narxlar"],
        ["📊 Statistika", "📞 Bog'lanish"],
        ["👨‍💼 Admin panel", "ℹ️ Ma'lumotlar"],
        ["❌ Menyuni yopish"]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
  });
}

// Service Menus
function sendWebsiteMenu(chatId) {
  const text = `🌐 <b>Web-sayt xizmatlari</b>

🚀 <i>Zamonaviy va professional saytlar</i>

🎯 Qanday sayt kerak?`;

  sendAnimatedMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["🆕 0 dan sayt", "📋 Template dan sayt"],
        ["🔄 Saytni yangilash", "📄 Landing page"],
        ["🛒 E-commerce sayt"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

function sendDomainMenu(chatId) {
  const text = `🔑 <b>Domen & Hosting xizmatlari</b>

🌐 <i>Ishonchli va tezkor hosting</i>

⚡ Nima kerak?`;

  sendAnimatedMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["🌐 Domen (.com)", "🇺🇿 Domen (.uz)"],
        ["💾 Hosting xizmati", "🔒 SSL sertifikat"],
        ["💿 Backup xizmati"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

function sendBotMenu(chatId) {
  const text = `🤖 <b>Bot xizmatlari</b>

🎪 <i>Avtomatlashtirish va samaradorlik</i>

🔥 Qanday bot kerak?`;

  sendAnimatedMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["🔹 Oddiy bot", "🛒 E-commerce bot"],
        ["📊 CRM bot", "⚡ Inline bot"],
        ["💳 Payment bot"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

function sendInnovationMenu(chatId) {
  const text = `🧤 <b>Innovatsion loyiha</b>

🌟 <i>Maxsus ehtiyojlar uchun qo'lqop</i>

🎯 <b>Loyiha haqida:</b>
• Soqovlar uchun maxsus qo'lqop
• Imo-ishoralarni nutqqa aylantirish
• Zamonaviy texnologiya

📹 Videoni ko'ring va qo'llab-quvvatlang!`;

  sendAnimatedMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["📽️ Video ko'rish", "💝 Donat qilish"],
        ["📋 Loyiha haqida", "🛠️ Qanday ishlaydi"],
        ["🎯 Maqsadimiz"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
}

// Statistics Function
function sendStatistics(chatId) {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const totalUsers = Object.keys(userStats).length;
  const totalOrders = orderHistory.length;
  
  const statsText = `📊 <b>Bot Statistikasi</b>

🕒 <b>Ish vaqti:</b> ${Math.floor(uptime / 3600)}s ${Math.floor((uptime % 3600) / 60)}d ${Math.floor(uptime % 60)}s
💾 <b>Xotira:</b> ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
👥 <b>Jami foydalanuvchilar:</b> ${totalUsers}
📦 <b>Jami buyurtmalar:</b> ${totalOrders}
📅 <b>Sana:</b> ${moment().format("DD.MM.YYYY HH:mm")}

🔥 <i>Bot faol ishlayapti!</i>`;

  sendAnimatedMessage(chatId, statsText, { parse_mode: "HTML" });
}

// Admin Functions
function sendAdminPanel(chatId, userId) {
  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, `❌ Sizda admin huquqlari yo'q!\n
    admin: @KXNexsus\n
    admin: @m_kimyonazarov\n
    `);
  }

  const text = `👨‍💼 <b>Admin Panel</b>

🎛️ <i>Boshqaruv markazi</i>

⚙️ Quyidagi amallardan birini tanlang:`;

  sendAnimatedMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      keyboard: [
        ["📊 Batafsil statistika", "📋 Buyurtmalar"],
        ["👥 Foydalanuvchilar", "📢 Xabar yuborish"],
        ["🚫 Ban/Unban", "🗂️ Ma'lumotlar"],
        ["🔙 Bosh menyuga qaytish"]
      ],
      resize_keyboard: true,
    },
  });
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
  
  sendAnimatedMessage(chatId, priceText, { parse_mode: "HTML" });
}

// Contact Information
function sendContactInfo(chatId) {
  const contactText = `📞 <b>Bog'lanish ma'lumotlari</b>

🎯 <i>Har doim aloqada</i>

👨‍💻 <b>Dasturchi:</b> @m_kimyonazarov
📧 <b>Email:</b> coderkimyonazarov@gmail.com
📱 <b>Telefon:</b> +998 77 404 13 56
🌐 <b>Website:</b> https://kxnexsus.uz
📺 <b>Kanal:</b> ${channelUsername}

⏰ <b>Ish vaqti:</b> 09:00 - 18:00 (Dushanba-Juma)
📍 <b>Manzil:</b> Farg'ona, Oltiariq

💬 <i>Savollaringiz uchun doimo tayyormiz!</i>`;

  sendAnimatedMessage(chatId, contactText, { parse_mode: "HTML" });
}

// Error Handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.message);
  logToFile(`Polling error: ${error.message}`);
});

// Delete webhook to avoid conflicts
bot.deleteWebHook().then(() => {
  console.log("Webhook deleted successfully");
}).catch((err) => {
  console.log("No webhook to delete or error:", err.message);
});

// Set bot commands
const commands = [
  { command: "start", description: "🚀 Botni ishga tushirish" },
  { command: "menu", description: "🏠 Asosiy menyuni ochish" },
  { command: "help", description: "❓ Yordam olish" },
  { command: "prices", description: "💰 Xizmat narxlari" },
  { command: "contact", description: "📞 Bog'lanish" },
  { command: "stats", description: "📊 Statistika" },
];

bot.setMyCommands(commands);

// Command Handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (bannedUsers.has(userId)) {
    return bot.sendMessage(chatId, "🚫 Siz botdan foydalanish uchun ban qilingansiz.");
  }

  updateUserStats(userId);

  // Ommaviy chatda boshqacha muomala
  if (isPublicChat(chatId)) {
    const publicWelcome = getPublicChatWelcome(msg.from.first_name);
    return sendAnimatedMessage(chatId, publicWelcome, { 
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

🚀 <i>Professional IT xizmatlar olamiga xush kelibsiz!</i>

🌟 <b>Bizning xizmatlar:</b>
• 🌐 Zamonaviy web-saytlar
• 🤖 Aqlli Telegram botlar  
• 🔑 Domen va hosting
• 📱 Mobile ilovalar
• 🧤 Innovatsion loyihalar

💫 <i>Sifat va ishonch kafolatlaymiz!</i>

📞 <b>Savollar uchun:</b> @KXNexsus`;

  await sendAnimatedMessage(chatId, welcomeText, { parse_mode: "HTML" });
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
/help - ❓ Ushbu yordam xabarini ko'rsatish
/prices - 💰 Xizmat narxlarini ko'rish
/contact - 📞 Bog'lanish ma'lumotlari
/stats - 📊 Bot statistikasi

🛠️ <b>Qo'llab-quvvatlash:</b>
📞 Telegram: @KXNexsus
📧 Email: info@kxnexsus.uz
📺 Kanal: ${channelUsername}

💡 <i>Qo'shimcha yordam kerak bo'lsa, biz bilan bog'laning!</i>`;

  sendAnimatedMessage(chatId, helpText, { parse_mode: "HTML" });
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

// Message Handler
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;
  
  if (bannedUsers.has(userId)) {
    return bot.sendMessage(chatId, "🚫 Siz botdan foydalanish uchun ban qilingansiz.");
  }

  updateUserStats(userId);

  // Ommaviy chatda faqat muhim buyruqlarga javob berish
  if (isPublicChat(chatId)) {
    // Faqat muayyan kalit so'zlarga javob berish
    const keywords = ['bot', 'sayt', 'dasturlash', 'xizmat', 'narx', 'buyurtma', 'loyiha'];
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
    return; // Ommaviy chatda boshqa xabarlarga javob bermaslik
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

  // Handle main menu keyboard buttons
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
      case "🧤 Innovatsion loyiha":
        sendInnovationMenu(chatId);
        break;
      case "💰 Narxlar":
        sendPriceList(chatId);
        break;
      case "📦 Buyurtma berish":
        userState[chatId] = { step: 1, serviceType: "default_buyurtma" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
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
      case "📊 Statistika":
        sendStatistics(chatId);
        break;
      case "ℹ️ Ma'lumotlar":
        const userInfo = `📁 <b>Sizning ma'lumotlaringiz:</b>

👤 <b>Ism:</b> ${msg.from.first_name || "Noma'lum"}
👤 <b>Familiya:</b> ${msg.from.last_name || "Noma'lum"}
📝 <b>Username:</b> ${msg.from.username ? "@" + msg.from.username : "Yo'q"}
🆔 <b>ID:</b> ${msg.from.id}
🌐 <b>Til:</b> ${msg.from.language_code || "Noma'lum"}

🔒 <i>Ma'lumotlaringiz xavfsiz saqlanadi!</i>`;
        
        sendAnimatedMessage(chatId, userInfo, { parse_mode: "HTML" });
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
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📋 Template dan sayt":
        userState[chatId] = { step: 1, serviceType: "order_template" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🔄 Saytni yangilash":
        userState[chatId] = { step: 1, serviceType: "order_update" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📄 Landing page":
        userState[chatId] = { step: 1, serviceType: "order_landing" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🛒 E-commerce sayt":
        userState[chatId] = { step: 1, serviceType: "order_ecommerce" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
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
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🇺🇿 Domen (.uz)":
        userState[chatId] = { step: 1, serviceType: "domain_uz" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💾 Hosting xizmati":
        userState[chatId] = { step: 1, serviceType: "hosting" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🔒 SSL sertifikat":
        userState[chatId] = { step: 1, serviceType: "ssl" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💿 Backup xizmati":
        userState[chatId] = { step: 1, serviceType: "backup" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
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
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "🛒 E-commerce bot":
        userState[chatId] = { step: 1, serviceType: "bot_ecommerce" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "📊 CRM bot":
        userState[chatId] = { step: 1, serviceType: "bot_crm" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "⚡ Inline bot":
        userState[chatId] = { step: 1, serviceType: "bot_inline" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["🔙 Bosh menyuga qaytish"]],
            resize_keyboard: true,
          },
        });
        break;
      case "💳 Payment bot":
        userState[chatId] = { step: 1, serviceType: "bot_payment" };
        sendAnimatedMessage(chatId, "📝 <b>Ismingizni kiriting:</b>", {
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
      sendAnimatedMessage(chatId, "📞 <b>Telefon raqamingizni kiriting:</b>", {
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
      sendAnimatedMessage(chatId, "📝 <b>Loyiha haqida batafsil ma'lumot bering:</b>", {
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
      sendAnimatedMessage(chatId, "💰 <b>Taxminiy byudjetingiz (so'mda):</b>", {
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

      sendAnimatedMessage(chatId, `✅ <b>Buyurtmangiz qabul qilindi!</b>

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

// Express Routes
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Telegram Bot</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 0 auto; max-width: 500px; }
            h1 { margin-bottom: 20px; }
            .status { font-size: 24px; margin: 20px 0; }
            .info { margin: 10px 0; font-size: 18px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Professional IT Bot</h1>
            <div class="status">✅ Bot aktiv ishlayapti!</div>
            <div class="info">⏰ Server vaqti: ${moment().format("DD.MM.YYYY HH:mm:ss")}</div>
            <div class="info">🚀 Uptime: ${Math.floor(process.uptime())} soniya</div>
            <div class="info">👥 Foydalanuvchilar: ${Object.keys(userStats).length}</div>
            <div class="info">📦 Buyurtmalar: ${orderHistory.length}</div>
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
    status: "active"
  };
  res.json(stats);
});

// Start Express Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Express server ${PORT}-portda ishlayapti`);
  logToFile(`Server started on port ${PORT}`);
});

// Log bot start
console.log("🤖 Telegram bot ishga tushdi!");
logToFile("Bot started successfully");

// Log memory usage every hour
setInterval(() => {
  const memUsage = process.memoryUsage();
  logToFile(`Memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 3600000);