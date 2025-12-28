import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface BaseCV {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  location: string;
  summary: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

interface SelectionState {
  resume: boolean;
  coverLetter: boolean;
  qa: boolean;
}

interface TailoredContent {
  atsResume?: {
    summary: string;
    skills: string[];
    experience: Experience[];
  };
  coverLetter?: string;
  questionAnswers?: Array<{ question: string; answer: string }>;
}

type ViewState = 'home' | 'jobs' | 'profile';
type AIRole = 'coach' | 'recruiter' | 'manager';

// --- Icons ---
const Icons = {
  Home: ({ active }: { active?: boolean }) => <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Briefcase: ({ active }: { active?: boolean }) => <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  User: ({ active }: { active?: boolean }) => <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Sparkles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Printer: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Document: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Link: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Pencil: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Key: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
};

// --- Mock API / Service Layer ---
const DEFAULT_CV: BaseCV = {
  fullName: "Alex Chen",
  email: "alex.chen@example.com",
  phone: "+1 (555) 0123-4567",
  linkedin: "linkedin.com/in/alexchen",
  website: "",
  location: "San Francisco, CA",
  summary: "Experienced Product Manager with a background in Computer Science...",
  skills: ["Product Strategy", "Agile", "React", "TypeScript", "User Research"],
  languages: ["English", "Mandarin"],
  certifications: ["PMP", "CSM"],
  education: [
    { id: '1', school: 'Stanford University', degree: 'MS Computer Science', year: '2019' }
  ],
  experience: [
    { id: '1', company: 'TechCorp', role: 'Senior Product Manager', duration: '2020 - Present', description: 'Leading the core platform team...' }
  ],
  projects: []
};

// --- Helpers ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const getRoleInstruction = (role: AIRole) => {
  switch (role) {
    case 'recruiter':
      return "You are a Senior Technical Recruiter. Be critical, focus on keywords, impact metrics, and brevity. Prioritize clarity over fluff.";
    case 'manager':
      return "You are a Hiring Manager. Focus on results, leadership potential, and problem-solving abilities. Cut through the jargon.";
    case 'coach':
    default:
      return "You are an Elite Career Coach. Be supportive but strategic. Focus on narrative, personal branding, and maximizing the candidate's potential.";
  }
};

// --- Components ---

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "" }: any) => {
  const baseStyle = "px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 justify-center transform active:scale-95";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", multiline = false }: any) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>}
    {multiline ? (
      <textarea
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

// --- Profile / Settings View ---

const SettingsView = ({ 
  apiKey, 
  setApiKey, 
  aiRole, 
  setAiRole 
}: { 
  apiKey: string; 
  setApiKey: (key: string) => void;
  aiRole: AIRole;
  setAiRole: (role: AIRole) => void;
}) => {
  const [showKey, setShowKey] = useState(false);

  const ListItem = ({ label, value, onClick, isToggle, toggleValue, setToggleValue }: any) => (
    <div 
      className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
      onClick={onClick}
    >
      <span className="text-slate-900 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-slate-500 text-sm">{value}</span>}
        {isToggle && (
           <div 
             className={`w-12 h-7 rounded-full transition-colors relative ${toggleValue ? 'bg-blue-600' : 'bg-slate-200'}`}
             onClick={(e) => { e.stopPropagation(); setToggleValue(!toggleValue); }}
           >
             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggleValue ? 'left-6' : 'left-1'}`} />
           </div>
        )}
        {!isToggle && <Icons.ChevronRight />}
      </div>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
     <div className="px-4 py-2 mt-6 mb-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
     </div>
  );

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 px-4">
         <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings & Profile</h2>
         <button className="text-blue-600 font-semibold">Done</button>
      </div>

      {/* Profile Header */}
      <div className="bg-white p-4 mb-6 flex items-center gap-4 border-y border-slate-200 md:rounded-xl md:border md:shadow-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
           <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <div>
           <h3 className="text-xl font-bold text-slate-900">Alex Chen</h3>
           <p className="text-slate-500">Job Seeker</p>
        </div>
      </div>

      {/* AI Configuration */}
      <SectionHeader title="AI Configuration" />
      <div className="bg-white border-y border-slate-200 md:rounded-xl md:border md:shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-900 font-medium flex items-center gap-2"><Icons.Key /> Gemini API Key</span>
              <button onClick={() => setShowKey(!showKey)} className="text-xs text-blue-600 font-semibold">
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <input 
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="mt-2">
               <div className="flex justify-between text-xs text-slate-500 mb-1">
                 <span>Token Usage Estimate</span>
                 <span>Free Tier Active</span>
               </div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[15%]" />
               </div>
            </div>
         </div>
         <div className="p-4 flex justify-between items-center">
             <span className="text-slate-900 font-medium">AI Persona</span>
             <select 
               value={aiRole}
               onChange={(e) => setAiRole(e.target.value as AIRole)}
               className="bg-slate-50 border-none text-slate-700 text-sm font-semibold rounded-lg focus:ring-0 cursor-pointer text-right"
             >
               <option value="coach">Elite Career Coach</option>
               <option value="recruiter">Technical Recruiter</option>
               <option value="manager">Hiring Manager</option>
             </select>
         </div>
      </div>

      {/* Subscription */}
      <SectionHeader title="Subscription" />
      <div className="bg-white border-y border-slate-200 md:rounded-xl md:border md:shadow-sm overflow-hidden flex items-center justify-between p-4">
         <span className="font-bold text-slate-900">Premium Plan</span>
         <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
            <span className="text-blue-600 text-sm font-semibold cursor-pointer">Manage</span>
         </div>
      </div>

      {/* Automation */}
      <SectionHeader title="Automation Preferences" />
      <div className="bg-white border-y border-slate-200 md:rounded-xl md:border md:shadow-sm overflow-hidden">
         <ListItem label="Job Alerts Frequency" value="Daily" />
         <ListItem label="Preferred Locations" value="SF, NY" isToggle={true} toggleValue={true} setToggleValue={() => {}} />
      </div>

      {/* Privacy */}
      <SectionHeader title="Privacy & Security" />
      <div className="bg-white border-y border-slate-200 md:rounded-xl md:border md:shadow-sm overflow-hidden">
         <ListItem label="Data Usage for AI Improvement" isToggle={true} toggleValue={false} setToggleValue={() => {}} />
         <ListItem label="Account Privacy" isToggle={true} toggleValue={true} setToggleValue={() => {}} />
      </div>

       {/* General */}
      <SectionHeader title="General" />
      <div className="bg-white border-y border-slate-200 md:rounded-xl md:border md:shadow-sm overflow-hidden">
         <ListItem label="Notifications" />
         <ListItem label="Help & Support" />
         <ListItem label="About" />
      </div>

      <div className="mt-8 px-4">
         <button className="w-full py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors">
           Log Out
         </button>
         <p className="text-center text-xs text-slate-400 mt-4">Version 2.4.0 (Build 2024)</p>
      </div>

    </div>
  );
};

// --- BaseCVView Components ---

const SectionCard = ({ title, onEdit, children, isEditing }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {onEdit && !isEditing && (
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Icons.Pencil />
          </button>
        )}
        {isEditing && (
          <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Done
          </button>
        )}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const BaseCVView = ({ cv, setCv, apiKey }: { cv: BaseCV; setCv: (cv: BaseCV) => void; apiKey: string }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use provided key or fallback to env
    const key = apiKey || process.env.API_KEY || "";
    if (!key) {
      alert("Please configure your API Key in the Profile tab first.");
      return;
    }

    const ai = new GoogleGenAI({ apiKey: key });

    setIsParsing(true);
    try {
      const base64Data = await fileToBase64(file);
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: file.type, data: base64Data } },
              { text: "Extract the resume data. Be extremely comprehensive. Include every small detail." }
            ],
          },
        ],
        config: {
          systemInstruction: "You are a precise data extraction engine. Extract resume data from the uploaded document into the specified JSON structure. Be thorough and preserve original wording. If a field is missing, leave it empty.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              website: { type: Type.STRING },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              languages: { type: Type.ARRAY, items: { type: Type.STRING } },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              education: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: {
                     id: { type: Type.STRING },
                     school: { type: Type.STRING },
                     degree: { type: Type.STRING },
                     year: { type: Type.STRING }
                  }
                } 
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.STRING },
                  }
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                  }
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(result.text || "{}");
      
      const hydrate = (arr: any[]) => (arr || []).map(item => ({ ...item, id: Date.now().toString() + Math.random().toString() }));
      
      setCv({
        ...DEFAULT_CV,
        ...parsed,
        experience: hydrate(parsed.experience),
        education: hydrate(parsed.education),
        projects: hydrate(parsed.projects),
      });

    } catch (err) {
      console.error(err);
      alert("Failed to parse file. Ensure your API Key is valid.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleEdit = (section: string) => {
    setEditingSection(editingSection === section ? null : section);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="mb-8 text-center pt-8">
        <h2 className="text-2xl font-bold text-slate-900">Your Foundational CV</h2>
        <p className="text-slate-500 mt-2">This content will be used as the basis for tailored job applications.</p>
      </div>

      {/* Upload Button */}
      <div className="mb-8">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,image/*,.txt,.docx"
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all bg-white shadow-sm"
        >
          {isParsing ? (
             <div className="flex items-center gap-2">
               <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
               <span>Extracting Data...</span>
             </div>
          ) : (
             <div className="flex items-center gap-2 font-medium">
               <Icons.Upload /> Upload PDF/Word CV
             </div>
          )}
        </button>
      </div>

      {/* Personal Details */}
      <SectionCard 
        title={null} 
        isEditing={editingSection === 'personal'}
      >
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
               <Icons.User />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
                <p className="text-sm text-slate-500">Essential contact info & summary</p>
             </div>
           </div>
           <button onClick={() => toggleEdit('personal')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
              {editingSection === 'personal' ? 'Done' : 'Edit'}
           </button>
        </div>
        
        {editingSection === 'personal' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="Full Name" value={cv.fullName} onChange={(v:string) => setCv({...cv, fullName: v})} />
               <Input label="Email" value={cv.email} onChange={(v:string) => setCv({...cv, email: v})} />
               <Input label="Phone" value={cv.phone} onChange={(v:string) => setCv({...cv, phone: v})} />
               <Input label="Location" value={cv.location} onChange={(v:string) => setCv({...cv, location: v})} />
               <Input label="LinkedIn" value={cv.linkedin} onChange={(v:string) => setCv({...cv, linkedin: v})} />
               <Input label="Website" value={cv.website} onChange={(v:string) => setCv({...cv, website: v})} />
             </div>
             <Input label="Summary" value={cv.summary} onChange={(v:string) => setCv({...cv, summary: v})} multiline />
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
               {cv.fullName && <p><span className="font-bold text-slate-900">Full Name:</span> {cv.fullName}</p>}
               {cv.email && <p><span className="font-bold text-slate-900">Email:</span> {cv.email}</p>}
               {cv.phone && <p><span className="font-bold text-slate-900">Phone:</span> {cv.phone}</p>}
               {cv.linkedin && <p><span className="font-bold text-slate-900">LinkedIn:</span> <a href={cv.linkedin} target="_blank" className="text-blue-600 hover:underline">{cv.linkedin.replace(/^https?:\/\//, '')}</a></p>}
               {cv.website && <p><span className="font-bold text-slate-900">Website:</span> {cv.website}</p>}
               {cv.location && <p><span className="font-bold text-slate-900">Location:</span> {cv.location}</p>}
             </div>
             {cv.summary && (
               <div className="mt-4 pt-4 border-t border-slate-100">
                 <span className="font-bold text-slate-900 block mb-1">Summary:</span>
                 <p className="leading-relaxed text-slate-600">{cv.summary}</p>
               </div>
             )}
          </div>
        )}
      </SectionCard>

      {/* Work Experience */}
      <SectionCard 
         title="Work Experience" 
         onEdit={() => toggleEdit('experience')} 
         isEditing={editingSection === 'experience'}
      >
        <div className="space-y-8">
          {cv.experience.map((exp, idx) => (
             <div key={exp.id || idx} className="relative group">
                {editingSection === 'experience' ? (
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-4">
                      <div className="flex justify-between">
                         <h4 className="font-bold text-xs uppercase text-slate-400">Role {idx+1}</h4>
                         <button onClick={() => setCv({...cv, experience: cv.experience.filter(e => e.id !== exp.id)})} className="text-red-500 hover:text-red-600 text-xs">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Role" value={exp.role} onChange={(v:string) => setCv({...cv, experience: cv.experience.map(e => e.id === exp.id ? {...e, role: v} : e)})} />
                        <Input placeholder="Company" value={exp.company} onChange={(v:string) => setCv({...cv, experience: cv.experience.map(e => e.id === exp.id ? {...e, company: v} : e)})} />
                      </div>
                      <Input placeholder="Duration" value={exp.duration} onChange={(v:string) => setCv({...cv, experience: cv.experience.map(e => e.id === exp.id ? {...e, duration: v} : e)})} />
                      <Input placeholder="Description" multiline value={exp.description} onChange={(v:string) => setCv({...cv, experience: cv.experience.map(e => e.id === exp.id ? {...e, description: v} : e)})} />
                   </div>
                ) : (
                   <div>
                     <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-slate-900 text-base">{exp.role}</h4>
                        {/* Individual Edit Icon if needed, but we use section edit for simplicity matching screenshot */}
                     </div>
                     <div className="text-sm text-slate-500 mb-2">{exp.company} • {exp.duration}</div>
                     <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                     {idx < cv.experience.length - 1 && <div className="h-px bg-slate-100 my-6" />}
                   </div>
                )}
             </div>
          ))}
          
          {editingSection === 'experience' && (
             <button 
                onClick={() => setCv({...cv, experience: [...cv.experience, { id: Date.now().toString(), role: '', company: '', duration: '', description: '' }]})}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2 font-semibold transition-colors"
             >
                <Icons.Plus /> Add Experience
             </button>
          )}

          {!editingSection && cv.experience.length === 0 && (
             <div className="text-center py-6 text-slate-400 italic">No experience added. Click edit to add.</div>
          )}
        </div>
      </SectionCard>

      {/* Education */}
      <SectionCard 
         title="Education" 
         onEdit={() => toggleEdit('education')} 
         isEditing={editingSection === 'education'}
      >
         <div className="space-y-6">
           {cv.education.map((edu, idx) => (
              <div key={edu.id || idx}>
                 {editingSection === 'education' ? (
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-4">
                      <div className="flex justify-between">
                         <h4 className="font-bold text-xs uppercase text-slate-400">Education {idx+1}</h4>
                         <button onClick={() => setCv({...cv, education: cv.education.filter(e => e.id !== edu.id)})} className="text-red-500 hover:text-red-600 text-xs">Remove</button>
                      </div>
                      <Input placeholder="Degree" value={edu.degree} onChange={(v:string) => setCv({...cv, education: cv.education.map(e => e.id === edu.id ? {...e, degree: v} : e)})} />
                      <Input placeholder="School/University" value={edu.school} onChange={(v:string) => setCv({...cv, education: cv.education.map(e => e.id === edu.id ? {...e, school: v} : e)})} />
                      <Input placeholder="Year" value={edu.year} onChange={(v:string) => setCv({...cv, education: cv.education.map(e => e.id === edu.id ? {...e, year: v} : e)})} />
                   </div>
                 ) : (
                   <div>
                      <h4 className="font-bold text-slate-900">{edu.degree}</h4>
                      <div className="text-sm text-slate-500">{edu.school}</div>
                      <div className="text-sm text-slate-400">{edu.year}</div>
                      {idx < cv.education.length - 1 && <div className="h-px bg-slate-100 my-4" />}
                   </div>
                 )}
              </div>
           ))}

            {editingSection === 'education' && (
             <button 
                onClick={() => setCv({...cv, education: [...cv.education, { id: Date.now().toString(), degree: '', school: '', year: '' }]})}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2 font-semibold transition-colors"
             >
                <Icons.Plus /> Add Education
             </button>
          )}
         </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard 
         title="Skills" 
         onEdit={() => toggleEdit('skills')} 
         isEditing={editingSection === 'skills'}
      >
         {editingSection === 'skills' ? (
            <Input 
               placeholder="Enter skills separated by commas..." 
               multiline 
               value={cv.skills.join(', ')} 
               onChange={(v:string) => setCv({...cv, skills: v.split(',').map(s => s.trim()).filter(Boolean)})} 
            />
         ) : (
            <div className="flex flex-wrap gap-2">
               {cv.skills.length > 0 ? cv.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-sm font-medium shadow-sm">
                     {skill}
                  </span>
               )) : <span className="text-slate-400 italic text-sm">No skills added.</span>}
            </div>
         )}
      </SectionCard>

      {/* Projects (Dynamic Section) */}
      {(cv.projects.length > 0 || editingSection === 'projects') && (
        <SectionCard 
          title="Projects" 
          onEdit={() => toggleEdit('projects')} 
          isEditing={editingSection === 'projects'}
        >
          {cv.projects.map((proj, idx) => (
             <div key={proj.id || idx} className="mb-4">
                {editingSection === 'projects' ? (
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <Input placeholder="Project Name" value={proj.name} onChange={(v:string) => setCv({...cv, projects: cv.projects.map(p => p.id === proj.id ? {...p, name: v} : p)})} />
                      <Input placeholder="Description" multiline value={proj.description} onChange={(v:string) => setCv({...cv, projects: cv.projects.map(p => p.id === proj.id ? {...p, description: v} : p)})} />
                      <button onClick={() => setCv({...cv, projects: cv.projects.filter(p => p.id !== proj.id)})} className="text-red-500 text-xs">Remove Project</button>
                   </div>
                ) : (
                   <div>
                      <h4 className="font-bold text-slate-900">{proj.name}</h4>
                      <p className="text-sm text-slate-600">{proj.description}</p>
                   </div>
                )}
             </div>
          ))}
          {editingSection === 'projects' && (
             <button onClick={() => setCv({...cv, projects: [...cv.projects, {id: Date.now().toString(), name: '', description: ''}]})} className="text-sm text-blue-600 font-semibold">+ Add Project</button>
          )}
        </SectionCard>
      )}

      {/* Additional Details (Languages & Certs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <SectionCard title="Languages" onEdit={() => toggleEdit('languages')} isEditing={editingSection === 'languages'}>
            {editingSection === 'languages' ? (
               <Input value={cv.languages.join(', ')} onChange={(v:string) => setCv({...cv, languages: v.split(',').map(s=>s.trim())})} />
            ) : (
               <div className="flex flex-wrap gap-2">{cv.languages.length ? cv.languages.map((l, i) => <span key={i} className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">{l}</span>) : <span className="text-slate-400 text-sm">None</span>}</div>
            )}
         </SectionCard>
         <SectionCard title="Certifications" onEdit={() => toggleEdit('certs')} isEditing={editingSection === 'certs'}>
            {editingSection === 'certs' ? (
               <Input value={cv.certifications.join(', ')} onChange={(v:string) => setCv({...cv, certifications: v.split(',').map(s=>s.trim())})} />
            ) : (
               <div className="space-y-1">{cv.certifications.length ? cv.certifications.map((c, i) => <div key={i} className="text-sm text-slate-700">• {c}</div>) : <span className="text-slate-400 text-sm">None</span>}</div>
            )}
         </SectionCard>
      </div>

      <div className="mt-8">
        <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all text-lg">
          Update Base CV
        </button>
      </div>
    </div>
  );
};

// --- Job Assistant View ---

const JobAssistantView = ({ cv, apiKey, aiRole }: { cv: BaseCV; apiKey: string; aiRole: AIRole }) => {
  const [jobInput, setJobInput] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  
  const [selections, setSelections] = useState<SelectionState>({
    resume: true,
    coverLetter: true,
    qa: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TailoredContent | null>(null);
  const [activeTab, setActiveTab] = useState<string>("resume");

  const getAI = () => {
    const key = apiKey || process.env.API_KEY || "";
    if (!key) {
      alert("Please configure your API Key in the Profile tab first.");
      return null;
    }
    return new GoogleGenAI({ apiKey: key });
  };

  const fetchJobDetails = async () => {
    if (!jobUrl.trim()) return;
    const ai = getAI();
    if (!ai) return;

    setIsFetchingJob(true);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: "user", 
          parts: [{ text: `ROLE: You are an expert Job Market Analyst.
          
TASK: Visit this URL and extract the following: Job Title, Company Name, Full Job Description, Key Requirements/Skills, and any other relevant details for a candidate applying to this role: ${jobUrl}` }] 
        }],
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an expert Job Market Analyst. Your goal is to scrape and summarize job postings from URLs accurately and comprehensively.",
        },
      });
      
      const text = result.text || "";
      if (text) {
        setJobInput((prev) => (prev ? prev + "\n\n" : "") + "--- IMPORTED JOB DATA ---\n" + text);
        setJobUrl(""); // Clear input on success
      }
    } catch (err) {
      console.error(err);
      alert("Could not retrieve job details. The URL might be blocked or inaccessible. Please paste the text manually.");
    } finally {
      setIsFetchingJob(false);
    }
  };

  const processApplication = async () => {
    if (!jobInput.trim()) return;
    const ai = getAI();
    if (!ai) return;

    setIsProcessing(true);
    setResults(null);

    try {
      const schemaProperties: any = {};
      
      if (selections.resume) {
        schemaProperties.atsResume = {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING, description: "Rewritten bullet points optimized for the JD keywords" },
                }
              }
            }
          }
        };
      }

      if (selections.coverLetter) {
        schemaProperties.coverLetter = { 
          type: Type.STRING, 
          description: "A professional 3-4 paragraph cover letter" 
        };
      }

      if (selections.qa) {
        schemaProperties.questionAnswers = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Question identified from the input text" },
              answer: { type: Type.STRING, description: "Professional answer based on candidate experience" },
            },
          },
        };
      }

      const roleInstruction = getRoleInstruction(aiRole);

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
            role: "user", 
            parts: [{ text: `ROLE: ${roleInstruction}

Candidate Profile:
${JSON.stringify(cv)}

Target Job & Screening Questions:
${jobInput}

TASK: Tailor the candidate's profile to the specific job description provided to maximize their chances of getting an interview. 
- The resume summary should be punchy and keyword-rich.
- Experience bullets must be rewritten to highlight achievements relevant to the JD.
- The cover letter should be persuasive and specific.
- Q&A answers should be confident and use the STAR method where applicable.` }] 
        }],
        config: {
          systemInstruction: `${roleInstruction}
          Your goal is to tailor the candidate's profile to the specific job description provided to maximize their chances of getting an interview.
          
          Guidelines:
          1. ATS Resume: Optimize experience bullet points with keywords from the Job Description. Maintain a professional, clean tone. Use strong action verbs.
          2. Cover Letter: Write a compelling, personalized narrative connecting the candidate's specific past achievements to the job requirements. 3-4 paragraphs. Do not be generic.
          3. Q&A: Identify specific questions in the input and provide confident, first-person answers based on the candidate's background.`,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 2048 }, // Enable robust thinking for high quality
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
          },
        },
      });

      const data = JSON.parse(result.text || "{}");
      setResults(data);
      
      if (data.atsResume) setActiveTab("resume");
      else if (data.coverLetter) setActiveTab("cover");
      else if (data.questionAnswers) setActiveTab("qa");

    } catch (err) {
      console.error(err);
      alert("Error generating content. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8 pt-8 pb-24">
      
      {/* Input Section - Left */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto no-print">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <Icons.Briefcase />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Job Details</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Import from URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Icons.Link />
                </div>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobDetails()}
                />
              </div>
              <Button onClick={fetchJobDetails} disabled={!jobUrl || isFetchingJob} variant="secondary" className="px-4">
                 {isFetchingJob ? (
                    <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                 ) : (
                    <Icons.Search />
                 )}
              </Button>
            </div>
          </div>
          
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Or Paste Description</label>
          <textarea
            className="flex-1 w-full p-4 border border-slate-200 rounded-xl bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 mb-6 placeholder-slate-400"
            placeholder="Paste Job Description here..."
            value={jobInput}
            onChange={(e) => setJobInput(e.target.value)}
          ></textarea>

          <div className="space-y-4 mb-6">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Assets</h3>
             <div className="space-y-2">
               <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selections.resume} onChange={e => setSelections({...selections, resume: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                  <span className="text-sm font-medium text-slate-700">ATS-Optimized Resume</span>
               </label>
               <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selections.coverLetter} onChange={e => setSelections({...selections, coverLetter: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                  <span className="text-sm font-medium text-slate-700">Cover Letter</span>
               </label>
               <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selections.qa} onChange={e => setSelections({...selections, qa: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                  <span className="text-sm font-medium text-slate-700">Screening Q&A</span>
               </label>
             </div>
          </div>

          <Button onClick={processApplication} disabled={!jobInput || isProcessing} className="w-full py-4 text-lg">
            {isProcessing ? (
               "Analyzing & Generating..."
            ) : (
              <>
                <Icons.Sparkles /> Generate Application
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section - Right */}
      <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative print:shadow-none print:border-none print:w-full print:absolute print:top-0 print:left-0 print:z-50">
        {!results ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12 text-center bg-slate-50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Icons.Document />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Ready to Assist</h3>
            <p className="max-w-xs">Paste the job description on the left to generate your tailored application materials.</p>
          </div>
        ) : (
          <>
            <div className="flex border-b border-slate-100 no-print overflow-x-auto bg-white px-2">
              {results.atsResume && (
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "resume" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ATS Resume
                </button>
              )}
              {results.coverLetter && (
                <button
                  onClick={() => setActiveTab("cover")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "cover" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cover Letter
                </button>
              )}
              {results.questionAnswers && results.questionAnswers.length > 0 && (
                <button
                  onClick={() => setActiveTab("qa")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "qa" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Q & A
                </button>
              )}
              <div className="ml-auto p-3 flex items-center">
                 <Button variant="ghost" onClick={handlePrint} className="text-sm py-1.5 px-3">
                   <Icons.Printer /> Print / PDF
                 </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-8 print:p-0 print:bg-white print:overflow-visible">
              {/* ATS Resume View */}
              {activeTab === "resume" && results.atsResume && (
                <div className="max-w-[21cm] mx-auto bg-white p-[2cm] shadow-xl shadow-slate-200/50 print:shadow-none text-black font-serif leading-relaxed min-h-[29.7cm]">
                  <header className="border-b-2 border-black pb-6 mb-8 text-center">
                    <h1 className="text-4xl font-bold uppercase tracking-widest mb-3">{cv.fullName}</h1>
                    <div className="text-sm flex flex-wrap justify-center gap-6 text-gray-800 font-sans">
                      {cv.location && <span>{cv.location}</span>}
                      {cv.email && <span>{cv.email}</span>}
                      {cv.phone && <span>{cv.phone}</span>}
                      {cv.linkedin && <span>{cv.linkedin}</span>}
                    </div>
                  </header>

                  <section className="mb-8">
                    <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1 tracking-wider">Professional Summary</h2>
                    <p className="text-sm text-justify leading-relaxed">{results.atsResume.summary}</p>
                  </section>

                  <section className="mb-8">
                    <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1 tracking-wider">Technical Skills</h2>
                    <p className="text-sm text-justify leading-relaxed">{results.atsResume.skills.join(" • ")}</p>
                  </section>

                  <section className="mb-8">
                    <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1 tracking-wider">Experience</h2>
                    <div className="space-y-6">
                      {results.atsResume.experience.map((exp: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-lg">{exp.company}</h3>
                            <span className="text-sm italic font-sans">{exp.duration}</span>
                          </div>
                          <div className="text-md font-semibold mb-2 italic text-gray-800">{exp.role}</div>
                          <p className="text-sm whitespace-pre-line text-gray-700 leading-relaxed">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {cv.education.length > 0 && (
                    <section>
                      <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1 tracking-wider">Education</h2>
                      {cv.education.map((edu, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between font-bold">
                            <span>{edu.school}</span>
                            <span className="font-normal italic text-sm">{edu.year}</span>
                          </div>
                          <div className="text-sm">{edu.degree}</div>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              )}

              {/* Cover Letter View */}
              {activeTab === "cover" && results.coverLetter && (
                <div className="max-w-[21cm] mx-auto bg-white p-[2cm] shadow-xl shadow-slate-200/50 print:shadow-none text-black font-serif leading-relaxed min-h-[29.7cm]">
                   <div className="mb-12 font-sans text-sm text-gray-600">
                     <p className="font-bold text-gray-900 text-lg mb-1">{cv.fullName}</p>
                     <p>{cv.email}</p>
                     <p>{cv.phone}</p>
                   </div>
                   <div className="mb-8 font-sans text-sm text-gray-500">
                     <p>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                   </div>
                   <div className="whitespace-pre-wrap text-base text-justify leading-loose">
                     {results.coverLetter}
                   </div>
                </div>
              )}

              {/* Q&A View */}
              {activeTab === "qa" && results.questionAnswers && (
                <div className="max-w-[21cm] mx-auto bg-white p-[2cm] shadow-xl shadow-slate-200/50 print:shadow-none text-black font-sans min-h-[29.7cm]">
                  <h1 className="text-3xl font-bold mb-8 text-center border-b pb-6">Application Questions</h1>
                  <div className="space-y-10">
                    {results.questionAnswers.map((item, idx) => (
                      <div key={idx} className="break-inside-avoid">
                        <p className="font-bold text-indigo-900 mb-3 text-lg">Q: {item.question}</p>
                        <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-indigo-600 print:border-gray-300 print:bg-transparent print:p-0 print:pl-4 text-gray-800 leading-relaxed">
                           {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #root { height: auto; overflow: visible; }
        }
      `}</style>
    </div>
  );
};

// --- Bottom Navigation ---

const BottomNavigation = ({ view, setView }: { view: ViewState, setView: (v: ViewState) => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-6 z-50 flex justify-between items-center shadow-lg no-print">
       <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${view === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
       >
         <Icons.Home active={view === 'home'} />
         <span className="text-[10px] font-semibold tracking-wide">Home</span>
       </button>
       <button 
          onClick={() => setView('jobs')}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${view === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
       >
         <Icons.Briefcase active={view === 'jobs'} />
         <span className="text-[10px] font-semibold tracking-wide">Jobs</span>
       </button>
       <button 
          onClick={() => setView('profile')}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${view === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
       >
         <Icons.User active={view === 'profile'} />
         <span className="text-[10px] font-semibold tracking-wide">Profile</span>
       </button>
    </div>
  );
};

// --- App Component ---

const App = () => {
  const [cv, setCv] = useState<BaseCV>(DEFAULT_CV);
  const [view, setView] = useState<ViewState>('home');
  const [apiKey, setApiKey] = useState<string>("");
  const [aiRole, setAiRole] = useState<AIRole>('coach');

  // Load state from LocalStorage
  useEffect(() => {
    const savedCV = localStorage.getItem("ai_job_app_cv_v2");
    if (savedCV) {
       try {
          const parsed = JSON.parse(savedCV);
          // Migrations
          if (!parsed.projects) parsed.projects = [];
          if (!parsed.languages) parsed.languages = [];
          if (!parsed.certifications) parsed.certifications = [];
          setCv(parsed);
       } catch(e) { console.error("Failed to load CV", e); }
    }

    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setApiKey(savedKey);

    const savedRole = localStorage.getItem("ai_role");
    if (savedRole) setAiRole(savedRole as AIRole);
  }, []);

  // Save state to LocalStorage
  useEffect(() => {
    localStorage.setItem("ai_job_app_cv_v2", JSON.stringify(cv));
  }, [cv]);

  useEffect(() => {
    localStorage.setItem("gemini_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("ai_role", aiRole);
  }, [aiRole]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
       <main className="px-6 pt-6">
         {view === 'home' && (
           <BaseCVView cv={cv} setCv={setCv} apiKey={apiKey} />
         )}
         {view === 'jobs' && (
           <JobAssistantView cv={cv} apiKey={apiKey} aiRole={aiRole} />
         )}
         {view === 'profile' && (
           <SettingsView apiKey={apiKey} setApiKey={setApiKey} aiRole={aiRole} setAiRole={setAiRole} />
         )}
       </main>

       <BottomNavigation view={view} setView={setView} />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);