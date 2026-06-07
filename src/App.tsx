/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from 'motion/react';
import { 
  FlaskConical, 
  Beaker, 
  Microscope, 
  Dna, 
  Telescope, 
  Atom, 
  Thermometer,
  Sparkles,
  Command,
  Zap,
  Star as StarIcon,
  Moon,
  Calculator,
  BookOpen,
  Globe,
  ArrowLeft,
  Send,
  Loader2,
  Bookmark,
  ChevronRight
} from 'lucide-react';

import { useEffect, useState, ReactNode, useMemo, useRef, FormEvent } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface FloatingItem {
  id: string;
  type: 'number' | 'idiom' | 'apparatus';
  content: string | ReactNode;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  topics: string[];
  systemInstruction: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// --- Constants ---
const SUBJECTS: Subject[] = [
  {
    id: 'maths',
    name: 'Maths',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-400',
    description: 'The universal language of patterns, structures, and change.',
    topics: ['Algebra', 'Calculus', 'Geometry', 'Number Theory', 'Statistics'],
    systemInstruction: "You are a brilliant Mathematics tutor. Help the user with mathematical concepts, formulas, and problem-solving. Use LaTeX-like formatting for equations where appropriate. Be concise and logical."
  },
  {
    id: 'science',
    name: 'Science',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-400',
    description: 'Systematic study of the structure and behavior of the physical world.',
    topics: ['Quantum Physics', 'Organic Chemistry', 'Molecular Biology', 'Astrophysics', 'Genetics'],
    systemInstruction: "You are a world-class Science educator. Explain complex scientific phenomena, help with experiments, and discuss the laws of nature. Use analogies to make hard concepts easier."
  },
  {
    id: 'english',
    name: 'English',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-400',
    description: 'Mastery of literature, language, and creative expression.',
    topics: ['Shakespearean Drama', 'Poetic Meter', 'Literary Criticism', 'Creative Writing', 'Linguistics'],
    systemInstruction: "You are a distinguished Literature professor and Writing coach. Analyze texts, improve writing style, and discuss literary themes. Encourage deep reading and elegant expression."
  },
  {
    id: 'social-studies',
    name: 'Social Studies',
    icon: Globe,
    color: 'from-rose-500 to-pink-400',
    description: 'Exploration of human societies and social relationships.',
    topics: ['Ancient Civilizations', 'Geopolitics', 'Economics', 'Sociology', 'Human Rights'],
    systemInstruction: "You are a wise Historian and Sociologist. Help users understand historical contexts, social dynamics, and global cultures. Connect past events to present realities."
  }
];

// --- Constants ---
const IDIOMS = [
  "Piece of cake",
  "Break a leg",
  "Cloud nine",
  "Under the weather",
  "Silver lining",
  "Spill the beans",
  "Once in a blue moon"
];

const NUMBERS = ["42", "π", "∞", "φ", "7", "108", "e", "1.618", "√2", "∑"];

const APPARATUS = [
  { icon: FlaskConical, name: "Flask" },
  { icon: Beaker, name: "Beaker" },
  { icon: Microscope, name: "Microscope" },
  { icon: Dna, name: "DNA" },
  { icon: Telescope, name: "Telescope" },
  { icon: Atom, name: "Atom" },
  { icon: Thermometer, name: "Thermometer" }
];

// --- Helper for random position ---
const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

export default function App() {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Setup
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const messageToSend = overrideMsg || inputMessage;
    if (!messageToSend.trim() || !activeSubject) return;

    const userMsg: Message = { role: 'user', text: messageToSend };
    setChatMessages(prev => [...prev, userMsg]);
    if (!overrideMsg) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatMessages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: messageToSend }] }
        ],
        config: {
          systemInstruction: activeSubject.systemInstruction,
        }
      });

      const aiMsg: Message = { role: 'model', text: response.text || 'Thinking...' };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my central logic. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate random items
    const newItems: FloatingItem[] = [];
    
    // Idioms
    IDIOMS.forEach((idiom, i) => {
      newItems.push({
        id: `idiom-${i}`,
        type: 'idiom',
        content: idiom,
        x: getRandom(5, 85),
        y: getRandom(10, 85),
        size: getRandom(14, 24),
        delay: getRandom(0, 5),
        duration: getRandom(20, 40)
      });
    });

    // Numbers
    NUMBERS.forEach((num, i) => {
      newItems.push({
        id: `num-${i}`,
        type: 'number',
        content: num,
        x: getRandom(5, 95),
        y: getRandom(5, 95),
        size: getRandom(20, 60),
        delay: getRandom(0, 5),
        duration: getRandom(15, 35)
      });
    });

    // Apparatus
    APPARATUS.forEach((item, i) => {
      const Icon = item.icon;
      newItems.push({
        id: `apparatus-${i}`,
        type: 'apparatus',
        content: <Icon size={getRandom(30, 70)} strokeWidth={1} />,
        x: getRandom(5, 95),
        y: getRandom(5, 95),
        size: 1, // Icon sizes are handled by size prop
        delay: getRandom(0, 5),
        duration: getRandom(25, 45)
      });
    });

    setItems(newItems);

    // Stars
    const newStars = Array.from({ length: 250 }).map((_, i) => ({
      id: i,
      x: getRandom(0, 100),
      y: getRandom(0, 100),
      size: getRandom(0.5, 2.5),
      color: i % 20 === 0 ? '#b3d9ff' : (i % 25 === 0 ? '#ffd9b3' : '#ffffff')
    }));
    setStars(newStars);
  }, []);

  const nebulas = useMemo(() => [
    { id: 1, color: 'bg-purple-900', top: '10%', left: '20%', size: 'w-[500px] h-[500px]' },
    { id: 2, color: 'bg-blue-900', top: '50%', left: '60%', size: 'w-[600px] h-[600px]' },
    { id: 3, color: 'bg-indigo-900', top: '30%', left: '70%', size: 'w-[400px] h-[400px]' },
  ], []);

  const shootingStars = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    delay: getRandom(0, 15),
    duration: getRandom(2, 4),
    top: getRandom(0, 40),
    left: getRandom(0, 40)
  }));

  return (
    <main className="relative w-full h-screen overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background Layer */}
      <div className="atmosphere" />
      
      {/* Nebulas */}
      {nebulas.map(nebula => (
        <motion.div
          key={`nebula-${nebula.id}`}
          className={`nebula ${nebula.color} ${nebula.size}`}
          style={{ top: nebula.top, left: nebula.left }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: getRandom(20, 30),
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Decorative Moon */}
      <div className="moon top-[10%] left-[10%]" />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-[10%] left-[10%] opacity-40 pointer-events-none"
      >
        <Moon size={80} fill="white" className="text-white blur-[1px] rotate-[-15deg]" />
      </motion.div>

      {/* Shooting Stars */}
      {shootingStars.map((s) => (
        <motion.div
          key={`shooting-${s.id}`}
          initial={{ x: "-100px", y: "-100px", opacity: 0 }}
          animate={{ x: "110vw", y: "80vh", opacity: [0, 1, 0] }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            repeatDelay: getRandom(10, 30),
            ease: "linear"
          }}
          className="absolute w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-45 pointer-events-none"
          style={{ top: `${s.top}%`, left: `${s.left}%` }}
        />
      ))}
      
      {/* Stars Layer */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="star"
          initial={{ opacity: getRandom(0.1, 0.7), scale: 1 }}
          animate={{ 
            opacity: [getRandom(0.1, 0.4), getRandom(0.5, 1), getRandom(0.1, 0.4)],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: getRandom(3, 8),
            repeat: Infinity,
            ease: "easeInOut",
            delay: getRandom(0, 5)
          }}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color
          }}
        />
      ))}

      {/* Floating Elements Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ 
              x: `${item.x}vw`, 
              y: `${item.y}vh`, 
              opacity: 0,
              rotate: getRandom(-20, 20)
            }}
            animate={{ 
              y: [`${item.y}vh`, `${item.y - 10}vh`, `${item.y}vh`],
              x: [`${item.x}vw`, `${item.x + 2}vw`, `${item.x}vw`],
              rotate: [getRandom(-20, 20), getRandom(-20, 20), getRandom(-20, 20)],
              opacity: [0, 0.4, 0.4, 0]
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut"
            }}
            className="absolute pointer-events-auto"
          >
            {item.type === 'idiom' && (
              <span 
                className="font-serif italic text-white/40 hover:text-white/80 transition-colors cursor-default"
                style={{ fontSize: `${item.size}px` }}
              >
                {item.content}
              </span>
            )}
            {item.type === 'number' && (
              <span 
                className="font-display font-light text-white/20 select-none hover:text-white/50 transition-colors"
                style={{ fontSize: `${item.size}px` }}
              >
                {item.content}
              </span>
            )}
            {item.type === 'apparatus' && (
              <div className="text-white/30 hover:text-white/60 transition-colors">
                {item.content}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full py-20 px-6 text-center pointer-events-none">
        {!activeSubject ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-5xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs tracking-[0.2em] font-display uppercase border border-white/20 rounded-full bg-white/5 backdrop-blur-sm shadow-xl">
              <Sparkles size={14} className="text-purple-400" />
              <span>Foundations of Knowledge</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-display font-medium tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-none">
              Subject Solution
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl font-light text-white/60 leading-relaxed font-sans mb-16">
              Where logic meets language, and curiosity meets the cosmos. 
              A surreal synthesis of science, symbols, and syntax.
            </p>

            {/* Subject Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-10">
              {SUBJECTS.map((subject) => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  onClick={() => {
                    setActiveSubject(subject);
                    setChatMessages([{ role: 'model', text: `Greetings. I am your specialized AI for ${subject.name}. What shall we explore today?` }]);
                  }} 
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-16 opacity-0 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <button className="px-8 py-3 rounded-full glass hover:bg-white/10 transition-all font-medium flex items-center gap-2 group">
                <Command size={18} className="transition-transform group-hover:rotate-12" />
                Explore Patterns
              </button>
              <button className="px-8 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-all font-medium flex items-center gap-2 group">
                <Zap size={18} fill="currentColor" />
                Get Solutions
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl h-[80vh] grid grid-cols-1 lg:grid-cols-12 gap-6 pointer-events-auto"
          >
            {/* Sidebar / Topics */}
            <div className="lg:col-span-3 flex flex-col gap-4 text-left">
              <button 
                onClick={() => setActiveSubject(null)}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4 group"
              >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                <span className="font-display uppercase tracking-widest text-xs">Orbit Back</span>
              </button>

              <div className="glass rounded-3xl p-6 flex flex-col gap-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeSubject.color} flex items-center justify-center shadow-lg`}>
                  <activeSubject.icon size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-medium mb-2">{activeSubject.name}</h2>
                  <p className="text-sm text-white/40 leading-relaxed font-sans">{activeSubject.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-display">Core Topics</h4>
                  {activeSubject.topics.map((topic, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <button 
                        onClick={() => {
                          handleSendMessage(undefined, `Tell me about ${topic} in ${activeSubject.name}.`);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                      >
                        <span className="text-sm text-white/70 group-hover:text-white font-medium">{topic}</span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/50" />
                      </button>
                      <button 
                        onClick={() => {
                          handleSendMessage(undefined, `Give me a challenge question about ${topic} in ${activeSubject.name}.`);
                        }}
                        className="text-[10px] text-purple-400/50 hover:text-purple-400 text-left px-3 py-1 transition-colors flex items-center gap-1 group"
                      >
                        <Zap size={10} className="group-hover:animate-pulse" />
                        Solve Question
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-9 flex flex-col glass rounded-3xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                  <span className="text-xs font-display uppercase tracking-widest text-white/60">Subject Intelligence Active</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] text-white/40 uppercase tracking-widest font-display">Neural Syncing</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-left leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-purple-600/20 border border-purple-500/30 text-white' 
                        : 'bg-white/5 border border-white/10 text-white/80'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                      <span className="text-xs text-white/40">Synthesizing response...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask anything about ${activeSubject.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-white text-black p-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle UI Accents */}
      <div className="fixed bottom-8 left-8 z-20 flex gap-6 text-[10px] tracking-[0.3em] font-display uppercase text-white/30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>System Active</span>
        </div>
        <div className="hidden md:block">Lat: 51.5074° N | Lon: 0.1278° W</div>
      </div>

      <div className="fixed top-8 right-8 z-20">
        <div className="glass p-2 rounded-xl flex gap-2">
           <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <StarIcon size={18} />
           </div>
        </div>
      </div>
    </main>
  );
}

function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void; key?: string }) {
  const Icon = subject.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass p-6 rounded-3xl flex flex-col items-start gap-4 text-left transition-all group pointer-events-auto"
    >
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${subject.color} shadow-lg shadow-white/5`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="text-xl font-display font-medium mb-1 group-hover:text-purple-300 transition-colors">{subject.name}</h3>
        <p className="text-xs text-white/50 leading-relaxed max-w-[200px]">
          {subject.description}
        </p>
      </div>
      <div className="flex gap-1 mt-2">
        {subject.topics.slice(0, 3).map((topic, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
            {topic}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

