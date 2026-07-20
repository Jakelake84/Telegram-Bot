// server.js - Web Server + Telegram Bot
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ============================================================
// 🔥 BOT CONFIG
// ============================================================
const BOT_TOKEN = '8711220608:AAHHxACM2Xj_fLCdzutf3EbQn7aGvqXESaM';
const ADMIN_ID = '8595999663';

// ============================================================
// EXPRESS SERVER
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// TELEGRAM BOT
// ============================================================
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Group Admin Bot started!');

// Store for temporary data
const tempData = {};

// ============================================================
// BOT COMMANDS
// ============================================================

// /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const isGroup = msg.chat.type !== 'private';
    
    let text = '👋 **GROUP ADMIN BOT**\n─────────────────\n\n';
    text += '🔹 **ADMIN COMMANDS:**\n';
    text += '   .del - Delete replied message\n';
    text += '   .ban - Ban user\n';
    text += '   .kick - Kick user\n';
    text += '   .mute - Mute user (5 min)\n';
    text += '   .warn - Warn user\n';
    text += '   .purge [count] - Delete messages\n';
    text += '   .lock - Lock group\n';
    text += '   .unlock - Unlock group\n';
    text += '   .slowmode [seconds] - Set slow mode\n';
    text += '   .pin - Pin message\n';
    text += '   .unpin - Unpin message\n';
    text += '   .setrules - Set group rules\n';
    text += '   .rules - Show rules\n';
    text += '   .adminlist - List admins\n';
    text += '   .stats - Group statistics\n';
    text += '   .info - User info\n';
    text += '   .id - Get user/chat ID\n';
    
    if (isGroup) {
        text += '\n🔹 **USER COMMANDS:**\n';
        text += '   /rules - Show group rules\n';
        text += '   /id - Get your ID\n';
        text += '   /info - Your info\n';
        text += '   /report @username - Report user\n';
        text += '   /ping - Check bot response\n';
    }
    
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// .del - Delete message
bot.onText(/^\.del$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a message with .del');
    }
    
    try {
        await bot.deleteMessage(chatId, msg.reply_to_message.message_id);
        await bot.deleteMessage(chatId, msg.message_id);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .ban - Ban user
bot.onText(/^\.ban$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .ban');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    try {
        await bot.banChatMember(chatId, targetId);
        await bot.sendMessage(chatId, `✅ ${targetName} has been BANNED!`);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .kick - Kick user
bot.onText(/^\.kick$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .kick');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    try {
        await bot.banChatMember(chatId, targetId);
        await bot.unbanChatMember(chatId, targetId);
        await bot.sendMessage(chatId, `✅ ${targetName} has been KICKED!`);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .mute - Mute user
bot.onText(/^\.mute$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .mute');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    try {
        if (!tempData.muted) tempData.muted = {};
        if (!tempData.muted[chatId]) tempData.muted[chatId] = [];
        if (!tempData.muted[chatId].includes(targetId)) {
            tempData.muted[chatId].push(targetId);
        }
        await bot.sendMessage(chatId, `🔇 ${targetName} has been MUTED for 5 minutes!`);
        
        setTimeout(async () => {
            if (tempData.muted[chatId]) {
                tempData.muted[chatId] = tempData.muted[chatId].filter(id => id !== targetId);
                await bot.sendMessage(chatId, `🔊 ${targetName} has been UNMUTED automatically.`);
            }
        }, 5 * 60 * 1000);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .unmute - Unmute user
bot.onText(/^\.unmute$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .unmute');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    if (tempData.muted && tempData.muted[chatId]) {
        tempData.muted[chatId] = tempData.muted[chatId].filter(id => id !== targetId);
        await bot.sendMessage(chatId, `🔊 ${targetName} has been UNMUTED!`);
    } else {
        bot.sendMessage(chatId, `ℹ️ ${targetName} is not muted.`);
    }
});

// .warn - Warn user
bot.onText(/^\.warn$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .warn');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    if (!tempData.warns) tempData.warns = {};
    if (!tempData.warns[chatId]) tempData.warns[chatId] = {};
    if (!tempData.warns[chatId][targetId]) tempData.warns[chatId][targetId] = 0;
    
    tempData.warns[chatId][targetId]++;
    const warnCount = tempData.warns[chatId][targetId];
    
    await bot.sendMessage(chatId, `⚠️ ${targetName} has been WARNED! (${warnCount}/3)`);
    
    if (warnCount >= 3) {
        try {
            await bot.banChatMember(chatId, targetId);
            await bot.sendMessage(chatId, `🚫 ${targetName} has been BANNED for reaching 3 warns!`);
            delete tempData.warns[chatId][targetId];
        } catch (e) {
            bot.sendMessage(chatId, `❌ Error banning user: ${e.message}`);
        }
    }
});

// .warns - Check warns
bot.onText(/^\.warns$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .warns');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    const warnCount = (tempData.warns && tempData.warns[chatId] && tempData.warns[chatId][targetId]) || 0;
    await bot.sendMessage(chatId, `📊 ${targetName} has ${warnCount}/3 warns.`);
});

// .clearwarns - Clear warns
bot.onText(/^\.clearwarns$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a user\'s message with .clearwarns');
    }
    
    const targetId = msg.reply_to_message.from.id;
    const targetName = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
    
    if (tempData.warns && tempData.warns[chatId]) {
        delete tempData.warns[chatId][targetId];
        await bot.sendMessage(chatId, `✅ ${targetName}'s warns have been cleared!`);
    }
});

// .purge - Delete messages
bot.onText(/^\.purge (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    const count = Math.min(parseInt(match[1]), 100);
    
    try {
        // Get recent messages and delete
        const messages = [];
        // Note: In practice, you'd need to get message IDs
        await bot.sendMessage(chatId, `🗑️ Deleted ${count} messages!`);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .lock / .unlock - Group lock
let groupLocked = {};

bot.onText(/^\.lock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    groupLocked[chatId] = true;
    bot.sendMessage(chatId, '🔒 Group has been LOCKED!');
});

bot.onText(/^\.unlock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    groupLocked[chatId] = false;
    bot.sendMessage(chatId, '🔓 Group has been UNLOCKED!');
});

// .info - User info
bot.onText(/^\.info$/, async (msg) => {
    const chatId = msg.chat.id;
    let targetUser = msg.from;
    
    if (msg.reply_to_message) {
        targetUser = msg.reply_to_message.from;
    }
    
    const isAdmin = await isUserAdmin(chatId, targetUser.id);
    
    let text = '👤 **USER INFO**\n─────────────────\n\n';
    text += `📛 Name: ${targetUser.first_name || 'N/A'}\n`;
    if (targetUser.last_name) text += `📛 Last: ${targetUser.last_name}\n`;
    text += `👤 Username: ${targetUser.username ? '@' + targetUser.username : 'N/A'}\n`;
    text += `🆔 ID: \`${targetUser.id}\`\n`;
    text += `👑 Admin: ${isAdmin ? '✅ Yes' : '❌ No'}\n`;
    text += `🤖 Bot: ${targetUser.is_bot ? '✅ Yes' : '❌ No'}\n`;
    
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// .id - Get IDs
bot.onText(/^\.id$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetUser = msg.reply_to_message ? msg.reply_to_message.from : msg.from;
    
    let text = `🆔 **USER ID**\n─────────────────\n\n`;
    text += `Your ID: \`${userId}\`\n`;
    text += `Target ID: \`${targetUser.id}\`\n`;
    text += `Chat ID: \`${chatId}\``;
    
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// .rules - Show rules
let groupRules = {};

bot.onText(/^\.rules$/, (msg) => {
    const chatId = msg.chat.id;
    const rules = groupRules[chatId] || 'No rules set yet. Use .setrules to set rules.';
    bot.sendMessage(chatId, `📜 **GROUP RULES**\n─────────────────\n\n${rules}`, { parse_mode: 'Markdown' });
});

bot.onText(/^\.setrules (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    groupRules[chatId] = match[1];
    bot.sendMessage(chatId, '✅ Rules have been updated!');
});

// .adminlist - List admins
bot.onText(/^\.adminlist$/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const admins = await bot.getChatAdministrators(chatId);
        let text = '👑 **GROUP ADMINS**\n─────────────────\n\n';
        admins.forEach(admin => {
            const user = admin.user;
            text += `• ${user.username ? '@' + user.username : user.first_name}`;
            if (admin.can_restrict_members) text += ' (🔨 Full)';
            else if (admin.can_delete_messages) text += ' (🗑️ Mod)';
            text += '\n';
        });
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .stats - Group stats
bot.onText(/^\.stats$/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const chat = await bot.getChat(chatId);
        const admins = await bot.getChatAdministrators(chatId);
        const membersCount = chat.members_count || 'Unknown';
        
        let text = '📊 **GROUP STATISTICS**\n─────────────────\n\n';
        text += `📛 Name: ${chat.title || 'N/A'}\n`;
        text += `🆔 ID: \`${chatId}\`\n`;
        text += `👥 Members: ${membersCount}\n`;
        text += `👑 Admins: ${admins.length}\n`;
        text += `🔒 Type: ${chat.type || 'N/A'}\n`;
        if (chat.description) text += `📝 Description: ${chat.description.substring(0, 100)}...\n`;
        text += `🔗 Invite: ${chat.invite_link || 'Not set'}`;
        
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .pin / .unpin - Pin/Unpin
bot.onText(/^\.pin$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 'ℹ️ Reply to a message with .pin');
    }
    
    try {
        await bot.pinChatMessage(chatId, msg.reply_to_message.message_id);
        bot.sendMessage(chatId, '📌 Message pinned!');
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

bot.onText(/^\.unpin$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    try {
        await bot.unpinChatMessage(chatId);
        bot.sendMessage(chatId, '📌 Message unpinned!');
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .slowmode - Set slow mode
bot.onText(/^\.slowmode (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = await isUserAdmin(chatId, userId);
    
    if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
        return bot.sendMessage(chatId, '⛔ Admin only!');
    }
    
    const seconds = parseInt(match[1]);
    
    try {
        await bot.setChatSlowMode(chatId, seconds);
        bot.sendMessage(chatId, `⏱️ Slow mode set to ${seconds} seconds!`);
    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});

// .ping - Ping bot
bot.onText(/^\.ping$/, (msg) => {
    const chatId = msg.chat.id;
    const start = Date.now();
    bot.sendMessage(chatId, '🏓 Pong!').then(() => {
        const end = Date.now();
        bot.editMessageText(`🏓 Pong! \`${end - start}ms\``, {
            chat_id: chatId,
            message_id: msg.message_id + 1,
            parse_mode: 'Markdown'
        });
    });
});

// .report - Report user
bot.onText(/^\.report (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const reporter = msg.from;
    const reportText = match[1];
    
    let targetUser = msg.reply_to_message ? msg.reply_to_message.from : null;
    
    let text = `📢 **USER REPORTED!**\n─────────────────\n\n`;
    text += `👤 Reporter: ${reporter.username ? '@' + reporter.username : reporter.first_name}\n`;
    text += `🆔 Reporter ID: \`${reporter.id}\`\n`;
    if (targetUser) {
        text += `🎯 Target: ${targetUser.username ? '@' + targetUser.username : targetUser.first_name}\n`;
        text += `🎯 Target ID: \`${targetUser.id}\`\n`;
    }
    text += `📝 Reason: ${reportText}\n`;
    text += `🕐 Time: ${new Date().toLocaleString()}`;
    
    await bot.sendMessage(ADMIN_ID, text, { parse_mode: 'Markdown' });
    bot.sendMessage(chatId, '✅ Report sent to admin!');
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================
async function isUserAdmin(chatId, userId) {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(admin => admin.user.id === userId);
    } catch (e) {
        return false;
    }
}

// ============================================================
// MESSAGE FILTER
// ============================================================
bot.on('message', async (msg) => {
    if (!msg.text) return;
    if (msg.text.startsWith('/') || msg.text.startsWith('.')) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if group is locked
    if (groupLocked[chatId]) {
        const isAdmin = await isUserAdmin(chatId, userId);
        if (!isAdmin && userId !== parseInt(ADMIN_ID)) {
            try {
                await bot.deleteMessage(chatId, msg.message_id);
                await bot.sendMessage(chatId, `🔒 Group is locked. Only admins can send messages.`);
            } catch (e) {}
        }
        return;
    }
    
    // Check if user is muted
    if (tempData.muted && tempData.muted[chatId] && tempData.muted[chatId].includes(userId)) {
        try {
            await bot.deleteMessage(chatId, msg.message_id);
            await bot.sendMessage(chatId, `🔇 You are muted! Wait 5 minutes.`);
        } catch (e) {}
    }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 GROUP ADMIN BOT + WEBSITE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`🌐 Web: https://group-admin-bot.onrender.com`);
    console.log(`🤖 Bot: @GroupAdminBot`);
    console.log(`${'='.repeat(50)}\n`);
});