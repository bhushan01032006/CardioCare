import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Wind, Info, Loader2, Stethoscope, User, Flame, Droplets, Shield, Clock, Brain, ChevronRight, ArrowLeft, FileText, Scale, Ruler, LogOut, Lock, Calendar, FileBarChart, ShieldCheck, AlertCircle } from 'lucide-react';
import { InputGroup } from './components/InputGroup';
import { RiskResultDisplay } from './components/RiskResultDisplay';
import { Logo } from './components/Logo';
import { AuthModal } from './components/AuthModal';
import { assessHeartRisk } from './services/geminiService';
import { PatientData, AssessmentResult, SavedReport } from './types';

const INITIAL_DATA: PatientData = {
  name: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  bloodGroup: '',
  cholesterol: '',
  bloodPressure: '',
  heartRate: '',
  diabetes: false,
  smoking: false,
  symptoms: '',
};

type ViewState = 'landing' | 'assessment' | 'result' | 'about' | 'reports';

interface UserProfile {
  name: string;
  email: string;
}

// --- Component: ProfileMenu ---
// Extracted to ensure stable state and event handling
interface ProfileMenuProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  onLogout: () => void;
  onViewReports: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, theme, onLogout, onViewReports }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ml-2 sm:ml-6 pl-2 sm:pl-6 ${theme === 'dark' ? 'border-l border-white/10' : 'border-l border-slate-200'}`} ref={menuRef}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center gap-2 sm:gap-3 focus:outline-none group"
       >
         <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-md ring-2 ring-white/10 group-hover:ring-blue-400 transition-all">
            {user.name.charAt(0).toUpperCase()}
         </div>
         <span className={`text-sm font-medium hidden sm:block ${theme === 'dark' ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
            {user.name}
         </span>
       </button>
       
       {isOpen && (
         <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 py-2 z-50 animate-fade-in-up origin-top-right">
             <div className="px-5 py-3 border-b border-slate-50 mb-1">
                 <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                 <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
             
             <button 
                onClick={() => {
                    setIsOpen(false);
                    onViewReports();
                }}
                className="w-full text-left px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors md:hidden"
             >
                <FileBarChart className="w-4 h-4 text-blue-500" />
                View Reports
             </button>

             <button 
                onClick={() => {
                    setIsOpen(false);
                    onLogout();
                }}
                className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
             >
                <LogOut className="w-4 h-4" />
                Logout
             </button>
         </div>
       )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [data, setData] = useState<PatientData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Load reports when view changes to reports or user logs in
  useEffect(() => {
    if (user && view === 'reports') {
        const allReports = JSON.parse(localStorage.getItem('cardioCare_reports') || '{}');
        const userReports = allReports[user.email] || [];
        // Sort by date descending
        userReports.sort((a: SavedReport, b: SavedReport) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSavedReports(userReports);
    }
  }, [user, view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setData(prev => ({ ...prev, [name]: checked }));
    } else {
       setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (name: keyof PatientData) => {
    setData(prev => ({ ...prev, [name]: !prev[name as keyof PatientData] }));
  };

  const validateForm = (): boolean => {
    if (!data.name || !data.age || !data.gender || !data.height || !data.weight || !data.bloodGroup || !data.cholesterol || !data.bloodPressure || !data.heartRate) {
      setError("Please complete all required fields.");
      return false;
    }
    return true;
  };

  const saveReport = (assessment: AssessmentResult, patientData: PatientData) => {
    if (!user) return;

    const newReport: SavedReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        data: patientData,
        result: assessment
    };

    const allReports = JSON.parse(localStorage.getItem('cardioCare_reports') || '{}');
    const userReports = allReports[user.email] || [];
    
    // Add to beginning of array
    userReports.unshift(newReport);
    
    allReports[user.email] = userReports;
    localStorage.setItem('cardioCare_reports', JSON.stringify(allReports));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const assessment = await assessHeartRisk(data);
      setResult(assessment);
      
      // Save report if user is logged in
      if (user) {
        saveReport(assessment, data);
      }
      
      setView('result');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setData({ ...INITIAL_DATA, name: user?.name || '' });
    setError(null);
    setView('landing');
  };

  const handleRetake = () => {
    setResult(null);
    setData({ ...INITIAL_DATA, name: user?.name || '' });
    setError(null);
    setView('assessment');
  };

  const handleViewHistoryReport = (report: SavedReport) => {
      setData(report.data);
      setResult(report.result);
      setView('result');
  };

  // --- Auth Handlers ---
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    // Auto-fill name if signing up
    setData(prev => ({ ...prev, name: userData.name }));
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    setData(INITIAL_DATA);
    setIsAuthModalOpen(false); // Ensure modal is closed
    setSavedReports([]);
  };

  const handleStartAssessment = () => {
    if (user) {
        // Clear data when starting a new assessment from landing to be safe
        setData({ ...INITIAL_DATA, name: user.name });
        setView('assessment');
    } else {
        // If not logged in, trigger signup flow
        handleOpenAuth('signup');
    }
  };

  // --- VIEW: LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black overflow-hidden relative font-sans text-white flex flex-col">
        
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialMode={authMode} 
            onAuthSuccess={handleAuthSuccess}
        />

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl opacity-30"></div>

        {/* Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto w-full">
          <Logo variant="dark" />
          
          <div className="flex items-center gap-2 sm:gap-6">
              <button 
                onClick={() => setView('about')}
                className={`${user ? 'block' : 'hidden md:block'} text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors`}
              >
                About Us
              </button>

              <button 
                onClick={() => user ? setView('reports') : handleOpenAuth('login')}
                className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                View Reports
              </button>
              
              {user ? (
                 <ProfileMenu 
                    user={user} 
                    theme="dark" 
                    onLogout={handleLogout} 
                    onViewReports={() => setView('reports')} 
                 />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-6">
                    <button 
                        onClick={() => handleOpenAuth('login')}
                        className="text-xs sm:text-sm font-bold text-white hover:text-blue-300 transition-colors px-2 py-1.5 sm:px-4 sm:py-2"
                    >
                        Log In
                    </button>
                    <button 
                        onClick={() => handleOpenAuth('signup')}
                        className="text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-blue-50 transition-colors px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full shadow-lg shadow-blue-500/20 active:scale-95 duration-200"
                    >
                        Sign Up
                    </button>
                </div>
              )}
          </div>
        </nav>

        {/* Hero Content */}
        <main className="relative z-10 flex flex-col items-center justify-center flex-grow px-4 text-center max-w-5xl mx-auto w-full">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Advanced Cardiac Risk Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-sm leading-tight">
            Predicting Heart Health <br /> with Precision
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mb-12 leading-relaxed">
            Assess your cardiovascular risk in seconds using our advanced algorithmic model. 
            Secure, private, and designed for early detection awareness.
          </p>

          <button 
            onClick={handleStartAssessment}
            className="group relative inline-flex items-center justify-center px-8 py-4 sm:px-10 sm:py-5 text-lg font-bold text-white transition-all duration-300 bg-blue-600 rounded-full overflow-hidden hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] active:scale-95"
          >
             <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
             <span className="relative flex items-center gap-2">
               Check Heart Health
               <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </span>
          </button>
          
          {!user && (
            <p className="mt-4 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Sign in required to access assessment tool
            </p>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl text-left">
            {[
              { icon: Clock, title: "Instant Results", desc: "Get your risk profile in under 30 seconds." },
              { icon: Brain, title: "Smart Algorithms", desc: "Uses medical data points for accurate estimation." },
              { icon: Shield, title: "100% Private", desc: "No personal data is stored on our servers." }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>

        </main>
        
        <footer className="relative z-10 py-8 text-center text-sm text-slate-500">
          © 2026 TechBuilders. All Rights Reserved.
        </footer>
      </div>
    );
  }

  // --- VIEW: ABOUT US ---
  if (view === 'about') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialMode={authMode} 
            onAuthSuccess={handleAuthSuccess}
        />
        
        <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto border-b border-slate-800 w-full">
           <div className="cursor-pointer" onClick={() => setView('landing')}>
             <Logo variant="dark" />
           </div>
           
           <div className="flex items-center gap-2 sm:gap-6">
                <button 
                    onClick={() => setView('landing')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Home</span>
                </button>
                
                <button 
                  onClick={() => user ? setView('reports') : handleOpenAuth('login')}
                  className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  View Reports
                </button>

                {user ? (
                    <ProfileMenu 
                        user={user} 
                        theme="dark" 
                        onLogout={handleLogout} 
                        onViewReports={() => setView('reports')} 
                    />
                ) : (
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-6 border-l border-slate-700">
                         <button onClick={() => handleOpenAuth('login')} className="text-xs sm:text-sm font-bold text-white hover:text-blue-300 px-2 sm:px-3">Log In</button>
                         <button onClick={() => handleOpenAuth('signup')} className="text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">Sign Up</button>
                    </div>
                )}
           </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-16 animate-fade-in-up flex-grow w-full">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Empowering Heart Health
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed mb-12">
                CardioCare is designed to bridge the gap between complex medical data and personal health awareness. Our goal is to provide a quick, accessible, and private way for individuals to assess their cardiovascular risk factors.
            </p>
            
            <div className="space-y-12">
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">How It Works</h2>
                    </div>
                    <p className="text-slate-400 leading-relaxed pl-14">
                        Our application utilizes a specialized algorithmic model trained on extensive cardiovascular health datasets. By analyzing key vital signs—such as age, blood pressure, cholesterol levels, and lifestyle factors like smoking or diabetes—we calculate a probabilistic risk score. This score helps identify potential warning signs early, allowing for timely medical intervention.
                    </p>
                </section>

                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Privacy & Security</h2>
                    </div>
                    <p className="text-slate-400 leading-relaxed pl-14">
                        Your health data is sensitive, and we treat it with the utmost respect. CardioCare operates entirely in your browser session. We do not store, record, or transmit your personal health information to any external servers. Once you close this tab, your data is wiped.
                    </p>
                </section>
                
                 <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Info className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Medical Disclaimer</h2>
                    </div>
                     <div className="pl-14 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <p className="text-slate-300 text-sm leading-relaxed">
                            This tool is for informational and educational purposes only. It is <strong>not a medical diagnosis</strong> and should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding any medical condition or before making changes to your diet, medication, or exercise routine.
                        </p>
                    </div>
                </section>
            </div>
        </main>
        
        <footer className="py-8 text-center text-sm text-slate-600 border-t border-slate-800">
          © 2026 TechBuilders. All Rights Reserved.
        </footer>
      </div>
    );
  }
  
  // --- VIEW: REPORTS ---
  if (view === 'reports') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
         {/* Simple Light Nav */}
         <nav className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-4 flex items-center justify-between sticky top-0 z-20">
             <div className="cursor-pointer" onClick={() => setView('landing')}>
                 <Logo variant="light" />
             </div>
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('landing')}
                  className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                {user && (
                    <ProfileMenu 
                        user={user} 
                        theme="light" 
                        onLogout={handleLogout} 
                        onViewReports={() => setView('reports')} 
                    />
                )}
             </div>
         </nav>

         <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex-grow animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Health Reports</h1>
                    <p className="text-slate-500 mt-1">History of your risk assessments.</p>
                </div>
                <button 
                  onClick={() => setView('assessment')}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Activity className="w-4 h-4" />
                    New Assessment
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[300px]">
                {savedReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Reports Found</h3>
                        <p className="text-slate-500 max-w-sm">
                            You haven't completed any assessments yet. Start a new assessment to see your results here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {savedReports.map((report) => {
                            const date = new Date(report.date);
                            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            
                            let riskColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                            let iconClass = "bg-emerald-100 text-emerald-600";
                            
                            if (report.result.riskLevel === 'High') {
                                riskColorClass = "bg-red-50 text-red-700 border-red-100";
                                iconClass = "bg-red-100 text-red-600";
                            } else if (report.result.riskLevel === 'Medium') {
                                riskColorClass = "bg-amber-50 text-amber-700 border-amber-100";
                                iconClass = "bg-amber-100 text-amber-600";
                            }

                            return (
                                <div 
                                    key={report.id}
                                    onClick={() => handleViewHistoryReport(report)}
                                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                                            {report.result.riskLevel === 'High' ? <Activity className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Cardiovascular Risk Assessment</h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formattedDate}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>Score: {report.result.riskScore}/100</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pl-16 sm:pl-0">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${riskColorClass}`}>
                                            {report.result.riskLevel} Risk
                                        </div>
                                        <button className="text-slate-400 hover:text-blue-600 transition-colors p-2">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
         </main>
         <footer className="py-8 text-center text-sm text-slate-400">
            © 2026 TechBuilders. All Rights Reserved.
         </footer>
      </div>
    );
  }

  // --- VIEW: RESULTS ---
  if (view === 'result' && result) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col">
         <header className="mb-8 max-w-4xl mx-auto w-full flex items-center justify-between animate-fade-in-down">
          <div className="cursor-pointer" onClick={() => setView('landing')}>
            <Logo variant="light" />
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
             <button 
                onClick={() => setView('landing')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
             >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
             </button>

             {user && (
                 <div className="hidden sm:block">
                     <ProfileMenu 
                        user={user} 
                        theme="light" 
                        onLogout={handleLogout} 
                        onViewReports={() => setView('reports')} 
                    />
                 </div>
             )}
             {!user && (
                 <button onClick={handleRetake} className="hidden sm:block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                   Retake Test
                 </button>
             )}
          </div>
        </header>
        <RiskResultDisplay result={result} data={data} onReset={handleRetake} />
        
        <footer className="py-6 text-center text-sm text-slate-400 mt-auto">
          © 2026 TechBuilders. All Rights Reserved.
        </footer>
      </div>
    );
  }

  // --- VIEW: ASSESSMENT FORM ---
  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-grow">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 relative z-50">
            <div className="cursor-pointer" onClick={handleReset}>
                <Logo variant="light" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                 {user && (
                    <ProfileMenu 
                        user={user} 
                        theme="light" 
                        onLogout={handleLogout} 
                        onViewReports={() => setView('reports')} 
                    />
                 )}
                 <button 
                    onClick={handleReset}
                    className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-slate-800 transition-colors text-xs sm:text-sm font-medium bg-slate-100 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none"
                 >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Back to Home</span>
                    <span className="sm:hidden">Home</span>
                 </button>
            </div>
        </div>

        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Patient Assessment
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">
            Please enter the vitals accurately for the best prediction.
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100 relative">
           
           <div className="p-6 sm:p-10 relative z-10">
             <form onSubmit={handleSubmit} className="space-y-8">
               
               {/* Basic Vitals Group */}
               <div className="space-y-6">
                 <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                       <InputGroup 
                        label="Full Name" 
                        name="name" 
                        value={data.name} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Rahul Sharma" 
                        required 
                      />
                    </div>
                    <InputGroup 
                      label="Age" 
                      name="age" 
                      type="number" 
                      value={data.age} 
                      onChange={handleInputChange} 
                      placeholder="e.g. 45" 
                      required 
                    />
                    <InputGroup 
                      label="Gender" 
                      name="gender" 
                      value={data.gender} 
                      onChange={handleInputChange} 
                      options={['Male', 'Female']}
                      required 
                    />
                 </div>
               </div>

               {/* Physical Stats Group */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <Ruler className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Physical Stats</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <InputGroup 
                        label="Height" 
                        name="height" 
                        type="number" 
                        value={data.height} 
                        onChange={handleInputChange} 
                        placeholder="175" 
                        suffix="cm"
                        required 
                      />
                      <InputGroup 
                        label="Weight" 
                        name="weight" 
                        type="number" 
                        value={data.weight} 
                        onChange={handleInputChange} 
                        placeholder="70" 
                        suffix="kg"
                        required 
                      />
                      <InputGroup 
                        label="Blood Group" 
                        name="bloodGroup" 
                        value={data.bloodGroup} 
                        onChange={handleInputChange} 
                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                        required 
                      />
                  </div>
               </div>

               {/* Clinical Data Group */}
               <div className="space-y-6">
                 <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Stethoscope className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Clinical Metrics</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <InputGroup 
                      label="Systolic BP" 
                      name="bloodPressure" 
                      type="number" 
                      value={data.bloodPressure} 
                      onChange={handleInputChange} 
                      placeholder="120" 
                      suffix="mmHg"
                      required 
                    />
                    <InputGroup 
                      label="Heart Rate" 
                      name="heartRate" 
                      type="number" 
                      value={data.heartRate} 
                      onChange={handleInputChange} 
                      placeholder="72" 
                      suffix="bpm"
                      required 
                    />
                    <InputGroup 
                      label="Cholesterol" 
                      name="cholesterol" 
                      type="number" 
                      value={data.cholesterol} 
                      onChange={handleInputChange} 
                      placeholder="190" 
                      suffix="mg/dL"
                      required 
                    />
                 </div>
               </div>

                {/* Lifestyle Toggles */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Lifestyle & History</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Diabetes Card */}
                    <div 
                        onClick={() => handleToggle('diabetes')}
                        className={`group cursor-pointer relative overflow-hidden rounded-xl border-2 transition-all duration-300 p-4 flex items-center gap-4 ${data.diabetes ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${data.diabetes ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <Droplets className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-sm ${data.diabetes ? 'text-blue-900' : 'text-slate-700'}`}>Diabetic History</h4>
                            <p className="text-xs text-slate-500">Diagnosed Type 1 or 2</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${data.diabetes ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                             {data.diabetes && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    </div>

                    {/* Smoking Card */}
                    <div 
                        onClick={() => handleToggle('smoking')}
                        className={`group cursor-pointer relative overflow-hidden rounded-xl border-2 transition-all duration-300 p-4 flex items-center gap-4 ${data.smoking ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 hover:border-red-200'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${data.smoking ? 'bg-red-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <Flame className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-sm ${data.smoking ? 'text-red-900' : 'text-slate-700'}`}>Smoker</h4>
                            <p className="text-xs text-slate-500">Regular tobacco usage</p>
                        </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${data.smoking ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                             {data.smoking && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    </div>
                 </div>
                </div>

                {/* Symptoms Group */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Symptoms</h3>
                 </div>
                 <div>
                    <label htmlFor="symptoms" className="text-sm font-semibold text-slate-600 block mb-2">
                      Describe your current symptoms (if any)
                    </label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      value={data.symptoms}
                      onChange={(e) => setData(prev => ({ ...prev, symptoms: e.target.value }))}
                      placeholder="e.g. Chest pain, shortness of breath, dizziness..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium shadow-sm min-h-[100px] resize-y"
                    />
                 </div>
                </div>

               {error && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-pulse">
                   <Info className="w-5 h-5 flex-shrink-0" />
                   <p className="text-sm font-medium">{error}</p>
                 </div>
               )}

               <div className="pt-4">
                 <button
                   type="submit"
                   disabled={loading}
                   className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${loading ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                 >
                   {loading ? (
                     <>
                       <Loader2 className="w-6 h-6 animate-spin" />
                       Processing...
                     </>
                   ) : (
                     <>
                       Analyze Risk Profile
                       <Activity className="w-5 h-5" />
                     </>
                   )}
                 </button>
               </div>

             </form>
           </div>
        </div>
      </div>
      
      <footer className="py-8 text-center text-sm text-slate-400">
         © 2026 TechBuilders. All Rights Reserved.
      </footer>
    </div>
  );
}