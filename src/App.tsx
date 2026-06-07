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
  ChevronRight,
  Brain,
  Trophy,
  Check,
  X,
  HelpCircle,
  RefreshCw,
  Play
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// --- Curated Quizzes Database ---
const SUBJECT_QUIZZES: Record<string, QuizQuestion[]> = {
  'maths': [
    {
      question: "What is the derivative of 3x² + 5x - 9 with respect to x?",
      options: ["3x + 5", "6x + 5", "6x", "6x² + 5"],
      correctAnswer: "6x + 5",
      explanation: "Using the power rule: d/dx(x^n) = n*x^(n-1). Thus, d/dx(3x²) = 6x and d/dx(5x) = 5. The derivative of a constant is 0."
    },
    {
      question: "If a triangle has sides of length 7, 24, and 25, what is the value of the cosine of the angle opposite to side 24?",
      options: ["7/25", "24/25", "7/24", "1/2"],
      correctAnswer: "7/25",
      explanation: "7, 24, and 25 form a right-angled triangle because 7² + 24² = 49 + 576 = 625 = 25². The cosine of the angle opposite to 24 is adj/hyp = 7/25."
    },
    {
      question: "Which number represents the golden ratio (φ) approximately?",
      options: ["1.414", "3.1415", "2.718", "1.618"],
      correctAnswer: "1.618",
      explanation: "The golden ratio φ is (1 + √5)/2, which is approximately 1.61803."
    }
  ],
  'science': [
    {
      question: "What is the primary site of photosynthesis in eukaryotic plant cells?",
      options: ["Mitochondria", "Chloroplast", "Ribosome", "Lysosome"],
      correctAnswer: "Chloroplast",
      explanation: "Chloroplasts contain chlorophyll that captures solar energy and uses it to convert carbon dioxide and water into glucose."
    },
    {
      question: "In quantum mechanics, which principle states that it is impossible to simultaneously measure both the position and momentum of a particle?",
      options: ["Pauli Exclusion Principle", "Heisenberg Uncertainty Principle", "Photoelectric Effect", "de Broglie Wave"],
      correctAnswer: "Heisenberg Uncertainty Principle",
      explanation: "Formulated by Werner Heisenberg, it highlights the wave-particle duality and limits precision: Δx * Δp ≥ ℏ/2."
    },
    {
      question: "Which molecule acts as the main currency of cellular energy?",
      options: ["DNA", "Glucose", "ATP", "RNA"],
      correctAnswer: "ATP",
      explanation: "Adenosine Triphosphate (ATP) stores energy in high-energy phosphate bonds, releasing it upon conversion to ADP."
    }
  ],
  'english': [
    {
      question: "In Shakespeare's Macbeth, what is the famous prophecy given to Macbeth regarding his death?",
      options: [
        "No man of woman born shall harm him",
        "He shall fall when the stars fade",
        "Beware the Ides of March",
        "He will triumph forevermore"
      ],
      correctAnswer: "No man of woman born shall harm him",
      explanation: "The apparitions conjure up prophecies stating no man born of a woman can kill him, which makes the tyrant overconscious."
    },
    {
      question: "Which poetic meter consists of an unstressed syllable followed by a stressed syllable?",
      options: ["Trochaic", "Dactylic", "Anapestic", "Iambic"],
      correctAnswer: "Iambic",
      explanation: "An iamb is an unstressed followed by a stressed syllable (da-DUM). Examples include 'exist' or 'compare'."
    },
    {
      question: "Identify the figure of speech: 'The sky was a dark indigo ceiling watching over us'.",
      options: ["Simile", "Metaphor", "Personification", "Alliteration"],
      correctAnswer: "Metaphor",
      explanation: "It is a metaphor because it directly states the sky IS a dark ceiling, without using comparative words like 'like' or 'as'."
    }
  ],
  'social-studies': [
    {
      question: "Which ancient Mesopotamian ruler is famous for creating one of the earliest written codes of law?",
      options: ["Nebuchadnezzar", "Hammurabi", "Gilgamesh", "Sargon the Great"],
      correctAnswer: "Hammurabi",
      explanation: "The Code of Hammurabi established detailed state laws comprising standard legal precedents in Babylon."
    },
    {
      question: "The Silk Road was an ancient trade network that primarily connected which two major regions?",
      options: ["Europe and China", "Egypt and South America", "India and West Africa", "Greece and Scandinavia"],
      correctAnswer: "Europe and China",
      explanation: "The trade routes linked the Roman Empire and Europe with China, carrying silk, spices, technologies, and ideas."
    },
    {
      question: "What economic term describes a prolonged period of high inflation paired with high unemployment and sluggish economic growth?",
      options: ["Recession", "Deflation", "Stagflation", "Hyperinflation"],
      correctAnswer: "Stagflation",
      explanation: "Stagflation is a combination of stagnation (stagnant growth, high unemployment) and inflation."
    }
  ]
};

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

  // --- Quiz Arena States ---
  const [activeView, setActiveView] = useState<'chat' | 'quiz'>('chat');
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Custom AI generated quiz question states
  const [customAIQuestion, setCustomAIQuestion] = useState<QuizQuestion | null>(null);
  const [isGeneratingAIQuestion, setIsGeneratingAIQuestion] = useState(false);
  const [aiTopicForQuiz, setAiTopicForQuiz] = useState<string>('');

  const handleSubjectSelect = (subject: Subject) => {
    setActiveSubject(subject);
    setActiveView('chat');
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setShowExplanation(false);
    setQuizCompleted(false);
    setCustomAIQuestion(null);
    setIsGeneratingAIQuestion(false);
    setAiTopicForQuiz(subject.topics[0] || '');
    setChatMessages([{ role: 'model', text: `Greetings. I am your specialized AI for ${subject.name}. What shall we explore today?` }]);
  };

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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        throw new Error("API_KEY_NOT_CONFIGURED");
      }

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
    } catch (error: any) {
      console.error(error);
      if (error?.message === "API_KEY_NOT_CONFIGURED" || error?.message?.includes("API key")) {
        setChatMessages(prev => [
          ...prev, 
          { 
            role: 'model', 
            text: "⚠️ **Gemini API Key missing!**\n\nTo enable search and intelligence in your Vercel deployment:\n\n1. Go to your **Vercel Dashboard** > **Project Settings** > **Environment Variables**.\n2. Create a new variable named `GEMINI_API_KEY`.\n3. Paste your key from Google AI Studio and click **Save**.\n4. **Redeploy** your latest production branch!\n\nOnce completed successfully, your companion AI will instantly unlock!" 
          }
        ]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my central logic. Please try again." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAIQuestion = async (topic: string) => {
    if (!activeSubject) return;
    setIsGeneratingAIQuestion(true);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCustomAIQuestion(null);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        throw new Error("API_KEY_NOT_CONFIGURED");
      }

      const prompt = `Generate a high-quality, thought-provoking multiple-choice quiz question about the topic of "${topic}" in the context of the subject "${activeSubject.name}".
    
The question must have exactly 4 plausible options, with one clear correct option.
Include an educational explanation explaining why the correct answer is right and why other ones are incorrect.

You MUST respond strictly in valid JSON format. Do not write any explanations before or after the JSON block. It must be exactly a JSON object matching this TypeScript interface:
{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B", 
  "explanation": "Brief explanation of correct and incorrect choices."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const textOutput = response.text || "{}";
      const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleaned);

      if (data.question && Array.isArray(data.options) && data.options.length === 4 && data.correctAnswer) {
        setCustomAIQuestion(data);
      } else {
        throw new Error("Invalid format received.");
      }
    } catch (error: any) {
      console.error(error);
      setCustomAIQuestion({
        question: `Under standard paradigms of ${activeSubject.name}, which of the following is most essential to ${topic}?`,
        options: [
          `In-depth thematic synthesis of ${topic}`,
          `Unrelated contextual variable`,
          `Abstract baseline value`,
          `Transient procedural state`
        ],
        correctAnswer: `In-depth thematic synthesis of ${topic}`,
        explanation: `This is an on-demand fallback question on "${topic}" in ${activeSubject.name}. To unlock fully dynamic, infinite AI-generated test questions, please make sure your live GEMINI_API_KEY is configured in your project settings!`
      });
    } finally {
      setIsGeneratingAIQuestion(false);
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
                  onClick={() => handleSubjectSelect(subject)} 
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
            className="w-full max-w-6xl h-[85vh] flex flex-col gap-4 pointer-events-auto text-left"
          >
            {/* Top Navigation Bar with Left Arrow Hyperlink */}
            <div className="flex items-center justify-between w-full p-4 glass rounded-2xl flex-shrink-0">
              <a 
                href="/" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSubject(null);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 transition-all group border border-white/5 hover:border-white/10"
                id="back-to-home-link"
              >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1 text-purple-400" />
                <span className="font-display uppercase tracking-[0.2em] text-[11px] font-semibold">Back to Home</span>
              </a>
              <div className="flex items-center gap-3 pr-2 select-none">
                <span className="font-display font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-wider text-sm">Subject Solution</span>
                <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-mono uppercase">AI EDU</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
              {/* Sidebar / Topics */}
              <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 h-full">
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

              {/* Main Workspace: Chat OR Quiz Arena */}
              <div className="lg:col-span-9 flex flex-col glass rounded-3xl overflow-hidden h-full">
                {/* Header view toggle */}
                <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between flex-shrink-0">
                  <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 w-fit">
                    <button
                      onClick={() => setActiveView('chat')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${
                        activeView === 'chat' 
                          ? 'bg-purple-600/30 border border-purple-500/30 text-white font-semibold' 
                          : 'bg-transparent border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      <Sparkles size={13} className={activeView === 'chat' ? "text-purple-400" : "text-white/40"} />
                      <span>AI Discussion</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('quiz');
                        setCurrentQuizIdx(0);
                        setSelectedAnswer(null);
                        setQuizScore(0);
                        setShowExplanation(false);
                        setQuizCompleted(false);
                        setCustomAIQuestion(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${
                        activeView === 'quiz' 
                          ? 'bg-purple-600/30 border border-purple-500/30 text-white font-semibold' 
                          : 'bg-transparent border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      <Trophy size={13} className={activeView === 'quiz' ? "text-purple-400" : "text-white/40"} />
                      <span>Quiz Arena</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] text-white/40 uppercase tracking-widest font-display">Neural Syncing</span>
                  </div>
                </div>

                {/* View Conditional Layout */}
                {activeView === 'chat' ? (
                  <>
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

                    <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-3 flex-shrink-0">
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
                  </>
                ) : (
                  // Quiz Arena View Interface
                  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6">
                    {(() => {
                      const questionsList = SUBJECT_QUIZZES[activeSubject.id] || [];
                      const currentQuestion = customAIQuestion || questionsList[currentQuizIdx];

                      const getSubjectHoverClass = (subjectId: string) => {
                        switch (subjectId) {
                          case 'maths': return 'hover:border-blue-400 hover:bg-blue-500/5';
                          case 'science': return 'hover:border-emerald-400 hover:bg-emerald-500/5';
                          case 'english': return 'hover:border-amber-400 hover:bg-amber-500/5';
                          case 'social-studies': return 'hover:border-rose-400 hover:bg-rose-500/5';
                          default: return 'hover:border-purple-400 hover:bg-purple-500/5';
                        }
                      };

                      const handleAnswerClick = (option: string, correctAns: string) => {
                        if (selectedAnswer !== null) return;
                        setSelectedAnswer(option);
                        if (option === correctAns) {
                          setQuizScore(prev => prev + 1);
                        }
                        setShowExplanation(true);
                      };

                      const handleNextQuizQuestion = () => {
                        setSelectedAnswer(null);
                        setShowExplanation(false);
                        
                        if (customAIQuestion) {
                          setCustomAIQuestion(null);
                        } else {
                          if (currentQuizIdx + 1 < questionsList.length) {
                            setCurrentQuizIdx(prev => prev + 1);
                          } else {
                            setQuizCompleted(true);
                          }
                        }
                      };

                      const handleRetakeQuiz = () => {
                        setCurrentQuizIdx(0);
                        setSelectedAnswer(null);
                        setQuizScore(0);
                        setShowExplanation(false);
                        setQuizCompleted(false);
                        setCustomAIQuestion(null);
                      };

                      if (quizCompleted && !customAIQuestion) {
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto py-8 w-full"
                          >
                            <div className="relative mb-2">
                              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg mx-auto">
                                <Trophy size={38} className="text-black" strokeWidth={2} />
                              </div>
                            </div>

                            <h3 className="text-3xl font-display font-medium text-white">
                              Subject Mastery Complete!
                            </h3>
                            
                            <p className="text-sm text-white/50 leading-relaxed font-sans">
                              You scored <span className="font-semibold text-purple-400 text-lg">{quizScore}</span> out of <span className="font-semibold text-white text-lg">{questionsList.length}</span> on the standard quiz for <span className="text-white font-medium">{activeSubject.name}</span>.
                            </p>

                            <div className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-1">
                              <span className="text-xs uppercase tracking-widest text-white/40">Efficiency score</span>
                              <span className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                                {Math.round((quizScore / questionsList.length) * 100)}%
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                              <button 
                                onClick={handleRetakeQuiz}
                                className="flex-1 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <RefreshCw size={15} />
                                <span>Retry Standard Quiz</span>
                              </button>
                              <button 
                                onClick={() => setActiveView('chat')}
                                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all cursor-pointer"
                              >
                                Explore Concepts
                              </button>
                            </div>

                            {/* Infinite AI generator subsection on complete */}
                            <div className="w-full border-t border-white/10 pt-6 mt-4 text-left">
                              <h4 className="text-xs uppercase tracking-widest text-purple-400 font-display font-bold mb-3 flex items-center gap-2 select-none">
                                <Brain size={13} />
                                <span>Infinite Generator Suite</span>
                              </h4>
                              <p className="text-xs text-white/40 mb-4 leading-relaxed">
                                Generate infinite customized challenger questions powered by Gemini AI. Pick any topic below to query the generator!
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                                <select 
                                  value={aiTopicForQuiz}
                                  onChange={(e) => setAiTopicForQuiz(e.target.value)}
                                  className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                >
                                  {activeSubject.topics.map((t, index) => (
                                    <option key={index} value={t} className="bg-neutral-900 text-white">{t}</option>
                                  ))}
                                </select>
                                <button
                                  disabled={isGeneratingAIQuestion}
                                  onClick={() => handleGenerateAIQuestion(aiTopicForQuiz)}
                                  className="bg-white hover:bg-white/90 text-black px-5 py-2.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-55"
                                >
                                  {isGeneratingAIQuestion ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" />
                                      <span>Synthesizing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap size={13} fill="black" />
                                      <span>Generate Question</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      if (currentQuestion) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full space-y-6"
                          >
                            {/* Upper Stats and progress indicator bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-display text-white/50">
                                <span>
                                  {customAIQuestion ? (
                                    <span className="text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5 w-fit">
                                      <Brain size={12} />
                                      <span>AI Custom Challenge</span>
                                    </span>
                                  ) : (
                                    <span>Question {currentQuizIdx + 1} of {questionsList.length}</span>
                                  )}
                                </span>
                                {!customAIQuestion && (
                                  <span>Points: {quizScore} / {questionsList.length}</span>
                                )}
                              </div>
                              {!customAIQuestion && (
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-purple-500 h-full transition-all duration-300"
                                    style={{ width: `${((currentQuizIdx + 1) / questionsList.length) * 100}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* The Question Card */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                              <h3 className="text-lg font-medium text-white font-sans leading-relaxed text-left">
                                {currentQuestion.question}
                              </h3>
                            </div>

                            {/* Interactive Options list */}
                            <div className="grid grid-cols-1 gap-3">
                              {currentQuestion.options.map((option, idx) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrectAnswer = option === currentQuestion.correctAnswer;
                                const showCorrectStyles = selectedAnswer !== null && isCorrectAnswer;
                                const showIncorrectStyles = isSelected && !isCorrectAnswer;

                                let optionBadgeStyle = "border-white/5 bg-white/5 text-white/70";
                                if (showCorrectStyles) {
                                  optionBadgeStyle = "border-green-500 bg-green-500/10 text-green-300 shadow-lg shadow-green-500/5";
                                } else if (showIncorrectStyles) {
                                  optionBadgeStyle = "border-red-500 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/5";
                                } else if (selectedAnswer === null) {
                                  optionBadgeStyle = `border-white/10 cursor-pointer text-white/80 ${getSubjectHoverClass(activeSubject.id)}`;
                                } else {
                                  optionBadgeStyle = "border-white/5 bg-white/0 text-white/30 cursor-default opacity-50";
                                }

                                return (
                                  <button
                                    key={idx}
                                    disabled={selectedAnswer !== null}
                                    onClick={() => handleAnswerClick(option, currentQuestion.correctAnswer)}
                                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all group ${optionBadgeStyle}`}
                                  >
                                    <span className="text-sm font-medium font-sans leading-relaxed">{option}</span>
                                    <div className="flex-shrink-0 ml-3">
                                      {showCorrectStyles && (
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                          <Check size={12} className="text-black font-bold" strokeWidth={3} />
                                        </div>
                                      )}
                                      {showIncorrectStyles && (
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                          <X size={12} className="text-black font-bold" strokeWidth={3} />
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Interactive analytical Explanation Panel */}
                            {selectedAnswer !== null && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-xl text-left space-y-2"
                              >
                                <span className="text-xs font-display uppercase tracking-wider text-purple-400 font-bold block select-none">
                                  ⚙️ Educational Explanation:
                                </span>
                                <p className="text-xs text-white/80 leading-relaxed font-sans">
                                  {currentQuestion.explanation}
                                </p>
                              </motion.div>
                            )}

                            {/* Control navigation triggers */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                              {selectedAnswer !== null && (
                                <button
                                  onClick={handleNextQuizQuestion}
                                  className="w-full bg-white hover:bg-white/90 text-black px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <span>
                                    {customAIQuestion 
                                      ? "Return to standard quiz" 
                                      : (currentQuizIdx + 1 < questionsList.length ? "Proceed to Next" : "Submit and Complete Score")
                                    }
                                  </span>
                                  <ChevronRight size={16} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                          <Loader2 size={32} className="animate-spin text-purple-400 mb-2" />
                          <span className="text-sm text-white/40">Preparing Quiz...</span>
                        </div>
                      );
                    })()}

                    {/* Infinite custom AI testing suite bottom panel */}
                    {!quizCompleted && (
                      <div className="mt-8 border-t border-white/5 pt-6 max-w-2xl mx-auto w-full text-left">
                        <h4 className="text-xs uppercase tracking-widest text-white/40 font-display font-semibold mb-3 flex items-center gap-1.5 select-none">
                          <Brain size={12} className="text-purple-400" />
                          <span>Generate Dynamic AI Challenger Question</span>
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                          <select 
                            value={aiTopicForQuiz}
                            onChange={(e) => setAiTopicForQuiz(e.target.value)}
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                          >
                            {activeSubject.topics.map((t, index) => (
                              <option key={index} value={t} className="bg-neutral-900 text-white">{t}</option>
                            ))}
                          </select>
                          <button
                            disabled={isGeneratingAIQuestion}
                            onClick={() => handleGenerateAIQuestion(aiTopicForQuiz)}
                            className="bg-white hover:bg-white/90 text-black px-5 py-2.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px] cursor-pointer"
                          >
                            {isGeneratingAIQuestion ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Synthesizing...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={13} fill="black" />
                                <span>Generate AI Question</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

