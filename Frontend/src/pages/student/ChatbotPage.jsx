import { useState, useEffect } from 'react';
import { chatbotService } from '../../services/chatbotService.js';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Bot, Send, ArrowRight, Lightbulb, BookOpen, Target, CheckCircle, Plus, Clock, Wallet, Award, CheckCircle2, ArrowLeft, Check, XCircle } from 'lucide-react';

export default function ChatbotPage() {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'chat'

  // GENERATOR STATE
  const [step, setStep] = useState('course'); // course -> year -> module -> quiz -> ideaType -> ideas
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [modules, setModules] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [roadmaps, setRoadmaps] = useState({});
  const [loading, setLoading] = useState(false);

  // SELECTIONS
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  
  // SAVED ROADMAPS STATE
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [selectedSavedRoadmapId, setSelectedSavedRoadmapId] = useState(null);
  
  // CHAT STATE
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your AI Business Advisor. Ask me anything about startups, business strategies, and entrepreneurship!", isBot: true }
  ]);
  const [chatInput, setChatInput] = useState('');

  const NON_ACADEMIC_CATEGORIES = ['E-Commerce', 'Services', 'Content Creation', 'Food & Beverage', 'Tech Startup'];

  useEffect(() => {
    if (activeTab === 'generator' && step === 'course') {
      fetchCourses();
    }
    if (activeTab === 'roadmaps') {
      setSelectedSavedRoadmapId(null);
      fetchSavedRoadmaps();
    }
    if (activeTab === 'chat') {
      fetchChatSessions();
    }
  }, [activeTab, step]);

  const fetchChatSessions = async () => {
    try {
      const res = await chatbotService.getChatSessions();
      setChatSessions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChatSession = async (sessionId) => {
    setLoading(true);
    try {
      const res = await chatbotService.getChatSessionById(sessionId);
      if (res.data) {
        setCurrentSessionId(res.data._id);
        setMessages([
          { text: "Hello! I am your AI Business Advisor. Ask me anything about startups, business strategies, and entrepreneurship!", isBot: true },
          ...res.data.messages
        ]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { text: "Hello! I am your AI Business Advisor. Ask me anything about startups, business strategies, and entrepreneurship!", isBot: true }
    ]);
  };

  const fetchSavedRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await chatbotService.getRoadmaps();
      setSavedRoadmaps(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await chatbotService.getCourses();
      setCourses(res.data);
    } catch (e) {}
    setLoading(false);
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setLoading(true);
    try {
      const res = await chatbotService.getYearsAndSemesters(course);
      setYears(res.data.years);
      setSemesters(res.data.semesters);
      setStep('year');
    } catch (e) {}
    setLoading(false);
  };

  const handleYearSemesterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedYear || !selectedSemester) return;
    setLoading(true);
    try {
      const res = await chatbotService.getModulesList(selectedCourse, selectedYear, selectedSemester);
      setModules(res.data);
      setStep('module');
    } catch (e) {}
    setLoading(false);
  };

  const handleModuleToggle = (mod) => {
    setSelectedModules(prev => {
      const isSelected = prev.some(m => m.code === mod.code);
      if (isSelected) {
        return prev.filter(m => m.code !== mod.code);
      } else {
        return [...prev, mod];
      }
    });
  };

  const handleModulesSubmit = async (e) => {
    e.preventDefault();
    if (selectedModules.length === 0) return;
    setLoading(true);
    try {
      const moduleNames = selectedModules.map(m => m.name);
      const res = await chatbotService.generateQuiz(moduleNames);
      setQuiz(res.data);
      setStep('quiz');
    } catch (e) {
      alert("Failed to generate quiz. Try again.");
    }
    setLoading(false);
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    setQuizCompleted(true);
  };

  const handleFetchIdeas = async (type, category = '') => {
    setLoading(true);
    try {
      const moduleNames = selectedModules.map(m => m.name);
      const res = await chatbotService.generateIdeas({
        type, 
        moduleName: moduleNames,
        category
      });
      setIdeas(res.data);
      setStep('ideas');
    } catch (e) {}
    setLoading(false);
  };

  const [selectedIdea, setSelectedIdea] = useState(null);

  const toggleRoadmap = async (idea) => {
    setSelectedIdea(idea);
    setStep('roadmapView');
    
    if (roadmaps[idea.title] && roadmaps[idea.title].status !== 'Loading...' && roadmaps[idea.title].status !== 'Failed to load roadmap.') return; // Already fetched
    
    setRoadmaps(prev => ({ ...prev, [idea.title]: { status: 'Loading...' } }));
    try {
      const res = await chatbotService.generateRoadmap(idea.title);
      setRoadmaps(prev => ({ ...prev, [idea.title]: res.data }));
      // Add it to our saved roadmaps list too
      setSavedRoadmaps(prev => [res.data, ...prev]);
    } catch (e) {
      setRoadmaps(prev => ({ ...prev, [idea.title]: { status: 'Failed to load roadmap.' } }));
    }
  };

  const groupTasks = (tasks) => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return [];
    const chunkSize = Math.max(Math.ceil(tasks.length / 3), 1);
    const groups = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      groups.push({
          title: `Phase ${groups.length + 1} - Execution`,
          tasks: tasks.slice(i, i + chunkSize)
      });
    }
    return groups;
  };

  const handleTaskToggle = async (roadmapId, taskId, currentStatus, source = 'saved') => {
    try {
      // Optimistic UI updates
      if (source === 'saved') {
        setSavedRoadmaps(prev => prev.map(rm => {
          if (rm._id === roadmapId) {
            return {
              ...rm,
              tasks: rm.tasks.map(t => t._id === taskId ? { ...t, isDone: !currentStatus } : t)
            };
          }
          return rm;
        }));
      } else {
        // Find idea title based on roadmapId for the generator view updates
        const entry = Object.entries(roadmaps).find(([k, v]) => v && v._id === roadmapId);
        if (entry) {
          const ideaTitle = entry[0];
          setRoadmaps(prev => ({
            ...prev,
            [ideaTitle]: {
              ...prev[ideaTitle],
              tasks: prev[ideaTitle].tasks.map(t => t._id === taskId ? { ...t, isDone: !currentStatus } : t)
            }
          }));
        }
      }

      await chatbotService.updateTaskDone(roadmapId, taskId, !currentStatus);
    } catch (e) {
      console.error(e);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setChatInput('');
    setLoading(true);

    try {
      const res = await chatbotService.chat(userMsg, currentSessionId);
      setMessages(prev => [...prev, { text: res.reply, isBot: true }]);
      
      // Update session ID on newly created chat
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
        fetchChatSessions(); // Update sidebar with new chat
      }
    } catch (e) {
      setMessages(prev => [...prev, { text: "Error: Could not reach the AI Advisor.", isBot: true }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col max-w-5xl min-h-screen p-6 mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500">Generate startup ideas and get expert business advice.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button 
          className={`pb-3 px-6 font-medium ${activeTab === 'generator' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('generator')}
        >
          Business Idea Generator
        </button>
        <button 
          className={`pb-3 px-6 font-medium ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Business Chat
        </button>
        <button 
          className={`pb-3 px-6 font-medium ${activeTab === 'roadmaps' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('roadmaps')}
        >
          Saved Roadmaps
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-white border border-gray-100 shadow-sm rounded-xl">
        
        {/* --- GENERATOR TAB --- */}
        {activeTab === 'generator' && (
           <div className="relative min-h-[400px]">
             {loading && (
               <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                 <LoadingSpinner size="lg" />
               </div>
             )}

             {step === 'course' && (
               <div>
                 <h2 className="mb-4 text-xl font-bold">Select your Course</h2>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                   {courses.map(c => (
                     <button key={c} onClick={() => handleCourseSelect(c)} className="p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-sky-300">
                       <h3 className="font-semibold text-gray-800">{c}</h3>
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {step === 'year' && (
               <div>
                 <h2 className="mb-4 text-xl font-bold">Select Academic Year & Semester</h2>
                 <form onSubmit={handleYearSemesterSubmit} className="max-w-sm space-y-4">
                   <div>
                     <label className="block mb-1 text-sm font-medium">Year</label>
                     <select className="w-full p-2 border border-gray-300 rounded select" onChange={e => setSelectedYear(e.target.value)} required>
                       <option value="">Select Year</option>
                       {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block mb-1 text-sm font-medium">Semester</label>
                     <select className="w-full p-2 border border-gray-300 rounded select" onChange={e => setSelectedSemester(e.target.value)} required>
                       <option value="">Select Semester</option>
                       {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                     </select>
                   </div>
                   <button type="submit" className="w-full py-2 mt-4 text-white rounded bg-sky-600 hover:bg-sky-700">Next</button>
                 </form>
               </div>
             )}

             {step === 'module' && (
               <div>
                 <h2 className="mb-2 text-xl font-bold">Select Modules</h2>
                 <p className="mb-4 text-gray-500">You can select multiple modules.</p>
                 <form onSubmit={handleModulesSubmit}>
                   <div className="grid grid-cols-1 gap-4 mb-4">
                     {modules.map(m => {
                       const isSelected = selectedModules.some(selected => selected.code === m.code);
                       return (
                         <div key={m.code} onClick={() => handleModuleToggle(m)} className={`cursor-pointer p-4 border rounded-lg text-left shadow-sm relative group items-start flex gap-4 ${isSelected ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}>
                           <div className="flex-shrink-0 mt-1">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-600' : 'border-gray-400'}`}>
                               {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                             </div>
                           </div>
                           <div>
                              <h3 className="font-semibold text-gray-900">{m.code} - {m.name}</h3>
                              <p className="text-sm text-gray-500 line-clamp-2">{m.description}</p>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   <button type="submit" disabled={selectedModules.length === 0} className={`w-full text-white rounded py-2 mt-4 hover:bg-sky-700 ${selectedModules.length > 0 ? 'bg-sky-600' : 'bg-gray-400'}`}>Next ({selectedModules.length} selected)</button>
                 </form>
               </div>
             )}

             {step === 'quiz' && (
                <div>
                  <h2 className="mb-2 text-xl font-bold">Module Quizzes</h2>
                  <p className="mb-6 text-gray-500">Answer these quick questions before brainstorming ideas.</p>
                  
                  {!quizCompleted ? (
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                      {quiz.map((moduleQuiz, mIdx) => (
                        <div key={mIdx} className="mb-8 space-y-4">
                          <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">{moduleQuiz.module}</h3>
                          {moduleQuiz.questions && moduleQuiz.questions.map((q, qIdx) => (
                            <div key={qIdx} className="p-4 rounded-lg bg-gray-50">
                              <p className="mb-3 font-medium text-gray-800">{qIdx + 1}. {q.question}</p>
                              <div className="space-y-2">
                                {q.options.map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`q-${mIdx}-${qIdx}`} required onChange={() => setQuizAnswers(p => ({...p, [`${mIdx}-${qIdx}`]: opt}))} />
                                    <span className="text-gray-700">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <button type="submit" className="px-6 py-2 text-white rounded shadow bg-sky-600 hover:bg-sky-700">Submit Answers</button>
                    </form>
                  ) : (
                    <div className="py-10 fade-in">
                      <div className="text-center mb-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-2xl font-bold">Quiz Results</h3>
                      </div>
                      
                      <div className="space-y-6 mb-8 text-left">
                        {quiz.map((moduleQuiz, mIdx) => {
                           let score = 0;
                           let total = moduleQuiz.questions ? moduleQuiz.questions.length : 0;
                           if (moduleQuiz.questions) {
                             moduleQuiz.questions.forEach((q, qIdx) => {
                               if (quizAnswers[`${mIdx}-${qIdx}`] === q.answer) score++;
                             });
                           }
                           
                           return (
                             <div key={mIdx} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                               <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                                  <h4 className="text-lg font-bold text-gray-800">{moduleQuiz.module}</h4>
                                  <span className={`px-4 py-1 font-bold rounded-full text-center ${score === total ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    Score: {score} / {total}
                                  </span>
                               </div>
                               <div className="space-y-4">
                                {moduleQuiz.questions && moduleQuiz.questions.map((q, qIdx) => {
                                  const ans = quizAnswers[`${mIdx}-${qIdx}`];
                                  const isCorrect = ans === q.answer;
                                  return (
                                    <div key={qIdx} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                      <p className="font-medium text-gray-800 text-sm mb-3">{qIdx + 1}. {q.question}</p>
                                      <div className="text-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                           <span className="text-gray-600">Your answer:</span>
                                           <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{ans || "No answer"}</span>
                                           {isCorrect ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                        </div>
                                        {!isCorrect && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Correct:</span>
                                            <span className="font-semibold text-green-700">{q.answer}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                               </div>
                             </div>
                           );
                        })}
                      </div>

                      <div className="text-center pt-6 border-t border-gray-200">
                        <p className="mb-6 text-lg text-gray-600">What kind of business ideas are you looking for?</p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                           <button onClick={() => setStep('ideaType-academic')} className="flex flex-col items-center gap-2 px-8 py-4 font-bold border border-sky-200 bg-sky-50 text-sky-800 rounded-xl hover:bg-sky-100 transition-colors">
                             <BookOpen className="w-8 h-8"/> Academic (Based on Module)
                           </button>
                           <button onClick={() => setStep('ideaType-nonacademic')} className="flex flex-col items-center gap-2 px-8 py-4 font-bold border border-amber-200 bg-amber-50 text-amber-800 rounded-xl hover:bg-amber-100 transition-colors">
                             <Target className="w-8 h-8"/> Non-Academic Categories
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

             {step === 'ideaType-academic' && (
               <div className="py-12 text-center">
                   <p className="mb-6 font-medium text-gray-600">Generate startup ideas specifically for {selectedModules.map(m => m.name).join(', ')}</p>
                 <button onClick={() => handleFetchIdeas('academic')} className="px-8 py-3 text-white rounded-full bg-sky-600 hover:bg-sky-700">Generate Academic Ideas <ArrowRight className="inline w-4 h-4 ml-2"/></button>
               </div>
             )}

             {step === 'ideaType-nonacademic' && (
               <div>
                  <h2 className="mb-6 text-xl font-bold">Select a Category</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                     {NON_ACADEMIC_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleFetchIdeas('nonacademic', cat)} className="p-6 font-semibold text-center border rounded-xl hover:bg-blue-50 hover:border-sky-300">{cat}</button>
                     ))}
                  </div>
               </div>
             )}

             {step === 'ideas' && (
               <div>
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Your Startup Ideas</h2>
                    <button onClick={() => setStep('course')} className="text-sm text-blue-600 hover:underline">Start Over</button>
                 </div>
                 
                 <div className="space-y-6">
                   {ideas.map((idea, idx) => (
                     <div key={idx} className="overflow-hidden border border-gray-200 shadow-sm rounded-xl">
                       <div className="p-5 bg-white">
                         <div className="flex items-start gap-3">
                           <Lightbulb className="w-6 h-6 text-amber-500 shrink-0" />
                           <div>
                             <h3 className="text-lg font-bold text-gray-900">{idea.title}</h3>
                             <p className="mt-1 text-gray-600">{idea.description}</p>
                           </div>
                         </div>
                       </div>
                       
                       {/* Roadmap Section */}
                       <div className="p-4 border-t border-gray-100 bg-gray-50">
                         <button onClick={() => toggleRoadmap(idea)} className="flex items-center text-sm font-semibold text-blue-600 hover:text-sky-800">
                           {roadmaps[idea.title] ? 'View Roadmap' : 'Generate Full Roadmap'} <ArrowRight className="inline w-4 h-4 ml-1" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {step === 'roadmapView' && selectedIdea && (
                <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl px-6 py-10 pb-32 mx-auto overflow-y-auto">
                  <button onClick={() => setStep('ideas')} className="self-start mb-6 flex items-center gap-2 text-gray-500 hover:text-sky-700 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200">
                    <ArrowLeft className="w-4 h-4" /> Back to Tailored Ideas
                  </button>

                  <div className="w-full px-4 py-4 mb-6 border bg-sky-50 border-sky-200 rounded-2xl">
                    <h2 className="text-xl font-bold text-sky-900">{selectedIdea.title}</h2>
                  </div>

                  {!roadmaps[selectedIdea.title] || roadmaps[selectedIdea.title].status === 'Loading...' ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <LoadingSpinner size="lg" />
                      <p className="mt-4 text-lg text-gray-500">Synthesizing modules and preparing roadmap...</p>
                    </div>
                  ) : roadmaps[selectedIdea.title].status === 'Failed to load roadmap.' ? (
                    <div className="py-20 text-center text-red-500">Failed to load roadmap. Please try again.</div>
                  ) : (
                    <div className="flex flex-col w-full gap-8 lg:flex-row">
                      {/* Left: Strategic Overview */}
                      <div className="lg:w-1/3 shrink-0">
                        <div className="sticky p-6 bg-white border border-t-4 border-gray-200 shadow-lg rounded-3xl top-4 border-t-sky-500">
                          <h3 className="mb-4 text-lg font-bold text-gray-900">Strategic Overview</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-100">
                              <span className="text-gray-500">Course</span>
                              <span className="font-medium text-right text-gray-900">{selectedCourse || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-100">
                              <span className="text-gray-500">Year / Semester</span>
                              <span className="font-medium text-right text-gray-900">{selectedYear ? `Y${selectedYear}` : '-'} {selectedSemester ? `S${selectedSemester}` : ''}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50 rounded-xl">
                                <div className="p-2 text-green-600 bg-green-100 rounded-lg"><Check className="w-4 h-4"/></div>
                                <div className="min-w-0">
                                  <div className="text-xs text-gray-500">Tasks</div>
                                  <div className="text-sm font-semibold text-gray-900 truncate">{roadmaps[selectedIdea.title].tasks?.length || 0}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50 rounded-xl">
                                <div className="p-2 rounded-lg bg-sky-100 text-sky-600"><BookOpen className="w-4 h-4"/></div>
                                <div className="min-w-0">
                                  <div className="text-xs text-gray-500">Modules</div>
                                  <div className="text-sm font-semibold text-gray-900 truncate">{selectedModules.length}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Timeline */}
                      <div className="flex-1 space-y-6">
                        {groupTasks(roadmaps[selectedIdea.title].tasks).map((phase, i) => (
                          <div key={i} className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-l-4 border-gray-100 shadow-xl rounded-3xl group border-l-transparent hover:border-l-sky-500">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                              <Target className="w-32 h-32" />
                            </div>
                            <h4 className="pb-3 mb-5 text-xl font-bold text-gray-800 border-b border-gray-100">{phase.title}</h4>
                            <ul className="relative z-10 space-y-4">
                              {phase.tasks.map((task, t) => (
                                <li key={task._id || t} className="relative z-10 flex items-start gap-4 group/item">
                                  <button onClick={() => handleTaskToggle(roadmaps[selectedIdea.title]._id, task._id, task.isDone, 'generator')} className={`mt-0.5 p-1 rounded-full border shadow-sm shrink-0 transition-all cursor-pointer ${task.isDone ? 'bg-green-100 border-green-500 text-green-600 hover:bg-green-200' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-sky-400 hover:text-sky-500'}`}>
                                    <CheckCircle2 className={`w-4 h-4 ${task.isDone ? 'text-green-600' : ''}`} />
                                  </button>
                                  <span className={`text-sm leading-relaxed pt-0.5 transition-all ${task.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {task.description}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
             )}
           </div>
        )}

        {/* --- SAVED ROADMAPS TAB --- */}
        {activeTab === 'roadmaps' && (
          <div className="space-y-6 min-h-[400px] relative">
            {loading && savedRoadmaps.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <LoadingSpinner size="lg" />
              </div>
            )}
            
            {!selectedSavedRoadmapId ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Your Saved Roadmaps</h2>
                  <button onClick={fetchSavedRoadmaps} className="flex items-center gap-1 text-sm text-blue-600 hover:text-sky-800">Refresh</button>
                </div>

                {savedRoadmaps.length === 0 && !loading && (
                  <div className="py-12 text-center text-gray-500">
                     <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                     <p>No roadmaps saved yet.</p>
                     <p className="mt-2 text-sm">Generate some ideas and create roadmaps first!</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {savedRoadmaps.map((rm) => {
                    const completedTasks = rm.tasks?.filter(t => t.isDone).length || 0;
                    const totalTasks = rm.tasks?.length || 0;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    
                    return (
                      <button 
                        key={rm._id} 
                        onClick={() => setSelectedSavedRoadmapId(rm._id)}
                        className="flex flex-col h-full overflow-hidden text-left transition-all bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-sky-300 rounded-xl"
                      >
                        <div className="flex items-center justify-between w-full p-4 border-b bg-gray-50">
                          <h3 className="flex items-center gap-2 font-bold text-gray-900 truncate">
                            <Target className="w-5 h-5 shrink-0 text-sky-600"/>
                            <span className="truncate">{rm.ideaTitle}</span>
                          </h3>
                        </div>
                        <div className="flex flex-col justify-between w-full flex-1 p-5 space-y-4">
                          <div className="space-y-1">
                             <div className="flex items-center justify-between text-sm">
                               <span className="text-gray-500">Progress</span>
                               <span className="font-semibold text-sky-600">{progress}%</span>
                             </div>
                             <div className="w-full h-2 bg-gray-100 rounded-full">
                                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${progress}%` }}></div>
                             </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                             <span>{totalTasks} Tasks</span>
                             <span>{new Date(rm.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              (() => {
                const rm = savedRoadmaps.find(r => r._id === selectedSavedRoadmapId);
                if (!rm) return null;
                
                const completedTasks = rm.tasks?.filter(t => t.isDone).length || 0;
                const totalTasks = rm.tasks?.length || 0;

                return (
                  <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl px-6 py-10 pb-32 mx-auto overflow-y-auto">
                    <button onClick={() => setSelectedSavedRoadmapId(null)} className="self-start mb-6 flex items-center gap-2 text-gray-500 hover:text-sky-700 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200">
                      <ArrowLeft className="w-4 h-4" /> Back to Saved Roadmaps
                    </button>

                    <div className="w-full px-4 py-4 mb-6 border bg-sky-50 border-sky-200 rounded-2xl">
                      <h2 className="text-xl font-bold text-sky-900">{rm.ideaTitle}</h2>
                    </div>

                    <div className="flex flex-col w-full gap-8 lg:flex-row">
                      {/* Left: Strategic Overview */}
                      <div className="lg:w-1/3 shrink-0">
                        <div className="sticky p-6 bg-white border border-t-4 border-gray-200 shadow-lg rounded-3xl top-4 border-t-sky-500">
                          <h3 className="mb-4 text-lg font-bold text-gray-900">Strategic Overview</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-100">
                              <span className="text-gray-500">Created</span>
                              <span className="font-medium text-right text-gray-900">{new Date(rm.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50 rounded-xl">
                                <div className="p-2 text-green-600 bg-green-100 rounded-lg"><Check className="w-4 h-4"/></div>
                                <div className="min-w-0">
                                  <div className="text-xs text-gray-500">Tasks</div>
                                  <div className="text-sm font-semibold text-gray-900 truncate">{totalTasks}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50 rounded-xl">
                                <div className="p-2 rounded-lg bg-sky-100 text-sky-600"><CheckCircle2 className="w-4 h-4"/></div>
                                <div className="min-w-0">
                                  <div className="text-xs text-gray-500">Completed</div>
                                  <div className="text-sm font-semibold text-gray-900 truncate">{completedTasks}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Timeline */}
                      <div className="flex-1 space-y-6">
                        {groupTasks(rm.tasks).map((phase, i) => (
                          <div key={i} className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-l-4 border-gray-100 shadow-xl rounded-3xl group border-l-transparent hover:border-l-sky-500">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                              <Target className="w-32 h-32" />
                            </div>
                            <h4 className="pb-3 mb-5 text-xl font-bold text-gray-800 border-b border-gray-100">{phase.title}</h4>
                            <ul className="relative z-10 space-y-4">
                              {phase.tasks.map((task, t) => (
                                <li key={task._id || t} className="relative z-10 flex items-start gap-4 group/item">
                                  <button onClick={() => handleTaskToggle(rm._id, task._id, task.isDone, 'saved')} className={`mt-0.5 p-1 rounded-full border shadow-sm shrink-0 transition-all cursor-pointer ${task.isDone ? 'bg-green-100 border-green-500 text-green-600 hover:bg-green-200' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-sky-400 hover:text-sky-500'}`}>
                                    <CheckCircle2 className={`w-4 h-4 ${task.isDone ? 'text-green-600' : ''}`} />
                                  </button>
                                  <span className={`text-sm leading-relaxed pt-0.5 transition-all ${task.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {task.description}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* --- CHAT TAB --- */}
        {activeTab === 'chat' && (
          <div className="flex h-[600px] border border-gray-100 rounded-lg overflow-hidden relative shadow-sm">
            {/* Sidebar for Chat History */}
            <div className="flex flex-col w-1/3 h-full overflow-hidden bg-white border-r">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-bold text-gray-800">Chat History</h3>
                <button onClick={handleNewChat} className="p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100" title="New Chat">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <p className="mt-6 text-sm text-center text-gray-500">No previous chats</p>
                ) : (
                  chatSessions.map(session => (
                    <button 
                      key={session._id} 
                      onClick={() => loadChatSession(session._id)}
                      className={`block w-full text-left px-4 py-3 text-sm rounded-lg mb-1 truncate transition-colors ${currentSessionId === session._id ? 'bg-blue-500 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                      title={session.title}
                    >
                      {session.title}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Chat Content */}
            <div className="w-2/3 flex flex-col h-[600px]">
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-4 rounded-xl shadow-sm whitespace-pre-wrap ${m.isBot ? 'bg-white border border-gray-100 text-gray-800' : 'bg-sky-600 text-white'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 p-4 text-gray-800 bg-white border border-gray-100 shadow-sm rounded-xl">
                      <LoadingSpinner size="sm" /> Thinking...
                    </div>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendChat} className="flex gap-2 p-4 bg-white border-t">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder="Ask about a business idea..." 
                  className="flex-1 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={loading}
                />
                <button disabled={loading} type="submit" className="bg-sky-600 text-white p-3 rounded-lg hover:bg-sky-700 flex items-center justify-center min-w-[50px] transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

