-- Secret Crush Database Schema (PostgreSQL / Supabase compatible)
-- Owner-Centric Link-Based Dating & Flirting Chat Website

-- 1. Visitors / Guest Sessions
CREATE TABLE IF NOT EXISTS visitors (
    id VARCHAR(64) PRIMARY KEY,
    gender VARCHAR(32) DEFAULT 'Prefer not to say',
    preference VARCHAR(32) DEFAULT 'Everyone',
    dob DATE,
    age INT,
    age_verified BOOLEAN DEFAULT FALSE,
    terms_agreed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE
);

-- 2. Demonstration Virtual Personas
CREATE TABLE IF NOT EXISTS personas (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(32) NOT NULL,
    location VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    bio TEXT,
    avatar_url TEXT NOT NULL,
    is_online BOOLEAN DEFAULT TRUE,
    last_seen VARCHAR(64) DEFAULT 'Just now',
    interests TEXT[],
    is_virtual_demo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Conversations (Unique per Visitor + Persona pairing)
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(128) PRIMARY KEY, -- Format: {visitor_id}_{persona_id}
    visitor_id VARCHAR(64) NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    persona_id VARCHAR(64) NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_sender VARCHAR(32), -- 'visitor' or 'owner'
    unread_by_owner INT DEFAULT 0,
    unread_by_visitor INT DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE
);

-- 4. Messages (Delivered to Central Website Owner)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(128) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64) NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    persona_id VARCHAR(64) NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL, -- 'visitor' or 'owner'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- 5. User Favorites
CREATE TABLE IF NOT EXISTS favorites (
    visitor_id VARCHAR(64) NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    persona_id VARCHAR(64) NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (visitor_id, persona_id)
);

-- 6. Safety Reports & Moderation
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    persona_id VARCHAR(64),
    reason VARCHAR(128) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'pending'
);

-- 7. Blocked Personas / Users
CREATE TABLE IF NOT EXISTS blocks (
    id VARCHAR(64) PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    persona_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(visitor_id, persona_id)
);

-- 8. Owner Credentials / Session Audit
CREATE TABLE IF NOT EXISTS owner_accounts (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) DEFAULT 'Site Owner & Concierge',
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona ON conversations(persona_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at ASC);
