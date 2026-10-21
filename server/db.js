import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_PERSONAS } from './personas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.data = {
      visitors: {},
      personas: {},
      conversations: {},
      messages: [],
      favorites: {}, // visitorId: [personaIds]
      reports: [],
      blocks: {}, // visitorId: [personaIds]
      owner: {
        username: process.env.OWNER_USERNAME || 'owner',
        password: process.env.OWNER_PASSWORD || 'secretcrush2026',
        displayName: 'Secret Crush Operator & Concierge',
        autoReplyEnabled: true,
        autoReplyDelaySec: 6,
        autoReplySequence: [
          "Hi! 😊 Enthokkeyund vishesham?",
          "Njan Kerala thanneya 😊 Thaan evidunnanu? 🌴"
        ],
        customAutoReplies: [
          { id: '1', trigger: 'hi', response: 'Hi! Enthokkeyund vishesham? 😊' },
          { id: '2', trigger: 'evideya', response: 'Njan Kerala thanneya 😊 Thaan evidunnanu?' },
          { id: '3', trigger: '*', response: 'Hey! So glad you messaged. Sukhamano? ✨' }
        ]
      }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
      if (this.data.owner) {
        if (this.data.owner.autoReplyEnabled === undefined) {
          this.data.owner.autoReplyEnabled = true;
        }
        if (!Array.isArray(this.data.owner.replies)) {
          if (Array.isArray(this.data.owner.autoReplySequence) && this.data.owner.autoReplySequence.length > 0) {
            this.data.owner.replies = this.data.owner.autoReplySequence.map((text, idx) => ({
              id: `reply-${idx + 1}`,
              text,
              sequence: idx + 1,
              enabled: true
            }));
          } else {
            this.data.owner.replies = [
              { id: 'reply-1', text: 'Hi! 😊 Enthokkeyund vishesham?', sequence: 1, enabled: true },
              { id: 'reply-2', text: 'Njan Kerala thanneya 😊 Thaan evidunnanu? 🌴', sequence: 2, enabled: true }
            ];
          }
        }
      }
      // Populate/sync with all 108 Kerala game-style avatar personas
      this.data.personas = {};
      INITIAL_PERSONAS.forEach(p => {
        this.data.personas[p.id] = p;
      });
      this.save();
    } catch (err) {
      console.error('Error loading DB, using fallback defaults:', err.message);
      this.data.personas = {};
      INITIAL_PERSONAS.forEach(p => {
        this.data.personas[p.id] = p;
      });
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB:', err.message);
    }
  }

  // --- Personas ---
  getPersonas() {
    return Object.values(this.data.personas);
  }

  getPersona(id) {
    return this.data.personas[id] || null;
  }

  updatePersonaPresence(id, isOnline, lastSeen) {
    if (this.data.personas[id]) {
      this.data.personas[id].is_online = isOnline;
      if (lastSeen) this.data.personas[id].last_seen = lastSeen;
      this.save();
    }
  }

  // --- Visitors ---
  getOrCreateVisitor(visitorId, metadata = {}) {
    if (!this.data.visitors[visitorId]) {
      this.data.visitors[visitorId] = {
        id: visitorId,
        name: metadata.name || '',
        avatar: metadata.avatar || '',
        gender: metadata.gender || 'Prefer not to say',
        preference: metadata.preference || 'Everyone',
        dob: metadata.dob || null,
        age: metadata.age || null,
        age_verified: !!metadata.age_verified,
        terms_agreed: !!metadata.terms_agreed,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_online: true
      };
      this.save();
    }
    return this.data.visitors[visitorId];
  }

  updateVisitor(visitorId, updates) {
    if (this.data.visitors[visitorId]) {
      this.data.visitors[visitorId] = {
        ...this.data.visitors[visitorId],
        ...updates,
        last_active: new Date().toISOString()
      };
      this.save();
      return this.data.visitors[visitorId];
    }
    return null;
  }

  setVisitorPresence(visitorId, isOnline) {
    if (this.data.visitors[visitorId]) {
      this.data.visitors[visitorId].is_online = isOnline;
      this.data.visitors[visitorId].last_active = new Date().toISOString();
      this.save();
    }
  }

  // --- Conversations ---
  getConversationId(visitorId, personaId) {
    return `${visitorId}_${personaId}`;
  }

  getConversation(visitorId, personaId) {
    const convId = this.getConversationId(visitorId, personaId);
    if (!this.data.conversations[convId]) {
      const persona = this.getPersona(personaId);
      this.data.conversations[convId] = {
        id: convId,
        visitorId,
        personaId,
        personaName: persona ? persona.name : personaId,
        personaAvatar: persona ? persona.avatar_url : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: '',
        lastMessageAt: null,
        lastSender: null,
        unreadByOwner: 0,
        unreadByVisitor: 0,
        isBlocked: false
      };
      this.save();
    }
    return this.data.conversations[convId];
  }

  getConversationById(convId) {
    return this.data.conversations[convId] || null;
  }

  getConversationsForVisitor(visitorId) {
    return Object.values(this.data.conversations)
      .filter(c => c.visitorId === visitorId && !c.isBlocked)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getAllConversationsForOwner() {
    return Object.values(this.data.conversations)
      .map(c => {
        const visitor = this.data.visitors[c.visitorId] || { is_online: false, gender: 'Unknown' };
        const persona = this.data.personas[c.personaId] || { name: c.personaId };
        return {
          ...c,
          visitorOnline: visitor.is_online,
          visitorName: visitor.name || null,
          visitorAvatar: visitor.avatar || null,
          visitorGender: visitor.gender,
          visitorAge: visitor.age,
          visitorPhone: visitor.phone || null,
          personaName: persona.name,
          personaAvatar: persona.avatar_url,
          personaLocation: persona.location,
          personaPlace: persona.place,
          personaHandle: persona.handle,
          hasOfflineMessages: (c.offlineUnreadCount || 0) > 0,
          offlineUnreadCount: c.offlineUnreadCount || 0
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // --- Messages ---
  getMessages(conversationId) {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  addMessage({ conversationId, visitorId, personaId, sender, content, type = 'text', receivedWhileAdminOffline = false }) {
    let finalContent = typeof content === 'string' ? content.trim() : '';
    const isImage = type === 'image' || finalContent.startsWith('data:image/');
    const isVideo = type === 'video' || finalContent.startsWith('data:video/');
    let msgType = 'text';
    if (isImage) msgType = 'image';
    if (isVideo) msgType = 'video';

    // Reliably write base64 media to disk in uploads directory so it persists permanently
    if (finalContent.startsWith('data:image/') || finalContent.startsWith('data:video/')) {
      try {
        const match = finalContent.match(/^data:(image|video)\/([a-zA-Z0-9.+_-]+);base64,(.+)$/);
        if (match) {
          const mediaCat = match[1];
          let rawExt = match[2].toLowerCase();
          if (rawExt === 'jpeg') rawExt = 'jpg';
          if (rawExt === 'quicktime') rawExt = 'mov';
          const ext = rawExt.split('+')[0];
          const filename = `${mediaCat}_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
          const filepath = path.join(UPLOADS_DIR, filename);
          const buf = Buffer.from(match[3], 'base64');
          fs.writeFileSync(filepath, buf);
          finalContent = `/api/uploads/${filename}`;
        }
      } catch (err) {
        console.error('Failed to write media to disk, keeping raw data:', err.message);
      }
    }

    const message = {
      id: uuidv4(),
      conversationId,
      visitorId,
      personaId,
      sender,
      content: finalContent,
      type: msgType,
      createdAt: new Date().toISOString(),
      isRead: false,
      receivedWhileAdminOffline: !!receivedWhileAdminOffline
    };

    this.data.messages.push(message);

    const conv = this.data.conversations[conversationId];
    if (conv) {
      conv.updatedAt = message.createdAt;
      conv.lastMessage = isVideo ? '🎥 Video (View Once)' : isImage ? '📷 Photo' : message.content;
      conv.lastMessageAt = message.createdAt;
      conv.lastSender = sender;
      if (sender === 'visitor') {
        conv.unreadByOwner = (conv.unreadByOwner || 0) + 1;
        if (receivedWhileAdminOffline) {
          conv.offlineUnreadCount = (conv.offlineUnreadCount || 0) + 1;
        }
      } else {
        conv.unreadByVisitor = (conv.unreadByVisitor || 0) + 1;
      }
    }

    // Persist to offline queue array as well
    if (receivedWhileAdminOffline && sender === 'visitor') {
      if (!this.data.offlineInbox) {
        this.data.offlineInbox = [];
      }
      this.data.offlineInbox.unshift({
        id: message.id,
        conversationId,
        visitorId,
        personaId,
        content: message.content,
        type: msgType,
        createdAt: message.createdAt
      });
    }

    this.save();
    return message;
  }

  deleteMessage(messageId) {
    const idx = this.data.messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const removed = this.data.messages.splice(idx, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  addUnlockRequest({ visitorId, profileId, place }) {
    if (!this.data.unlockRequests) {
      this.data.unlockRequests = [];
    }
    const item = {
      id: uuidv4(),
      visitorId,
      profileId,
      place,
      createdAt: new Date().toISOString()
    };
    this.data.unlockRequests.push(item);
    this.save();
    return item;
  }

  markMessagesAsRead(conversationId, readerType) {
    let updated = false;
    this.data.messages.forEach(m => {
      if (m.conversationId === conversationId) {
        if (readerType === 'owner' && m.sender === 'visitor' && !m.isRead) {
          m.isRead = true;
          updated = true;
        } else if (readerType === 'visitor' && m.sender === 'owner' && !m.isRead) {
          m.isRead = true;
          updated = true;
        }
      }
    });

    const conv = this.data.conversations[conversationId];
    if (conv) {
      if (readerType === 'owner') {
        conv.unreadByOwner = 0;
        conv.offlineUnreadCount = 0;
      }
      if (readerType === 'visitor') conv.unreadByVisitor = 0;
      updated = true;
    }

    if (updated) this.save();
  }

  // --- Favorites ---
  toggleFavorite(visitorId, personaId) {
    if (!this.data.favorites[visitorId]) {
      this.data.favorites[visitorId] = [];
    }
    const idx = this.data.favorites[visitorId].indexOf(personaId);
    let isFavorite = false;
    if (idx >= 0) {
      this.data.favorites[visitorId].splice(idx, 1);
      isFavorite = false;
    } else {
      this.data.favorites[visitorId].push(personaId);
      isFavorite = true;
    }
    this.save();
    return { isFavorite, favorites: this.data.favorites[visitorId] };
  }

  getFavorites(visitorId) {
    return this.data.favorites[visitorId] || [];
  }

  // --- Reports & Blocks ---
  addReport({ visitorId, personaId, reason, details }) {
    const report = {
      id: uuidv4(),
      visitorId,
      personaId,
      reason,
      details,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.data.reports.push(report);
    this.save();
    return report;
  }

  blockPersona(visitorId, personaId) {
    if (!this.data.blocks[visitorId]) {
      this.data.blocks[visitorId] = [];
    }
    if (!this.data.blocks[visitorId].includes(personaId)) {
      this.data.blocks[visitorId].push(personaId);
    }
    const convId = this.getConversationId(visitorId, personaId);
    if (this.data.conversations[convId]) {
      this.data.conversations[convId].isBlocked = true;
    }
    this.save();
    return { blocked: true, blocks: this.data.blocks[visitorId] };
  }

  isBlocked(visitorId, personaId) {
    return (this.data.blocks[visitorId] || []).includes(personaId);
  }

  // --- Owner Settings & Custom Replies ---
  getOwnerSettings() {
    return this.data.owner;
  }

  updateOwnerSettings(updates) {
    this.data.owner = { ...this.data.owner, ...updates };
    this.save();
    return this.data.owner;
  }

  getReplies() {
    if (!Array.isArray(this.data.owner.replies)) {
      this.data.owner.replies = [];
    }
    return this.data.owner.replies.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }

  addReply(text) {
    if (!text || !text.trim()) {
      throw new Error('Reply text cannot be empty');
    }
    const replies = this.getReplies();
    if (replies.length >= 10) {
      throw new Error('Maximum 10 replies allowed');
    }
    const newReply = {
      id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: text.trim(),
      sequence: replies.length + 1,
      enabled: true
    };
    replies.push(newReply);
    this.data.owner.replies = replies;
    this.data.owner.autoReplySequence = replies.map(r => r.text);
    this.save();
    return newReply;
  }

  updateReply(id, text) {
    if (!text || !text.trim()) {
      throw new Error('Reply text cannot be empty');
    }
    const replies = this.getReplies();
    const item = replies.find(r => r.id === id);
    if (!item) {
      throw new Error('Reply not found');
    }
    item.text = text.trim();
    this.data.owner.replies = replies;
    this.data.owner.autoReplySequence = replies.map(r => r.text);
    this.save();
    return item;
  }

  deleteReply(id) {
    let replies = this.getReplies();
    const exists = replies.some(r => r.id === id);
    if (!exists) return false;
    replies = replies.filter(r => r.id !== id);
    replies.forEach((r, idx) => {
      r.sequence = idx + 1;
    });
    this.data.owner.replies = replies;
    this.data.owner.autoReplySequence = replies.map(r => r.text);
    this.save();
    return true;
  }

  validateOwnerCredentials(username, password) {
    return (
      username === (this.data.owner.username || 'owner') &&
      password === (this.data.owner.password || 'secretcrush2026')
    );
  }
}

export const db = new Database();
