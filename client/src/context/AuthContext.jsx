import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function getOrCreateVisitorId() {
  let id = localStorage.getItem('sc_visitor_id');
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('sc_visitor_id', id);
  }
  return id;
}

export function AuthProvider({ children }) {
  const [visitorId] = useState(getOrCreateVisitorId);
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('sc_visitor_name') || '');
  const [visitorAvatar, setVisitorAvatar] = useState(() => localStorage.getItem('sc_visitor_avatar') || '');
  const [gender, setGender] = useState(() => localStorage.getItem('sc_gender') || '');
  const [preference, setPreference] = useState(() => localStorage.getItem('sc_preference') || 'Everyone');
  const [isAgeVerified, setIsAgeVerified] = useState(() => localStorage.getItem('sc_age_verified') === 'true');
  const [userAge, setUserAge] = useState(() => Number(localStorage.getItem('sc_user_age')) || null);
  const [visitorPhone, setVisitorPhone] = useState(() => localStorage.getItem('sc_visitor_phone') || '');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const isProfileComplete = Boolean(visitorName && gender && visitorAvatar && isAgeVerified);

  // Owner state
  const [ownerToken, setOwnerToken] = useState(() => localStorage.getItem('sc_owner_token') || '');
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(() => !!localStorage.getItem('sc_owner_token'));

  // Sync visitor with server on mount
  useEffect(() => {
    if (visitorId) {
      fetch('/api/visitors/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, gender, preference })
      }).catch(err => console.log('Init sync (demo mode):', err.message));
    }
  }, [visitorId]);

  const updatePreferences = (newGender, newPref) => {
    setGender(newGender);
    setPreference(newPref);
    localStorage.setItem('sc_gender', newGender);
    localStorage.setItem('sc_preference', newPref);

    fetch('/api/visitors/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, gender: newGender, preference: newPref })
    }).catch(err => console.log('Pref update error:', err.message));
  };

  const verifyAge = async (dob, confirmAge, agreeTerms) => {
    try {
      const res = await fetch('/api/visitors/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, dob, confirmAge, agreeTerms })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setIsAgeVerified(true);
      setUserAge(data.age);
      localStorage.setItem('sc_age_verified', 'true');
      localStorage.setItem('sc_user_age', String(data.age));
      return { success: true, age: data.age };
    } catch (err) {
      // Offline fallback calculation
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      if (calculatedAge < 20) {
        throw new Error('Age verification failed. You must be at least 20 years old to enter Secret Crush.');
      }
      if (!confirmAge || !agreeTerms) {
        throw new Error('You must confirm both required declarations to proceed.');
      }

      setIsAgeVerified(true);
      setUserAge(calculatedAge);
      localStorage.setItem('sc_age_verified', 'true');
      localStorage.setItem('sc_user_age', String(calculatedAge));
      return { success: true, age: calculatedAge };
    }
  };

  const toggleFavorite = async (personaId) => {
    const isFav = favorites.includes(personaId);
    const updated = isFav ? favorites.filter(id => id !== personaId) : [...favorites, personaId];
    setFavorites(updated);
    localStorage.setItem('sc_favorites', JSON.stringify(updated));

    try {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, personaId })
      });
    } catch (e) {
      // Keep local state
    }
  };

  const loginOwner = async (username, password) => {
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }
    setOwnerToken(data.token);
    setIsOwnerLoggedIn(true);
    localStorage.setItem('sc_owner_token', data.token);
    return data;
  };

  const loginWithPhone = async (phone) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    setVisitorPhone(clean);
    localStorage.setItem('sc_visitor_phone', clean);

    try {
      await fetch('/api/visitors/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, phone: clean })
      });
    } catch (e) {
      console.log('Phone record offline sync');
    }
    return { success: true, phone: clean };
  };

  const saveVisitorProfile = async ({ name, gender: newGender, preference: newPref, avatar }) => {
    if (name) {
      setVisitorName(name);
      localStorage.setItem('sc_visitor_name', name);
    }
    if (newGender) {
      setGender(newGender);
      localStorage.setItem('sc_gender', newGender);
    }
    if (newPref) {
      setPreference(newPref);
      localStorage.setItem('sc_preference', newPref);
    }
    if (avatar) {
      setVisitorAvatar(avatar);
      localStorage.setItem('sc_visitor_avatar', avatar);
    }

    // Mark age verified for adult status
    setIsAgeVerified(true);
    localStorage.setItem('sc_age_verified', 'true');

    try {
      await fetch('/api/visitors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          name: name || visitorName,
          gender: newGender || gender,
          preference: newPref || preference,
          avatar: avatar || visitorAvatar
        })
      });
    } catch (e) {
      console.log('Profile sync offline');
    }
  };

  const logoutOwner = () => {
    setOwnerToken('');
    setIsOwnerLoggedIn(false);
    localStorage.removeItem('sc_owner_token');
  };

  return (
    <AuthContext.Provider
      value={{
        visitorId,
        visitorName,
        visitorAvatar,
        isProfileComplete,
        saveVisitorProfile,
        gender,
        preference,
        isAgeVerified,
        userAge,
        visitorPhone,
        loginWithPhone,
        favorites,
        ownerToken,
        isOwnerLoggedIn,
        updatePreferences,
        verifyAge,
        toggleFavorite,
        loginOwner,
        logoutOwner
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
