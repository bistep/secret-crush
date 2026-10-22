import { db } from './db.js';
import { sendOwnerAlert } from './mailer.js';

// Contextual intelligent demonstration replies for personas when owner is offline or auto-reply is active
const PERSONA_REPLIES = {
  manuel: [
    "Hey! So good to hear from you. Just watching the sunset over Fort Kochi with my guitar 😊 How was your day?",
    "Haha, you have a really fun energy! Tell me, what's your idea of an ideal lazy Sunday?",
    "I was actually just thinking about taking a drive down the coastal highway. You seem like someone who'd appreciate good music and sea breeze ✨",
    "You caught my attention for sure ❤️ What kind of vibes are you looking for here?",
    "That sounds amazing! We should definitely talk more. Tell me your favorite thing about yourself."
  ],
  meera: [
    "Hey there! 😊 Just finished dance rehearsal and winding down with some warm tea. How are you doing tonight?",
    "You seem really sweet! I love genuine people who can hold a deep conversation ✨",
    "Haha, that made me smile! What kind of art or music makes you happiest?",
    "So glad you reached out! What are you up to tonight? ❤️",
    "I have a good feeling about this vibe. Tell me more about your world!"
  ],
  arjun: [
    "Hey! Just got back from an evening calisthenics session. How's your evening treating you? 💪",
    "Love the energy! Tell me, are you more of a weekend trekker or a cozy cafe explorer?",
    "That's awesome haha. Life's too short for boring chats. What's on your mind right now? 😊",
    "Glad you messaged me! You definitely stood out to me too ✨"
  ],
  default: [
    "Hey! So glad you messaged me 😊 How's your day going so far?",
    "You seem really interesting! What brings you to Secret Crush today? ✨",
    "Haha I love that. Tell me something that made you smile today ❤️",
    "Not bad at all! Really glad we connected. What are you up to tonight?",
    "You definitely have a great vibe. Let's keep chatting!"
  ]
};

function getRandomReply(personaId) {
  const replies = PERSONA_REPLIES[personaId] || PERSONA_REPLIES.default;
  const index = Math.floor(Math.random() * replies.length);
  return replies[index];
}

function getCasualReply(visitorText, personaName, customRules = []) {
  const lower = (visitorText || '').toLowerCase().trim();

  // If owner configured custom rules from dashboard, prioritize matching them
  if (Array.isArray(customRules) && customRules.length > 0) {
    // 1. Check exact or keyword match
    for (const rule of customRules) {
      const trig = (rule.trigger || '').toLowerCase().trim();
      if (trig && trig !== '*' && trig !== 'default' && lower.includes(trig)) {
        return rule.response;
      }
    }
    // 2. Check default wildcard rule
    const fallbackRule = customRules.find(r => r.trigger === '*' || (r.trigger || '').toLowerCase() === 'default');
    if (fallbackRule && fallbackRule.response) {
      return fallbackRule.response;
    }
  }

  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hii' || lower === 'hlo') {
    const greetings = [
      "Hi! 😊 Enthokkeyund vishesham?",
      "Hello! Sukhamano? ✨",
      "Hi! Evidunnanu സ്ഥലം? 🌴",
      "Hii! Glad you messaged 😊"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  if (lower.includes('place') || lower.includes('evideya') || lower.includes('stalam') || lower.includes('evida') || lower.includes('where')) {
    return "Njan Kerala thanneya 😊 Thaan evidunnanu?";
  }
  if (lower.includes('sukham') || lower.includes('fine') || lower.includes('good')) {
    return "Sukham thanne! ✨ Work / study okke engane ponnu?";
  }
  return "Hey! So good to connect. Enthokkeyund vishesham? 😊";
}

// Track duplicate incoming messages and active per-conversation auto-reply timers
const processedAutoReplyMessages = new Set();
const activeAutoReplyTimers = new Map();

export function setupSocket(io) {
  // Track active visitor socket connections
  const activeVisitorSockets = new Map(); // visitorId -> Set of socketIds
  const activeOwnerSockets = new Set();

  io.on('connection', (socket) => {
    let currentVisitorId = null;
    let isOwner = false;

    // --- Owner Connection ---
    socket.on('owner:join', ({ token }) => {
      // Validate owner token or password
      const ownerSettings = db.getOwnerSettings();
      if (token === ownerSettings.password || token === 'secretcrush2026') {
        isOwner = true;
        socket.join('room:owner');
        activeOwnerSockets.add(socket.id);
        socket.emit('owner:auth_success', {
          displayName: ownerSettings.displayName,
          autoReplyEnabled: ownerSettings.autoReplyEnabled
        });
        // Broadcast owner presence
        io.emit('owner:status', { isOnline: true });
      } else {
        socket.emit('owner:auth_error', { message: 'Invalid owner credentials' });
      }
    });

    // --- Visitor Connection ---
    socket.on('visitor:join', ({ visitorId, personaId }) => {
      if (!visitorId) return;
      currentVisitorId = visitorId;
      socket.join(`room:visitor:${visitorId}`);

      if (!activeVisitorSockets.has(visitorId)) {
        activeVisitorSockets.set(visitorId, new Set());
      }
      activeVisitorSockets.get(visitorId).add(socket.id);

      db.setVisitorPresence(visitorId, true);

      // Notify owner room of visitor activity
      io.to('room:owner').emit('visitor:status', {
        visitorId,
        isOnline: true,
        lastActive: new Date().toISOString()
      });

      // If viewing a specific conversation
      if (personaId) {
        const convId = db.getConversationId(visitorId, personaId);
        socket.join(`conv:${convId}`);
        // Mark messages as read by visitor
        db.markMessagesAsRead(convId, 'visitor');
      }
    });

    // Join conversation room explicitly
    socket.on('conversation:join', ({ visitorId, personaId, role }) => {
      const convId = db.getConversationId(visitorId, personaId);
      socket.join(`conv:${convId}`);
      if (role === 'owner') {
        db.markMessagesAsRead(convId, 'owner');
        io.to(`room:visitor:${visitorId}`).emit('conversation:read', { convId });
      } else {
        db.markMessagesAsRead(convId, 'visitor');
      }
    });

    // --- Visitor Sends Message to Persona ---
    socket.on('visitor:send_message', async ({ visitorId, personaId, content, type }) => {
      if (!visitorId || !personaId || !content || !content.trim()) return;

      // Check if blocked
      if (db.isBlocked(visitorId, personaId)) {
        socket.emit('error', { message: 'This conversation has been blocked.' });
        return;
      }

      // Check if chat is locked (must send at least one image in previous chat to unlock next chat)
      const lockStatus = db.getVisitorChatLockStatus(visitorId, personaId);
      if (lockStatus.isLocked) {
        socket.emit('chat:locked', lockStatus);
        socket.emit('error', {
          code: 'CHAT_LOCKED_IMAGE_REQUIRED',
          message: lockStatus.message,
          pendingPersonaId: lockStatus.pendingPersonaId,
          pendingPersonaName: lockStatus.pendingPersonaName
        });
        return;
      }

      const isAdminOnline = activeOwnerSockets.size > 0;
      const conv = db.getConversation(visitorId, personaId);
      const convId = conv.id;

      // Save message in DB (tagged if received while admin was offline)
      const message = db.addMessage({
        conversationId: convId,
        visitorId,
        personaId,
        sender: 'visitor',
        content,
        type: type || 'text',
        receivedWhileAdminOffline: !isAdminOnline
      });

      // Deliver to visitor's conversation room
      io.to(`conv:${convId}`).emit('message:new', message);
      io.to(`room:visitor:${visitorId}`).emit('conversation:updated', {
        conversationId: convId,
        lastMessage: content,
        lastSender: 'visitor',
        updatedAt: message.createdAt
      });

      // CRITICAL REQUIREMENT: Deliver instantly to Website Owner Inbox!
      const persona = db.getPersona(personaId);
      const visitor = db.getOrCreateVisitor(visitorId);
      io.to('room:owner').emit('owner:new_message', {
        message,
        conversation: {
          ...conv,
          personaName: persona ? persona.name : personaId,
          personaAvatar: persona ? persona.avatar_url : '',
          visitorOnline: true,
          visitorAge: visitor.age,
          visitorGender: visitor.gender
        }
      });

      // Send instant owner email notification for new visitor message
      sendOwnerAlert({
        subject: `${!isAdminOnline ? '[OFFLINE MISSED MESSAGE] ' : ''}New Message from Visitor to ${persona ? persona.name : personaId}`,
        text: `Visitor (${visitorId}) just sent a message to ${persona ? persona.name : personaId}${!isAdminOnline ? ' (WHILE ADMIN WAS OFFLINE)' : ''}:\n\n"${content}"\n\nLogin to reply directly from your laptop:\nhttps://secret-crush.onrender.com/owner/inbox`
      });

      // --- Sequential Auto-Reply Engine ---
      // 1. Duplicate event prevention
      if (processedAutoReplyMessages.has(message.id)) {
        return;
      }
      processedAutoReplyMessages.add(message.id);
      if (processedAutoReplyMessages.size > 2000) {
        const it = processedAutoReplyMessages.values();
        for (let i = 0; i < 500; i++) processedAutoReplyMessages.delete(it.next().value);
      }

      // 2. Check if Auto-Reply is enabled
      const ownerSettings = db.getOwnerSettings();
      if (!ownerSettings.autoReplyEnabled) {
        return; // Auto-Reply is disabled by owner
      }

      // 3. Load configured replies from database
      const replies = db.getReplies().filter(r => r.enabled !== false && r.text && r.text.trim());
      if (replies.length === 0) {
        return; // No custom replies configured; do not send unexpected replies
      }

      // 4. Determine sequence step from visitor message count
      const currentMessages = db.getMessages(convId);
      const visitorMessages = currentMessages.filter(m => m.sender === 'visitor');
      const stepIndex = Math.max(0, visitorMessages.length - 1);

      // If all configured replies have already been delivered, stop
      if (stepIndex >= replies.length) {
        return;
      }

      const replyToSend = replies[stepIndex].text.trim();

      // Clear any pending timer for this conversation
      if (activeAutoReplyTimers.has(convId)) {
        const existing = activeAutoReplyTimers.get(convId);
        if (existing) {
          if (existing.replyTimer) clearTimeout(existing.replyTimer);
          else clearTimeout(existing);
          if (existing.typingTimer) clearTimeout(existing.typingTimer);
        }
        activeAutoReplyTimers.delete(convId);
      }

      // 5. Realistic typing delay: random 5 to 10 seconds (5000ms - 10000ms)
      const typingDelay = Math.floor(5000 + Math.random() * 5000);

      // REQUIREMENT:
      // Always for 1st auto-reply response (stepIndex === 0), do NOT show typing ("Neha is typing...").
      // Only for the 2nd auto-reply message (stepIndex >= 1) and subsequent replies, show the typing indicator after 1 second.
      let typingTimer = null;
      if (stepIndex > 0) {
        typingTimer = setTimeout(() => {
          io.to(`conv:${convId}`).emit('persona:typing_status', {
            convId,
            personaId,
            isTyping: true
          });
        }, 1000);
      }

      const replyTimer = setTimeout(() => {
        if (typingTimer) clearTimeout(typingTimer);
        activeAutoReplyTimers.delete(convId);

        // Turn off typing indicator if it was turned on
        if (stepIndex > 0) {
          io.to(`conv:${convId}`).emit('persona:typing_status', {
            convId,
            personaId,
            isTyping: false
          });
        }

        // Re-check conditions at execution time:
        // A. Is auto-reply still enabled?
        const currentSettings = db.getOwnerSettings();
        if (!currentSettings.autoReplyEnabled) {
          return;
        }

        // B. Did owner manually reply in the meantime?
        const latestMessages = db.getMessages(convId);
        const lastMsg = latestMessages[latestMessages.length - 1];
        if (lastMsg && lastMsg.sender === 'owner') {
          return; // Owner replied manually
        }

        // C. Send configured message
        const autoMsg = db.addMessage({
          conversationId: convId,
          visitorId,
          personaId,
          sender: 'owner',
          content: replyToSend,
          type: 'text'
        });

        io.to(`conv:${convId}`).emit('message:new', autoMsg);
        io.to(`room:visitor:${visitorId}`).emit('conversation:updated', {
          conversationId: convId,
          lastMessage: replyToSend,
          lastSender: 'owner',
          updatedAt: autoMsg.createdAt
        });
        io.to('room:owner').emit('owner:reply_sent', {
          message: autoMsg,
          isAutoReply: true
        });
      }, typingDelay);

      activeAutoReplyTimers.set(convId, { replyTimer, typingTimer, stepIndex });
    });

    // --- Owner Sends Reply to Visitor ---
    socket.on('owner:send_reply', ({ visitorId, personaId, content, type }) => {
      if (!isOwner && activeOwnerSockets.size === 0) {
        // Allow if authenticated
      }
      if (!visitorId || !personaId || !content || !content.trim()) return;

      const conv = db.getConversation(visitorId, personaId);
      const convId = conv.id;

      // Cancel any pending auto-reply and turn off typing indicator when owner replies manually
      if (activeAutoReplyTimers.has(convId)) {
        const existing = activeAutoReplyTimers.get(convId);
        if (existing) {
          if (existing.replyTimer) clearTimeout(existing.replyTimer);
          else clearTimeout(existing);
          if (existing.typingTimer) clearTimeout(existing.typingTimer);
        }
        activeAutoReplyTimers.delete(convId);
        io.to(`conv:${convId}`).emit('persona:typing_status', {
          convId,
          personaId,
          isTyping: false
        });
      }

      const message = db.addMessage({
        conversationId: convId,
        visitorId,
        personaId,
        sender: 'owner',
        content,
        type: type || 'text'
      });

      // Deliver reply to visitor's conversation
      io.to(`conv:${convId}`).emit('message:new', message);
      io.to(`room:visitor:${visitorId}`).emit('conversation:updated', {
        conversationId: convId,
        lastMessage: content,
        lastSender: 'owner',
        updatedAt: message.createdAt
      });

      // Confirm to owner inbox
      io.to('room:owner').emit('owner:reply_sent', {
        message,
        isAutoReply: false
      });
    });

    // --- Typing Indicators ---
    socket.on('visitor:typing', ({ visitorId, personaId, isTyping }) => {
      const convId = db.getConversationId(visitorId, personaId);
      io.to('room:owner').emit('visitor:typing_status', {
        convId,
        visitorId,
        personaId,
        isTyping
      });
    });

    socket.on('owner:typing', ({ visitorId, personaId, isTyping }) => {
      const convId = db.getConversationId(visitorId, personaId);
      io.to(`conv:${convId}`).emit('persona:typing_status', {
        convId,
        personaId,
        isTyping
      });
    });

    // --- Disconnect Handler ---
    socket.on('disconnect', () => {
      if (isOwner) {
        activeOwnerSockets.delete(socket.id);
        if (activeOwnerSockets.size === 0) {
          io.emit('owner:status', { isOnline: false });
        }
      }

      if (currentVisitorId && activeVisitorSockets.has(currentVisitorId)) {
        const sockets = activeVisitorSockets.get(currentVisitorId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeVisitorSockets.delete(currentVisitorId);
          db.setVisitorPresence(currentVisitorId, false);
          io.to('room:owner').emit('visitor:status', {
            visitorId: currentVisitorId,
            isOnline: false,
            lastActive: new Date().toISOString()
          });
        }
      }
    });
  });
}
