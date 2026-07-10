// ============================================================
// Secure Surf Zone X — Telegram Bot
// ইউজারদের জন্য মেইন অ্যাপ ওপেন করে, শুধু এডমিনদের জন্য Admin Panel ওপেন করে
// ============================================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ---- .env ফাইল থেকে কনফিগ লোড হচ্ছে ----
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;             // index.html এর পাবলিক HTTPS লিংক
const ADMIN_APP_URL = process.env.ADMIN_APP_URL; // admin.html এর পাবলিক HTTPS লিংক

// ---- শুধু এই Telegram User ID গুলোই এডমিন প্যানেল খুলতে পারবে ----
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

// ---- সময় (বাংলাদেশ টাইম, UTC+6) অনুযায়ী সুন্দর শুভেচ্ছা মেসেজ ----
function getGreeting() {
    const bdHour = (new Date().getUTCHours() + 6) % 24;
    if (bdHour >= 5 && bdHour < 12) return '☀️ শুভ সকাল';
    if (bdHour >= 12 && bdHour < 17) return '🌤️ শুভ দুপুর';
    if (bdHour >= 17 && bdHour < 20) return '🌆 শুভ সন্ধ্যা';
    return '🌙 শুভ রাত্রি';
}

// ---- বাগ ফিক্স: আগে regex ছিল /\/start/ এবং /\/admin/ — এগুলো অ্যাঙ্কর করা ছিল না,
// ফলে "/starting" বা "/administrator" এর মতো মেসেজেও ভুলভাবে ম্যাচ করত।
// এখন ^ এবং $ দিয়ে অ্যাঙ্কর করা হয়েছে + বট ইউজারনেম সহ কমান্ড (/start@yourbot) ও সাপোর্ট করে ----
const START_REGEX = /^\/start(@\w+)?$/;
const ADMIN_REGEX = /^\/admin(@\w+)?$/;
const HELP_REGEX = /^\/help(@\w+)?$/;

// ---- /start — সাধারণ ইউজারদের জন্য মেইন অ্যাপ ওপেন করার বাটন ----
bot.onText(START_REGEX, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'বন্ধু';
    const greeting = getGreeting();

    // ---- হালকা "টাইপিং" এনিমেশন ইফেক্ট — মেসেজ পাঠানোর আগে একটু টাইপিং দেখাবে ----
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (e) { /* চ্যাট অ্যাকশন ফেইল হলেও সমস্যা নেই, মেসেজ ঠিকই যাবে */ }

    setTimeout(async () => {
        const welcomeText =
            `${greeting}, *${firstName}*! 👋\n\n` +
            `✨ *Secure Surf Zone X* এ আপনাকে স্বাগতম ✨\n\n` +
            `🛍️ প্রিমিয়াম সার্ভিস\n` +
            `📥 সহজ ডিপোজিট (bKash / Nagad / Rocket)\n` +
            `⚡ দ্রুত ও নিরাপদ ডেলিভারি\n\n` +
            `নিচের বাটনে ক্লিক করে অ্যাপ খুলুন 👇`;

        try {
            await bot.sendMessage(chatId, welcomeText, {
                parse_mode: 'Markdown',
                reply_markup: {
                    // ---- নতুন: সুন্দর মাল্টি-রো ইনলাইন বাটন লেআউট ----
                    // নোট: Telegram Bot API বাটনের ব্যাকগ্রাউন্ড কালার কাস্টমাইজ করতে দেয় না
                    // (এটা ইউজারের অ্যাপ থিমের উপর নির্ভর করে) — তাই রঙিন গোল ইমোজি
                    // (🔵🟣🟢) ব্যবহার করে বাটনগুলোকে ভিজ্যুয়ালি রঙিন ও আলাদা দেখানো হয়েছে।
                    inline_keyboard: [
                        [{ text: '🔵 🚀 Open App', web_app: { url: APP_URL } }],
                        [
                            { text: '🟣 ℹ️ About', callback_data: 'about' },
                            { text: '🟢 ❓ Help', callback_data: 'help' }
                        ]
                    ]
                }
            });
            console.log(`✅ /start ব্যবহার করেছেন: ${firstName} (ID: ${msg.from.id})`);
        } catch (err) {
            console.error(`❌ /start মেসেজ পাঠাতে সমস্যা হয়েছে (ID: ${msg.from.id}):`, err.message);
        }
    }, 900);
});

// ---- /admin — শুধুমাত্র ADMIN_IDS এ থাকা ইউজারদের জন্য Admin Panel ওপেন করার বাটন ----
bot.onText(ADMIN_REGEX, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '⛔ আপনি এই কমান্ড ব্যবহার করার অনুমতিপ্রাপ্ত নন।');
        console.log(`⚠️ Unauthorized /admin attempt — Name: ${msg.from.first_name || 'Unknown'}, ID: ${userId}, Username: @${msg.from.username || 'none'}`);
        return;
    }

    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (e) { /* সমস্যা নেই */ }

    setTimeout(async () => {
        try {
            await bot.sendMessage(chatId, '🔐 *Admin Panel*\n\nনিচের বাটনে ক্লিক করে প্যানেল খুলুন 👇', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🟠 ⚙️ Open Admin Panel', web_app: { url: ADMIN_APP_URL } }]
                    ]
                }
            });
            console.log(`👮 এডমিন প্যানেল খুলেছেন: ${msg.from.first_name || 'Admin'} (ID: ${userId})`);
        } catch (err) {
            console.error(`❌ /admin মেসেজ পাঠাতে সমস্যা হয়েছে (ID: ${userId}):`, err.message);
        }
    }, 500);
});

// ---- /help — কমান্ড লিস্ট দেখানো ----
bot.onText(HELP_REGEX, (msg) => {
    bot.sendMessage(msg.chat.id,
        `📖 *কমান্ড লিস্ট*\n\n` +
        `🔵 /start — অ্যাপ খুলুন\n` +
        `🟢 /help — এই সাহায্য মেসেজ দেখুন\n`,
        { parse_mode: 'Markdown' }
    );
});

// ---- নতুন: "About" ও "Help" ইনলাইন বাটনে ক্লিক করলে যা হবে ----
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'about') {
        await bot.sendMessage(chatId,
            `✨ *Secure Surf Zone X* সম্পর্কে\n\n` +
            `আমরা প্রিমিয়াম সার্ভিস দিয়ে থাকি, দ্রুত ও নিরাপদ ডেলিভারির সাথে। ` +
            `bKash, Nagad, Rocket দিয়ে সহজেই ডিপোজিট করা যায়।`,
            { parse_mode: 'Markdown' }
        );
    } else if (query.data === 'help') {
        await bot.sendMessage(chatId,
            `❓ *সাহায্য*\n\n` +
            `🔵 /start — অ্যাপ খুলতে\n` +
            `🟢 /help — এই মেসেজ দেখতে\n\n` +
            `কোনো সমস্যা হলে অ্যাপের ভিতরে "📞 Support" পেজ থেকে যোগাযোগ করুন।`,
            { parse_mode: 'Markdown' }
        );
    }

    // ---- callback query কে "answer" না করলে ইউজারের বাটনে লোডিং স্পিনার আটকে থাকে ----
    try {
        await bot.answerCallbackQuery(query.id);
    } catch (e) { /* সমস্যা নেই */ }
});

// ---- অন্য যেকোনো মেসেজে সাহায্য দেখানো ----
bot.on('message', (msg) => {
    if (!msg.text) return;
    if (START_REGEX.test(msg.text) || ADMIN_REGEX.test(msg.text) || HELP_REGEX.test(msg.text)) return;
    bot.sendMessage(msg.chat.id, 'অ্যাপ খুলতে /start লিখুন, অথবা /help দিয়ে কমান্ড লিস্ট দেখুন।');
});

bot.on('polling_error', (err) => {
    console.error('❌ Polling error:', err.message);
});

console.log('🤖 বট চালু হয়েছে...');
console.log(`👮 এডমিন আইডি: ${ADMIN_IDS.length > 0 ? ADMIN_IDS.join(', ') : 'কোনো এডমিন সেট করা নেই!'}`);
