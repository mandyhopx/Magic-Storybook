import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateStory, generateIllustration, generateSpeech, Story, StoryPage } from './services/gemini';
import { Sparkles, BookOpen, User, Wand2, ArrowRight, ArrowLeft, Volume2, RotateCcw } from 'lucide-react';

type Stage = 'welcome' | 'loading' | 'reading';

export default function App() {
  const [stage, setStage] = React.useState<Stage>('welcome');
  const [theme, setTheme] = React.useState('');
  const [characterName, setCharacterName] = React.useState('');
  const [story, setStory] = React.useState<Story | null>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [loadingStep, setLoadingStep] = React.useState('');
  const [isSynthesizing, setIsSynthesizing] = React.useState(false);

  const startStory = async () => {
    if (!theme || !characterName) return;
    
    setStage('loading');
    setLoadingStep('Whispering to the magic ink...');
    
    try {
      // 1. Generate Story Text and Prompts
      const newStory = await generateStory(theme, characterName);
      setStory(newStory);
      
      // 2. Pre-generate the first page's image and audio to show something quickly
      setLoadingStep('Painting the first page...');
      const firstPage = newStory.pages[0];
      const imageUrl = await generateIllustration(firstPage.imagePrompt);
      const audioUrl = await generateSpeech(firstPage.text);
      
      const updatedPages = [...newStory.pages];
      updatedPages[0] = { ...firstPage, imageUrl, audioUrl };
      setStory({ ...newStory, pages: updatedPages });
      
      setStage('reading');
      setCurrentPage(0);
      
      // 3. Background generate remaining pages
      generateRemainingContent(newStory, updatedPages);
    } catch (error) {
      console.error("Story generation failed:", error);
      alert("Oh no! The magic faded for a moment. Please try again!");
      setStage('welcome');
    }
  };

  const generateRemainingContent = async (originalStory: Story, currentPages: StoryPage[]) => {
    const updatedPages = [...currentPages];
    for (let i = 1; i < originalStory.pages.length; i++) {
      try {
        const page = originalStory.pages[i];
        const imageUrl = await generateIllustration(page.imagePrompt);
        const audioUrl = await generateSpeech(page.text);
        updatedPages[i] = { ...page, imageUrl, audioUrl };
        setStory(prev => prev ? { ...prev, pages: updatedPages } : null);
      } catch (err) {
        console.error(`Failed to generate content for page ${i}`, err);
      }
    }
  };

  const playAudio = (url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play();
  };

  const reset = () => {
    setStage('welcome');
    setStory(null);
    setCurrentPage(0);
    setTheme('');
    setCharacterName('');
  };

  return (
    <div className="min-h-screen bg-[#FFF9E6] text-[#2D3436] font-sans selection:bg-yellow-200/50 overflow-hidden relative flex flex-col">
      <AnimatePresence mode="wait">
        {stage === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="mb-10 w-24 h-24 bg-[#FF7675] rounded-3xl border-4 border-black flex items-center justify-center shadow-[0_8px_0_#D63031]"
            >
              <Wand2 className="w-14 h-14 text-white" />
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-4 text-center leading-none">
              Magic <br/> Storybook
            </h1>
            <p className="text-2xl font-bold text-[#636E72] mb-12 max-w-lg text-center leading-tight uppercase tracking-tight">
              Create adventures from your wildest dreams!
            </p>

            <div className="w-full max-w-xl space-y-8 bg-white p-10 rounded-[40px] border-4 border-[#F1C40F] shadow-2xl">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-[#2D3436]">
                  <User size={20} /> Hero's Name
                </label>
                <input
                  type="text"
                  id="character-name"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g. Leo the Brave"
                  className="w-full bg-[#F5F6FA] border-4 border-black rounded-2xl px-6 py-4 outline-none focus:bg-white transition-all text-xl font-bold uppercase"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-[#2D3436]">
                  <Sparkles size={20} /> Story Theme
                </label>
                <input
                  type="text"
                  id="story-theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. A flying candy island"
                  className="w-full bg-[#F5F6FA] border-4 border-black rounded-2xl px-6 py-4 outline-none focus:bg-white transition-all text-xl font-bold uppercase"
                />
              </div>

              <button
                id="start-button"
                onClick={startStory}
                disabled={!theme || !characterName}
                className="w-full h-24 btn-bubble btn-bubble-teal disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none text-white font-black py-4 rounded-3xl transition-all flex items-center justify-center gap-4 text-3xl uppercase italic"
              >
                Start Magic
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FFF9E6]"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-40 h-40 border-8 border-black rounded-full flex items-center justify-center bg-white shadow-[0_12px_0_#D4A017]"
              >
                <BookOpen className="w-16 h-16 text-[#F1C40F]" />
              </motion.div>
            </div>
            <h2 className="mt-16 text-5xl font-black uppercase italic text-[#2D3436] tracking-tighter">
              {loadingStep}
            </h2>
            <div className="mt-8 flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.8 }}
                  className="w-5 h-5 bg-black rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'reading' && story && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col h-screen overflow-hidden"
          >
            {/* Nav */}
            <nav className="h-24 px-10 flex items-center justify-between bg-white border-b-8 border-[#F1C40F]">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-[#FF7675] rounded-full flex items-center justify-center border-4 border-black shadow-[0_4px_0_#D63031]">
                  <span className="text-white font-black text-3xl uppercase">{story.title[0]}</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                  {story.title}
                </h1>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  {story.pages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full border-4 border-black transition-all ${
                        currentPage >= i ? 'bg-[#F1C40F]' : 'bg-gray-200 border-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-2xl font-black uppercase italic bg-[#2D3436] text-white px-6 py-2 rounded-xl">
                  PAGE {currentPage + 1} / {story.pages.length}
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex p-10 gap-12 overflow-hidden">
              <section className="w-3/5 h-full rounded-[60px] border-[12px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden illustration-canvas">
                {story.pages[currentPage].imageUrl ? (
                  <motion.img
                    key={currentPage}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={story.pages[currentPage].imageUrl}
                    alt="Illustration"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-900/40 p-8 text-center bg-white/30 backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-white">
                      <Wand2 className="w-12 h-12" />
                    </div>
                    <p className="text-2xl font-black uppercase italic tracking-tight">AI Generating <br/> Magic...</p>
                  </div>
                )}
                
                {/* Decorative Ground Like in Mock */}
                <div className="absolute -bottom-24 -left-24 w-[130%] h-64 ground opacity-40 blur-2xl pointer-events-none" />
              </section>

              <section className="w-2/5 h-full flex flex-col justify-center gap-10">
                <motion.div
                  key={`text-${currentPage}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <p className="text-[52px] font-black uppercase italic text-[#2D3436] leading-[0.95] tracking-tighter">
                    {story.pages[currentPage].text.split('.')[0]}!
                  </p>
                  <p className="text-3xl font-bold leading-tight text-[#636E72] tracking-tight">
                    {story.pages[currentPage].text.split('.').slice(1).join('.').trim()}
                  </p>
                </motion.div>

                {story.pages[currentPage].audioUrl && (
                  <div className="mt-4 p-8 bg-white rounded-[40px] border-8 border-[#74B9FF] shadow-lg">
                    <div className="flex items-center gap-6">
                      <button
                        id="play-audio"
                        onClick={() => playAudio(story.pages[currentPage].audioUrl)}
                        className="w-16 h-16 bg-[#74B9FF] rounded-2xl flex items-center justify-center border-4 border-black hover:scale-105 active:translate-y-1 transition-all"
                      >
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                      </button>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-black">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 15, ease: "linear" }}
                          className="h-full bg-[#74B9FF]" 
                        />
                      </div>
                      <span className="font-black text-2xl text-[#74B9FF] italic">0:12</span>
                    </div>
                  </div>
                )}
              </section>
            </main>

            {/* Footer */}
            <footer className="h-36 px-10 flex items-center justify-between bg-white border-t-8 border-black/5">
              <button
                id="prev-page"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="w-24 h-24 btn-bubble btn-bubble-white disabled:opacity-30 disabled:shadow-none flex items-center justify-center text-5xl"
              >
                ⬅️
              </button>

              <div className="flex gap-8">
                <button
                  id="regenerate-art"
                  className="px-12 h-20 btn-bubble btn-bubble-teal flex items-center gap-6 rounded-full"
                  onClick={async () => {
                   const page = story.pages[currentPage];
                   const imageUrl = await generateIllustration(page.imagePrompt);
                   if (story) {
                     const updatedPages = [...story.pages];
                     updatedPages[currentPage] = { ...page, imageUrl };
                     setStory({ ...story, pages: updatedPages });
                   }
                  }}
                >
                  <span className="text-4xl">🎨</span>
                  <span className="text-3xl font-black uppercase italic text-white tracking-tight">New Art</span>
                </button>

                <button
                  id="read-me"
                  onClick={() => playAudio(story.pages[currentPage].audioUrl)}
                  disabled={!story.pages[currentPage].audioUrl}
                  className="px-12 h-20 btn-bubble btn-bubble-red flex items-center gap-6 rounded-full disabled:opacity-50"
                >
                  <span className="text-4xl">📖</span>
                  <span className="text-3xl font-black uppercase italic text-white tracking-tight">Read Me</span>
                </button>

                <button
                  id="reset-home"
                  onClick={reset}
                  className="px-10 h-20 btn-bubble btn-bubble-white flex items-center gap-4 rounded-full"
                >
                  <RotateCcw size={28} />
                  <span className="text-2xl font-black uppercase italic tracking-tight">Return</span>
                </button>
              </div>

              <button
                id="next-page"
                onClick={() => setCurrentPage(Math.min(story.pages.length - 1, currentPage + 1))}
                disabled={currentPage === story.pages.length - 1}
                className="w-24 h-24 btn-bubble btn-bubble-yellow disabled:opacity-30 disabled:shadow-none flex items-center justify-center text-5xl"
              >
                ➡️
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow-duration {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
