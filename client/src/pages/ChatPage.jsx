import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Smile, Camera, Image as ImageIcon, ShieldAlert, CheckCheck, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { DEMO_PROFILES } from '../data/profiles';
import ReportModal from '../components/ReportModal';
import PhoneLoginModal from '../components/PhoneLoginModal';

const QUICK_FLIRTS = [
  "Hey, how's your evening going? 😊",
  "Pretty good! What about you?",
  "You seem really interesting! ✨",
  "What are you up to tonight? ❤️",
  "Your smile caught my eye immediately 😍",
  "Tell me your idea of a perfect weekend getaway 🌊"
];

const EMOJI_LIST = ['😊', '❤️', '✨', '😍', '🔥', '😘', '😉', '🥰', '🥂', '🌹', '💬', '☕'];

export default function ChatPage() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const cleanPersonaId = (personaId || '').replace(/^@/, '');
  const { visitorId, visitorPhone } = useAuth();
  const { socket, sendMessage, playSoundAlert } = useSocket();

  const [persona, setPersona] = useState(() => {
    return DEMO_PROFILES.find(p => p.id === cleanPersonaId || p.id === personaId || p.handle === `@${cleanPersonaId}` || p.handle === personaId) || null;
  });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPhoneLoginModal, setShowPhoneLoginModal] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Camera & Image Sharing State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch initial profile & conversation history
  useEffect(() => {
    if (!personaId || !visitorId) return;

    fetch(`/api/conversations/${visitorId}/${personaId}`)
      .then(res => res.json())
      .then(data => {
        if (data.persona) setPersona(data.persona);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {
        const found = DEMO_PROFILES.find(p => p.id === personaId);
        if (found) {
          setPersona(found);
          setMessages([
            {
              id: 'starter_1',
              sender: 'owner',
              content: `Hey! Thanks for stopping by my profile 😊 How's your evening going?`,
              createdAt: new Date().toISOString()
            }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [personaId, visitorId]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket || !personaId) return;

    socket.emit('visitor:join', { visitorId, personaId });

    const handleNewMessage = (msg) => {
      if (msg.personaId === personaId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender === 'owner') {
          playSoundAlert();
        }
      }
    };

    const handleTypingStatus = (data) => {
      if (data.personaId === personaId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('persona:typing_status', handleTypingStatus);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('persona:typing_status', handleTypingStatus);
    };
  }, [socket, personaId, visitorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Send Text Message
  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);

    const tempMsg = {
      id: 'temp_' + Date.now(),
      conversationId: `${visitorId}_${personaId}`,
      visitorId,
      personaId,
      sender: 'visitor',
      content,
      type: 'text',
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    sendMessage(personaId, content, 'text');

    // Prompt for phone login after 1-2 chats if not logged in
    const nextCount = sentCount + 1;
    setSentCount(nextCount);
    if (nextCount >= 2 && !visitorPhone) {
      setTimeout(() => setShowPhoneLoginModal(true), 600);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Image File Upload (Gallery)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result;
      if (typeof base64Image === 'string') {
        const tempMsg = {
          id: 'temp_' + Date.now(),
          conversationId: `${visitorId}_${personaId}`,
          visitorId,
          personaId,
          sender: 'visitor',
          content: base64Image,
          type: 'image',
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, tempMsg]);
        sendMessage(personaId, base64Image, 'image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset file input
  };

  // Open Live Camera
  const openCamera = async () => {
    setCapturedImage(null);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access camera. Please allow camera permissions in your browser.');
      setShowCameraModal(false);
    }
  };

  // Take Snapshot from video
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Stop stream after capture
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  // Send Captured Camera Image
  const sendCapturedImage = () => {
    if (!capturedImage) return;

    const tempMsg = {
      id: 'temp_' + Date.now(),
      conversationId: `${visitorId}_${personaId}`,
      visitorId,
      personaId,
      sender: 'visitor',
      content: capturedImage,
      type: 'image',
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    sendMessage(personaId, capturedImage, 'image');

    closeCameraModal();
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCapturedImage(null);
    setShowCameraModal(false);
  };

  const handleQuickSend = (text) => {
    setInputText(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!persona && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0812] text-white">
        <div className="text-center space-y-3">
          <p className="text-slate-400">Profile not found.</p>
          <Link to="/" className="text-pink-400 hover:underline text-sm">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0812] text-white pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#100C1D]/95 border-b border-purple-900/40 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Persona Avatar & Details (Header) */}
          {persona && (
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-pink-500/30 bg-purple-950/40 p-1 flex items-center justify-center">
                <img
                  src={persona.avatar_url}
                  alt={persona.name}
                  className="w-full h-full object-contain"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#100C1D] ${
                    persona.is_online ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm sm:text-base text-white">
                    {persona.name}, <span className="font-normal text-pink-300">{persona.age}</span>
                  </h1>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-semibold ${
                    persona.gender === 'Female'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  }`}>
                    {persona.gender}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-pink-400 font-semibold">{persona.handle || `@${persona.id}`}</span>
                  <span>•</span>
                  <span>{persona.place || persona.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {!visitorPhone ? (
            <button
              onClick={() => setShowPhoneLoginModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition-all flex items-center gap-1"
              title="Login with your mobile number"
            >
              <span>Login</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>+91 {visitorPhone}</span>
            </div>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors text-xs flex items-center gap-1.5"
            title="Report or Block"
          >
            <ShieldAlert className="w-4 h-4 text-slate-400 hover:text-rose-400" />
            <span className="hidden sm:inline">Report / Block</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {/* Persona intro card (5 things only: Name, Age, Place, Gender, ID for redirecting) */}
        {persona && (
          <div className="text-center py-6 px-4 bg-gradient-to-b from-[#18112C] to-[#100C1D] border border-pink-500/25 rounded-3xl max-w-sm mx-auto space-y-3 mb-6 shadow-xl">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-pink-500/40 shadow-lg shadow-pink-500/20 bg-purple-950/40 p-2 flex items-center justify-center">
              <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                {persona.name}, <span className="font-normal text-pink-300">{persona.age}</span>
              </h3>
              {/* ID for redirecting - shown right below profile as requested */}
              <div className="text-sm font-semibold font-mono text-pink-400 mt-0.5">
                {persona.handle || `@${persona.id}`}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pt-1">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-medium">
                📍 {persona.place || persona.location}
              </span>
              <span className={`px-3 py-1 rounded-full border font-semibold ${
                persona.gender === 'Female'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
              }`}>
                {persona.gender}
              </span>
            </div>
          </div>
        )}

        {/* Message history */}
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'visitor';
          const isImage = msg.type === 'image' || (typeof msg.content === 'string' && msg.content.startsWith('data:image/'));
          const time = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={msg.id || idx}
              className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && persona && (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-pink-500/30 mb-1">
                  <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                  isMe
                    ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white rounded-br-none shadow-pink-600/20'
                    : 'bg-[#181428] text-slate-100 border border-purple-900/40 rounded-bl-none'
                }`}
              >
                {/* Render Image or Text */}
                {isImage ? (
                  <div className="space-y-1.5">
                    <img
                      src={msg.content}
                      alt="Shared photo"
                      onClick={() => setPreviewModalImage(msg.content)}
                      className="rounded-xl max-h-64 sm:max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-white/10"
                    />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}

                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMe ? 'text-pink-200/80' : 'text-slate-400'
                  }`}
                >
                  <span>{time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-pink-200" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
            <div className="flex gap-1 items-center px-3 py-1.5 rounded-full bg-[#181428] border border-purple-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] text-pink-300">{persona?.name} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Flirt Starters */}
      <div className="px-4 py-2 bg-[#0E0B19]/80 border-t border-purple-900/30 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="text-[11px] text-pink-400 font-medium shrink-0">Quick Flirts:</span>
          {QUICK_FLIRTS.map((flirt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickSend(flirt)}
              className="shrink-0 px-3 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 border border-white/10 hover:border-pink-500/30 transition-all text-[11px]"
            >
              {flirt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar with Image & Camera Controls */}
      <div className="sticky bottom-0 bg-[#100C1D] border-t border-purple-900/50 p-3 sm:p-4 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Emoji Tray */}
          {showEmojiPicker && (
            <div className="p-2.5 rounded-2xl bg-[#1A152E] border border-pink-500/30 flex items-center gap-2 overflow-x-auto shadow-xl">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Gallery Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-purple-900/40 text-slate-400 hover:text-pink-400 transition-colors"
              title="Send image from gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Live Camera Snapshot Button */}
            <button
              type="button"
              onClick={openCamera}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-purple-900/40 text-slate-400 hover:text-pink-400 transition-colors"
              title="Click live camera photo"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-xl border transition-colors ${
                showEmojiPicker
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                  : 'bg-white/5 border-purple-900/40 text-slate-400 hover:text-pink-400'
              }`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${persona?.name || '...'}`}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-purple-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-pink-600/30 transition-all flex items-center justify-center shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Live Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#130F23] border border-pink-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white text-sm">Live Camera Photo</h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Video View or Captured Snapshot */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-purple-900/50 flex items-center justify-center">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={sendCapturedImage}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4 fill-white" />
                    <span>Send Photo</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="w-16 h-16 rounded-full border-4 border-white bg-pink-500 hover:bg-pink-600 shadow-xl shadow-pink-500/40 transition-transform active:scale-95 flex items-center justify-center"
                  title="Snap photo"
                >
                  <div className="w-12 h-12 rounded-full bg-white/80" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewModalImage}
              alt="Full preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mandatory 10-Digit Phone Login Modal */}
      <PhoneLoginModal
        isOpen={showPhoneLoginModal}
        onClose={() => setShowPhoneLoginModal(false)}
        personaName={persona?.name}
        onLoginSuccess={(phone) => {
          setShowPhoneLoginModal(false);
        }}
      />

      {/* Report & Block Modal */}
      {persona && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          profile={persona}
          onBlocked={() => navigate('/')}
        />
      )}
    </div>
  );
}
