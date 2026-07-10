// ============================================================
// Secure Surf Zone X — Telegram Bot
// ইউজারদের জন্য মেইন অ্যাপ ওপেন করে, শুধু এডমিনদের জন্য Admin Panel ওপেন করে
// ============================================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ---- .env ফাইল থেকে কনফিগ লোড হচ্ছে (নিচে .env.example দেখুন) ----
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;           // index.html এর পাবলিক HTTPS লিংক
const ADMIN_APP_URL = process.env.ADMIN_APP_URL; // admin.html এর পাবলিক HTTPS লিংক

// ---- শুধু এই Telegram User ID গুলোই এডমিন প্যানেল খুলতে পারবে ----
// একাধিক এডমিন থাকলে কমা দিয়ে আলাদা করুন, যেমন: "123456789,987654321"
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN দেওয়া হয়নি! .env ফাইলে BOT_TOKEN সেট করুন।');
    process.exit(1);
}
if (!APP_URL) {
    console.error('❌ APP_URL দেওয়া হয়নি! .env ফাইলে APP_URL সেট করুন (index.html এর পাবলিক HTTPS লিংক)।');
    process.exit(1);
}
if (!ADMIN_APP_URL) {
    console.error('❌ ADMIN_APP_URL দেওয়া হয়নি! .env ফাইলে ADMIN_APP_URL সেট করুন (admin.html এর পাবলিক HTTPS লিংক)।');
    process.exit(1);
}
if (ADMIN_IDS.length === 0) {
    console.warn('⚠️ কোনো ADMIN_IDS সেট করা নেই — এখন কেউই /admin কমান্ড দিয়ে Admin Panel খুলতে পারবে না।');
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function isAdmin(userId) {
    return ADMIN_IDS.includes(String(userId));
}

// ---- /start — সাধারণ ইউজারদের জন্য মেইন অ্যাপ ওপেন করার বাটন ----
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '✨ স্বাগতম Secure Surf Zone X এ! নিচের বাটনে ক্লিক করে অ্যাপ খুলুন 👇', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🚀 Open App', web_app: { url: APP_URL } }
            ]]
        }
    });
});

// ---- /admin — শুধুমাত্র ADMIN_IDS এ থাকা ইউজারদের জন্য Admin Panel ওপেন করার বাটন ----
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
        // ---- বাগ/সিকিউরিটি ফিক্স: এডমিন না হলে কোনো বাটনই পাঠানো হবে না, শুধু প্রত্যাখ্যান মেসেজ ----
        bot.sendMessage(chatId, '⛔ আপনি এই কমান্ড ব্যবহার করার অনুমতিপ্রাপ্ত নন।');
        console.log(`⚠️ Unauthorized /admin attempt from user ID: ${userId} (${msg.from.username || 'no username'})`);
        return;
    }

    bot.sendMessage(chatId, '🔐 Admin Panel খুলতে নিচের বাটনে ক্লিক করুন 👇', {
        reply_markup: {
            inline_keyboard: [[
                { text: '⚙️ Open Admin Panel', web_app: { url: ADMIN_APP_URL } }
            ]]
        }
    });
});

// ---- অন্য যেকোনো মেসেজে সাহায্য দেখানো ----
bot.on('message', (msg) => {
    if (msg.text && (msg.text.startsWith('/start') || msg.text.startsWith('/admin'))) return;
    if (!msg.text) return;
    bot.sendMessage(msg.chat.id, 'অ্যাপ খুলতে /start লিখুন।');
});

bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
});

console.log('🤖 বট চালু হয়েছে...');
console.log(`👮 এডমিন আইডি: ${ADMIN_IDS.length > 0 ? ADMIN_IDS.join(', ') : 'কোনো এডমিন সেট করা নেই!'}`);
