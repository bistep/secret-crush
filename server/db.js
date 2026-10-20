import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 18 Curated Distinct Profiles
const INITIAL_PERSONAS = [
  {
    id: 'manuel',
    name: 'Manuel',
    age: 25,
    gender: 'Male',
    location: 'Fort Kochi, Kerala',
    tagline: 'Lover of coastal sunsets, old jazz, and spontaneous chai runs.',
    bio: 'Software engineer by day, acoustic guitarist and amateur surfer by dusk. Looking for someone who enjoys meaningful late-night conversations and good food by the beach.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Surfing', 'Acoustic Guitar', 'Filter Coffee', 'Coastal Sunsets', 'Indie Folk'],
    is_virtual_demo: true
  },
  {
    id: 'arjun',
    name: 'Arjun',
    age: 27,
    gender: 'Male',
    location: 'Indiranagar, Bangalore',
    tagline: 'Calisthenics coach, tech enthusiast, and weekend trekker.',
    bio: 'Balancing fitness routines with craft brewery visits. Passionate about health, travel photography, and honest connections.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Fitness', 'Trekking', 'Craft Beer', 'Photography', 'Podcasts'],
    is_virtual_demo: true
  },
  {
    id: 'adithyan',
    name: 'Adithyan',
    age: 24,
    gender: 'Male',
    location: 'Trivandrum, Kerala',
    tagline: 'Cinematographer capturing quiet emotions and rainy streets.',
    bio: 'Visual storyteller fascinated by Malayalam cinema, film photography, and retro records. Let’s talk about our favorite films over tea.',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 12 mins ago',
    interests: ['Cinematography', 'Film Stills', 'Rainy Days', 'Vintage Cameras'],
    is_virtual_demo: true
  },
  {
    id: 'amal',
    name: 'Amal',
    age: 26,
    gender: 'Male',
    location: 'Calicut, Kerala',
    tagline: 'Specialty cafe owner & foodie at heart.',
    bio: 'I run a cozy specialty brew cafe in Kozhikode. I believe the best conversations happen over freshly roasted beans and warm pastries.',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Coffee Brewing', 'Baking', 'Coastal Drives', 'Art Exhibitions'],
    is_virtual_demo: true
  },
  {
    id: 'nikhil',
    name: 'Nikhil',
    age: 28,
    gender: 'Male',
    location: 'Bandra, Mumbai',
    tagline: 'Product Designer who notices all the tiny details.',
    bio: 'Obsessed with great UI, street tacos, and weekend vinyl hunting. Looking for banter, wit, and someone who appreciates good design.',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 45 mins ago',
    interests: ['Design', 'Vinyl Records', 'Modern Art', 'Standup Comedy'],
    is_virtual_demo: true
  },
  {
    id: 'rahul',
    name: 'Rahul',
    age: 29,
    gender: 'Male',
    location: 'Kochi, Kerala',
    tagline: 'Commercial pilot chasing clouds and new horizons.',
    bio: 'Seen 30 countries and counting, but there is no place like home backwaters. Searching for a co-pilot for spontaneous weekend getaways.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Aviation', 'Scuba Diving', 'Travel', 'Fine Dining'],
    is_virtual_demo: true
  },
  {
    id: 'kevin',
    name: 'Kevin',
    age: 23,
    gender: 'Male',
    location: 'Anjuna, Goa',
    tagline: 'Electronic music producer & sunset devotee.',
    bio: 'Making lo-fi beats in my beachside studio. Friendly, relaxed vibes, passionate about sound design and sea breezes.',
    avatar_url: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 2 hours ago',
    interests: ['Music Production', 'Synthesizers', 'Skateboarding', 'Beach Sunsets'],
    is_virtual_demo: true
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    age: 26,
    gender: 'Male',
    location: 'Wayanad, Kerala',
    tagline: 'Wildlife conservationist living amidst misty hills.',
    bio: 'I spend my days tracking hornbills and reading natural history. Calm, grounded, and loves making bonfire dinners under starry skies.',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Wildlife Tracking', 'Birdwatching', 'Campfires', 'Acoustic Rock'],
    is_virtual_demo: true
  },
  {
    id: 'akhil',
    name: 'Akhil',
    age: 25,
    gender: 'Male',
    location: 'Koramangala, Bangalore',
    tagline: 'Fintech builder by week, midnight motorcycle cruiser by weekend.',
    bio: 'High energy, curious mind, always up for a road trip or an intense trivia night. Tell me your favorite conspiracy theory.',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 1 hour ago',
    interests: ['Motorcycling', 'Trivia Nights', 'Podcasts', 'Late Night Drives'],
    is_virtual_demo: true
  },
  {
    id: 'rohan',
    name: 'Rohan',
    age: 31,
    gender: 'Male',
    location: 'Nungambakkam, Chennai',
    tagline: 'Architectural restorer with a soft spot for sourdough.',
    bio: 'Restoring colonial heritage homes and perfecting the art of French pastry. Looking for someone with genuine warmth and curiosity.',
    avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Heritage Architecture', 'Cooking', 'Museums', 'Book Collecting'],
    is_virtual_demo: true
  },
  {
    id: 'meera',
    name: 'Meera',
    age: 24,
    gender: 'Female',
    location: 'Panampilly Nagar, Kochi',
    tagline: 'UI designer by day, classical Mohiniyattam dancer by heart.',
    bio: 'Expressive eyes and an infectious laugh. I love quaint rooftop cafes, thrifted sarees, and deeply emotional Malayalam indie tracks.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Classical Dance', 'Design', 'Rooftop Cafes', 'Indie Music', 'Poetry'],
    is_virtual_demo: true
  },
  {
    id: 'anjali',
    name: 'Anjali',
    age: 26,
    gender: 'Female',
    location: 'Lavelle Road, Bangalore',
    tagline: 'Landscape architect & proud plant mom.',
    bio: 'Surrounded by ferns and good books. I love curating vibrant green spaces, cycling through leafy boulevards, and sharing warm tea.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Urban Gardening', 'Biking', 'Botanical Art', 'Matcha Lattes'],
    is_virtual_demo: true
  },
  {
    id: 'devika',
    name: 'Devika',
    age: 25,
    gender: 'Female',
    location: 'Colaba, Mumbai',
    tagline: 'Stylist & creative director living in bold color palettes.',
    bio: 'Spontaneous, vibrant, and always planning the next art trip. Tell me your top 3 favorite songs right now!',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 25 mins ago',
    interests: ['Fashion Styling', 'Art Galleries', 'Road Trips', 'Live Gigs'],
    is_virtual_demo: true
  },
  {
    id: 'diya',
    name: 'Diya',
    age: 22,
    gender: 'Female',
    location: 'Kowdiar, Trivandrum',
    tagline: 'Literature grad with a love for handwritten letters.',
    bio: 'Collecting vintage poetry collections and drinking endless cups of chamomile tea. Looking for sweet banter and meaningful soul-talks.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Poetry', 'Vintage Books', 'Stationery', 'Late Night Walks'],
    is_virtual_demo: true
  },
  {
    id: 'neha',
    name: 'Neha',
    age: 27,
    gender: 'Female',
    location: 'Jubilee Hills, Hyderabad',
    tagline: 'Brand strategist, amateur potter, and karaoke superstar.',
    bio: 'Can make you laugh until your stomach hurts. Looking for someone with high emotional intelligence and an appetite for good biryani.',
    avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 3 hours ago',
    interests: ['Pottery', 'Karaoke', 'Food Walks', 'Board Games'],
    is_virtual_demo: true
  },
  {
    id: 'athira',
    name: 'Athira',
    age: 28,
    gender: 'Female',
    location: 'Thrissur, Kerala',
    tagline: 'Pediatrician with a heart full of empathy and silly jokes.',
    bio: 'When I am not in hospital scrubs, I am trying new curry recipes or reading detective fiction. Life is too short for dull conversations.',
    avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Medicine', 'Cooking', 'Thrillers', 'Classical Carnatic'],
    is_virtual_demo: true
  },
  {
    id: 'kiran',
    name: 'Kiran',
    age: 26,
    gender: 'Non-binary',
    location: 'Marine Drive, Kochi',
    tagline: 'Stand-up comedian & podcasts creator.',
    bio: 'Breaking binaries and telling funny stories about dating dilemmas. Looking for good vibes, bright sparks, and unapologetic self-expression.',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
    is_online: true,
    last_seen: 'Online now',
    interests: ['Standup Comedy', 'Podcasting', 'Queer Culture', 'Street Food'],
    is_virtual_demo: true
  },
  {
    id: 'hannah',
    name: 'Hannah',
    age: 25,
    gender: 'Female',
    location: 'North Cliff, Varkala',
    tagline: 'Vinyasa yoga coach and cliff-side sunset chaser.',
    bio: 'Sun-kissed, free-spirited, and living by the tide. Love sound healing, ocean swims, and honest laughter. Vibe check first!',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    is_online: false,
    last_seen: 'Last seen 15 mins ago',
    interests: ['Yoga', 'Ocean Swims', 'Aromatherapy', 'Acoustic Guitar'],
    is_virtual_demo: true
  }
];

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
        autoReplyDelaySec: 3
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
      // Ensure all initial personas exist
      INITIAL_PERSONAS.forEach(p => {
        if (!this.data.personas[p.id]) {
          this.data.personas[p.id] = p;
        }
      });
      this.save();
    } catch (err) {
      console.error('Error loading DB, using fallback defaults:', err.message);
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
  // Keyed uniquely by `${visitorId}_${personaId}`
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
          visitorGender: visitor.gender,
          visitorAge: visitor.age,
          personaName: persona.name,
          personaAvatar: persona.avatar_url,
          personaLocation: persona.location
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // --- Messages ---
  getMessages(conversationId) {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  addMessage({ conversationId, visitorId, personaId, sender, content, type = 'text' }) {
    const isImage = type === 'image' || (typeof content === 'string' && content.startsWith('data:image/'));
    const message = {
      id: uuidv4(),
      conversationId,
      visitorId,
      personaId,
      sender, // 'visitor' or 'owner'
      content: content.trim(),
      type: isImage ? 'image' : 'text',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    this.data.messages.push(message);

    // Update conversation record
    const conv = this.data.conversations[conversationId];
    if (conv) {
      conv.updatedAt = message.createdAt;
      conv.lastMessage = isImage ? '📷 Photo' : message.content;
      conv.lastMessageAt = message.createdAt;
      conv.lastSender = sender;
      if (sender === 'visitor') {
        conv.unreadByOwner = (conv.unreadByOwner || 0) + 1;
      } else {
        conv.unreadByVisitor = (conv.unreadByVisitor || 0) + 1;
      }
    }

    this.save();
    return message;
  }

  markMessagesAsRead(conversationId, readerType) { // readerType: 'owner' or 'visitor'
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
      if (readerType === 'owner') conv.unreadByOwner = 0;
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

  // --- Owner Settings ---
  getOwnerSettings() {
    return this.data.owner;
  }

  updateOwnerSettings(updates) {
    this.data.owner = { ...this.data.owner, ...updates };
    this.save();
    return this.data.owner;
  }

  validateOwnerCredentials(username, password) {
    return (
      username === (this.data.owner.username || 'owner') &&
      password === (this.data.owner.password || 'secretcrush2026')
    );
  }
}

export const db = new Database();
