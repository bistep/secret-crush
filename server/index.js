import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { setupSocket } from './socket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS for development frontend
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

// --- REST API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Secret Crush' });
});

// 2. Profiles (Demonstration Personas)
app.get('/api/profiles', (req, res) => {
  const personas = db.getPersonas();
  res.json(personas);
});

app.get('/api/profiles/:id', (req, res) => {
  const persona = db.getPersona(req.params.id);
  if (!persona) return res.status(404).json({ error: 'Profile not found' });
  res.json(persona);
});

// 3. Visitor Session & Preferences
app.post('/api/visitors/init', (req, res) => {
  const { visitorId, gender, preference } = req.body;
  if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
  const visitor = db.getOrCreateVisitor(visitorId, { gender, preference });
  res.json(visitor);
});

// 4. Age Verification & Terms (Strict 20+ requirement)
app.post('/api/visitors/verify-age', (req, res) => {
  const { visitorId, dob, confirmAge, agreeTerms } = req.body;
  if (!visitorId || !dob) {
    return res.status(400).json({ error: 'Date of birth and visitor ID are required' });
  }

  // Calculate age accurately
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 20) {
    return res.status(403).json({
      error: 'Age verification failed. You must be at least 20 years old to use Secret Crush.',
      age
    });
  }

  if (!confirmAge || !agreeTerms) {
    return res.status(400).json({ error: 'You must confirm your age and accept terms to proceed.' });
  }

  const updated = db.updateVisitor(visitorId, {
    dob,
    age,
    age_verified: true,
    terms_agreed: true
  });

  res.json({ success: true, visitor: updated, age });
});

// 4b. Record Visitor Phone Number (Mandatory 10 digits)
app.post('/api/visitors/phone', (req, res) => {
  const { visitorId, phone } = req.body;
  if (!visitorId || !phone) {
    return res.status(400).json({ error: 'visitorId and phone are required' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
  }

  const updated = db.updateVisitor(visitorId, { phone: cleanPhone });
  io.to('room:owner').emit('visitor:phone_updated', {
    visitorId,
    phone: cleanPhone,
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, visitor: updated });
});

// 5. Update Visitor Preferences
app.post('/api/visitors/preferences', (req, res) => {
  const { visitorId, gender, preference } = req.body;
  if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
  const updated = db.updateVisitor(visitorId, { gender, preference });
  res.json(updated);
});

// 5b. Update Visitor Profile (Name, Gender, Preference, Avatar)
app.post('/api/visitors/profile', (req, res) => {
  const { visitorId, name, gender, preference, avatar } = req.body;
  if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
  const updated = db.updateVisitor(visitorId, { name, gender, preference, avatar });
  io.to('room:owner').emit('visitor:profile_updated', {
    visitorId,
    name,
    gender,
    preference,
    avatar,
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, visitor: updated });
});

// 6. Favorites
app.post('/api/favorites/toggle', (req, res) => {
  const { visitorId, personaId } = req.body;
  if (!visitorId || !personaId) return res.status(400).json({ error: 'Missing parameters' });
  const result = db.toggleFavorite(visitorId, personaId);
  res.json(result);
});

app.get('/api/favorites/:visitorId', (req, res) => {
  const favs = db.getFavorites(req.params.visitorId);
  res.json(favs);
});

// 7. Conversations for Visitor ("Chats with Me")
app.get('/api/conversations/visitor/:visitorId', (req, res) => {
  const list = db.getConversationsForVisitor(req.params.visitorId);
  // Attach persona details
  const enriched = list.map(c => {
    const persona = db.getPersona(c.personaId);
    return {
      ...c,
      personaName: persona ? persona.name : c.personaId,
      personaAvatar: persona ? persona.avatar_url : '',
      personaAge: persona ? persona.age : null,
      personaOnline: persona ? persona.is_online : false,
      personaLastSeen: persona ? persona.last_seen : ''
    };
  });
  res.json(enriched);
});

// 8. Individual Conversation History
app.get('/api/conversations/:visitorId/:personaId', (req, res) => {
  const { visitorId, personaId } = req.params;
  const persona = db.getPersona(personaId);
  if (!persona) return res.status(404).json({ error: 'Persona not found' });

  const conv = db.getConversation(visitorId, personaId);
  const messages = db.getMessages(conv.id);
  db.markMessagesAsRead(conv.id, 'visitor');

  res.json({
    conversation: conv,
    persona,
    messages
  });
});

// 9. Send Message REST Fallback
app.post('/api/messages', (req, res) => {
  const { visitorId, personaId, content } = req.body;
  if (!visitorId || !personaId || !content?.trim()) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (db.isBlocked(visitorId, personaId)) {
    return res.status(403).json({ error: 'This conversation has been blocked' });
  }

  const conv = db.getConversation(visitorId, personaId);
  const message = db.addMessage({
    conversationId: conv.id,
    visitorId,
    personaId,
    sender: 'visitor',
    content
  });

  // Notify owner room via socket
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

  res.json(message);
});

// 10. Reports & Blocks
app.post('/api/reports', (req, res) => {
  const { visitorId, personaId, reason, details } = req.body;
  if (!visitorId || !reason) {
    return res.status(400).json({ error: 'Missing report parameters' });
  }
  const report = db.addReport({ visitorId, personaId, reason, details });
  res.json({ success: true, report });
});

app.post('/api/blocks', (req, res) => {
  const { visitorId, personaId } = req.body;
  if (!visitorId || !personaId) {
    return res.status(400).json({ error: 'Missing block parameters' });
  }
  const result = db.blockPersona(visitorId, personaId);
  res.json(result);
});

// ==========================================
// CRITICAL OWNER DASHBOARD & INBOX ENDPOINTS
// ==========================================

// Owner Auth Check Middleware / Login
app.post('/api/owner/login', (req, res) => {
  const { username, password } = req.body;
  const isValid = db.validateOwnerCredentials(username, password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid owner username or passcode' });
  }
  const settings = db.getOwnerSettings();
  res.json({
    success: true,
    token: settings.password,
    displayName: settings.displayName,
    autoReplyEnabled: settings.autoReplyEnabled
  });
});

// Get all incoming visitor conversations
app.get('/api/owner/conversations', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.token;
  const settings = db.getOwnerSettings();
  if (token !== settings.password && token !== 'secretcrush2026') {
    return res.status(401).json({ error: 'Unauthorized owner access' });
  }

  const conversations = db.getAllConversationsForOwner();
  res.json(conversations);
});

// Get specific conversation messages for owner
app.get('/api/owner/conversation/:convId', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.token;
  const settings = db.getOwnerSettings();
  if (token !== settings.password && token !== 'secretcrush2026') {
    return res.status(401).json({ error: 'Unauthorized owner access' });
  }

  const conv = db.getConversationById(req.params.convId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = db.getMessages(conv.id);
  db.markMessagesAsRead(conv.id, 'owner');

  const persona = db.getPersona(conv.personaId);
  const visitor = db.getOrCreateVisitor(conv.visitorId);

  res.json({
    conversation: conv,
    persona,
    visitor,
    messages
  });
});

// Owner sends reply to visitor
app.post('/api/owner/reply', (req, res) => {
  const token = req.headers['x-owner-token'] || req.body.token;
  const settings = db.getOwnerSettings();
  if (token !== settings.password && token !== 'secretcrush2026') {
    return res.status(401).json({ error: 'Unauthorized owner access' });
  }

  const { conversationId, content } = req.body;
  if (!conversationId || !content?.trim()) {
    return res.status(400).json({ error: 'Missing reply parameters' });
  }

  const conv = db.getConversationById(conversationId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const message = db.addMessage({
    conversationId: conv.id,
    visitorId: conv.visitorId,
    personaId: conv.personaId,
    sender: 'owner',
    content
  });

  // Emit to socket rooms
  io.to(`conv:${conv.id}`).emit('message:new', message);
  io.to(`room:visitor:${conv.visitorId}`).emit('conversation:updated', {
    conversationId: conv.id,
    lastMessage: content,
    lastSender: 'owner',
    updatedAt: message.createdAt
  });
  io.to('room:owner').emit('owner:reply_sent', { message, isAutoReply: false });

  res.json({ success: true, message });
});

// Owner dashboard settings (toggle auto-reply, etc.)
app.post('/api/owner/settings', (req, res) => {
  const token = req.headers['x-owner-token'] || req.body.token;
  const settings = db.getOwnerSettings();
  if (token !== settings.password && token !== 'secretcrush2026') {
    return res.status(401).json({ error: 'Unauthorized owner access' });
  }

  const updated = db.updateOwnerSettings(req.body);
  res.json(updated);
});

// Owner dashboard overview stats
app.get('/api/owner/stats', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.token;
  const settings = db.getOwnerSettings();
  if (token !== settings.password && token !== 'secretcrush2026') {
    return res.status(401).json({ error: 'Unauthorized owner access' });
  }

  const allConv = db.getAllConversationsForOwner();
  const unreadCount = allConv.reduce((acc, c) => acc + (c.unreadByOwner || 0), 0);
  const onlineVisitors = Object.values(db.data.visitors).filter(v => v.is_online).length;
  const totalMessages = db.data.messages.length;

  res.json({
    totalConversations: allConv.length,
    unreadCount,
    onlineVisitors,
    totalMessages,
    autoReplyEnabled: settings.autoReplyEnabled
  });
});

// Serve frontend in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🔥 Secret Crush Backend & WebSocket Server Running!`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`💌 Central Owner Inbox Route: http://localhost:${PORT}/owner/inbox`);
  console.log(`👑 Default Owner Credentials: owner / secretcrush2026`);
  console.log(`=======================================================`);
});
