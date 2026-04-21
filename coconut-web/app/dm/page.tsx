'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquare, Users, UserPlus, Settings, Menu, 
  ChevronLeft, Send, X, CornerDownRight, LogOut 
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"

// --- FIREBASE SETUP ---
import { initializeApp, getApps } from "firebase/app"
import { 
  getFirestore, collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, where, doc, setDoc, updateDoc 
} from "firebase/firestore"
import { 
  getDatabase, ref, onValue, push, set, 
  serverTimestamp as rtdbTimestamp 
} from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyCPYvW81xZHenybjCX7ZtmZq2que7nwYJk",
  authDomain: "coconut-web-ca0af.firebaseapp.com",
  projectId: "coconut-web-ca0af",
  storageBucket: "coconut-web-ca0af.firebasestorage.app",
  messagingSenderId: "231083318369",
  appId: "1:231083318369:web:eabd83d84af974d6441e20",
  measurementId: "G-5M86KDNYH9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const rtdb = getDatabase(app);

interface Message { id: string; sender: string; text: string; timestamp: any; replyTo?: string; }
interface Invite { id: string; sender: string; receiver: string; status: string; }
interface Room { id: string; participants: string[]; }

export default function CoconutApp() {
  const router = useRouter()
  const [view, setView] = useState<'home' | 'chat' | 'friends' | 'settings'>('home')
  const [chatType, setChatType] = useState<'common' | 'private'>('common')
  const [username, setUsername] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [inviteUser, setInviteUser] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = localStorage.getItem('username')
    if (!user) { router.push('/'); return; }
    setUsername(user)

    // Firestore: Listen for Invites & Private Rooms
    onSnapshot(query(collection(db, "invitations"), where("receiver", "==", user), where("status", "==", "pending")), (snap) => {
      setPendingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Invite[]);
    });
    onSnapshot(query(collection(db, "rooms"), where("participants", "array-contains", user)), (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Room[]);
    });
  }, [router]);

  useEffect(() => {
    setMessages([]);
    if (chatType === 'common') {
      const commonRef = ref(rtdb, 'common-chat');
      return onValue(commonRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          setMessages(list.sort((a, b) => a.timestamp - b.timestamp));
        }
      });
    } else if (activeRoom) {
      const q = query(collection(db, "rooms", activeRoom, "messages"), orderBy("timestamp", "asc"));
      return onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
      });
    }
  }, [chatType, activeRoom]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const msgData = {
      text: inputMessage,
      sender: username,
      timestamp: chatType === 'common' ? rtdbTimestamp() : serverTimestamp(),
      replyTo: replyingTo ? replyingTo.text : null
    };

    if (chatType === 'common') {
      const newListRef = push(ref(rtdb, 'common-chat'));
      await set(newListRef, msgData);
    } else if (activeRoom) {
      await addDoc(collection(db, "rooms", activeRoom, "messages"), msgData);
    }

    setInputMessage('');
    setReplyingTo(null);
  };

  const handleSendInvite = async () => {
    if (!inviteUser.trim() || inviteUser === username) return;
    await addDoc(collection(db, "invitations"), { sender: username, receiver: inviteUser, status: "pending", timestamp: serverTimestamp() });
    setInviteUser('');
    alert("Invite sent!");
  };

  const acceptInvite = async (inv: Invite) => {
    const rId = [inv.sender, inv.receiver].sort().join('_');
    await setDoc(doc(db, "rooms", rId), { participants: [inv.sender, inv.receiver], lastUpdated: serverTimestamp() });
    await updateDoc(doc(db, "invitations", inv.id), { status: "accepted" });
    setActiveRoom(rId);
    setChatType('private');
    setView('chat');
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white flex font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 w-72 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
            <div className="font-black  text-2xl flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /> COCONUT
            </div>
            <button className="md:hidden p-1 text-zinc-500" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => { setView('home'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'home' ? 'bg-zinc-800' : 'text-zinc-500 hover:text-white transition-colors'}`}><MessageSquare size={18}/> Dashboard</button>
          
          <button onClick={() => { setView('friends'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between p-3 rounded-lg ${view === 'friends' ? 'bg-zinc-800' : 'text-zinc-500 hover:text-white transition-colors'}`}>
            <div className="flex items-center gap-3"><Users size={18}/> Friend Requests</div>
            {pendingInvites.length > 0 && <Badge className="bg-emerald-600 px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px]">{pendingInvites.length}</Badge>}
          </button>

          <button onClick={() => { setView('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'settings' ? 'bg-zinc-800' : 'text-zinc-500 hover:text-white transition-colors'}`}><Settings size={18}/> Settings</button>
        </nav>

        <div className="p-4 border-t border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
          {username} <LogOut size={14} className="cursor-pointer hover:text-red-500" onClick={() => {localStorage.removeItem('username'); router.push('/')}}/>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
            <div className="font-black text-xl">COCONUT-WEB</div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-zinc-800 rounded-lg"><Menu size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {view === 'home' && (
            <main className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
                <header><p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Welcome Back !</p><h2 className="text-4xl font-bold text-emerald-500 tracking-tighter">{username}</h2></header>

                <section>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Public Channels</h3>
                <div onClick={() => { setChatType('common'); setView('chat'); }} className="group bg-zinc-900 border border-zinc-800 p-8 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                    <div><h4 className="text-2xl font-black decoration-emerald-500"># Coconut-chat</h4><p className="text-zinc-500 text-sm mt-1 font-medium">Stay Hydrated ! </p></div>
                    <Badge className="bg-emerald-600">Online</Badge>
                    </div>
                </div>
                </section>

                <section>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Private Chats</h3>
                <div className="grid gap-3">
                    {rooms.map(room => (
                    <div key={room.id} onClick={() => { setActiveRoom(room.id); setChatType('private'); setView('chat'); }} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center cursor-pointer hover:border-zinc-500 transition-all">
                        <span className="font-bold italic uppercase tracking-tight"># {room.participants.find(p => p !== username)}</span>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-500">Private</Badge>
                    </div>
                    ))}
                    {rooms.length === 0 && <p className="text-zinc-700 italic text-sm p-4">No active encrypted sessions.</p>}
                </div>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md">
                    <h4 className="font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest text-zinc-400"><UserPlus size={16}/> Connect with user</h4>
                    <div className="flex flex-col gap-3">
                    <input value={inviteUser} onChange={(e) => setInviteUser(e.target.value)} placeholder="Username to invite" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-emerald-500 transition-all" />
                    <button onClick={handleSendInvite} className="bg-emerald-600 py-3 rounded-xl font-black text-xs hover:bg-emerald-500 uppercase tracking-widest">Invite User</button>
                    </div>
                </section>
            </main>
            )}

            {view === 'chat' && (
            <div className="flex flex-col h-full">
                <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-full"><ChevronLeft size={20}/></button>
                    <h4 className="font-black uppercase italic tracking-tighter text-lg">{chatType === 'common' ? '# common' : '# private'}</h4>
                </div>
                <p className="text-[10px] text-emerald-500 font-bold uppercase hidden md:block">Double-tap message to reply</p>
                </header>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} onDoubleClick={() => setReplyingTo(msg)} className={`flex flex-col group cursor-pointer ${msg.sender === username ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase mb-1 px-1">{msg.sender}</span>
                    <div className={`max-w-[85%] p-3 px-5 rounded-2xl text-sm transition-all active:scale-95 ${msg.sender === username ? 'bg-emerald-600 rounded-tr-none text-white' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none'}`}>
                        {msg.replyTo && (
                            <div className="bg-black/20 p-2 rounded-lg mb-2 text-[11px] italic border-l-2 border-white/30 flex items-center gap-2">
                            <CornerDownRight size={10}/> {msg.replyTo}
                            </div>
                        )}
                        {msg.text}
                    </div>
                    </div>
                ))}
                <div ref={scrollRef} />
                </div>

                <div className="p-4 bg-zinc-900 border-t border-zinc-800 sticky bottom-0">
                {replyingTo && (
                    <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between bg-zinc-800 p-2 px-4 rounded-t-xl border-b border-emerald-500/50">
                    <div className="text-xs text-zinc-400 italic flex items-center gap-2"><CornerDownRight size={12}/> Replying to: {replyingTo.text}</div>
                    <X size={14} className="cursor-pointer" onClick={() => setReplyingTo(null)}/>
                    </div>
                )}
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2">
                    <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type a message..." className={`flex-1 bg-zinc-950 border border-zinc-800 p-3 px-6 text-sm outline-none focus:border-emerald-500 transition-all ${replyingTo ? 'rounded-b-xl' : 'rounded-full'}`} />
                    <button type="submit" className="bg-emerald-600 p-3 px-6 md:px-8 rounded-full font-black text-xs hover:bg-emerald-500 flex items-center gap-2 transition-colors"><Send size={16}/><span className="hidden md:inline">SEND</span></button>
                </form>
                </div>
            </div>
            )}

            {view === 'friends' && (
                <div className="p-6 md:p-10 h-full max-w-2xl mx-auto w-full">
                    <h2 className="text-3xl font-black italic tracking-tighter mb-8 underline decoration-emerald-500 decoration-4 uppercase">Pending Requests</h2>
                    {pendingInvites.map(inv => (
                        <div key={inv.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Incoming From</p><span className="text-xl font-black italic">{inv.sender}</span></div>
                            <button onClick={() => acceptInvite(inv)} className="w-full md:w-auto bg-emerald-600 px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-emerald-500">Establish Link</button>
                        </div>
                    ))}
                    {pendingInvites.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl text-zinc-600 font-bold italic">
                            NO PENDING FREQUENCIES
                        </div>
                    )}
                </div>
            )}

            {view === 'settings' && (
                <div className="p-6 md:p-10 h-full max-w-2xl mx-auto w-full">
                    <h2 className="text-3xl font-black italic tracking-tighter mb-8 uppercase">Console Settings</h2>
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
                        <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-2">Authenticated User</label><p className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-emerald-500">{username}</p></div>
                        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Network Status</span>
                            <Badge className="bg-emerald-900/20 text-emerald-500 border-emerald-500/30">ENCRYPTED</Badge>
                        </div>
                        <button onClick={() => {localStorage.removeItem('username'); router.push('/')}} className="w-full bg-red-950/20 text-red-500 border border-red-900/50 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Terminate Session</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}