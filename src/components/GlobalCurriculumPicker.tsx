import React, { useState, useMemo } from 'react';
import { 
  GLOBAL_COUNTRIES, 
  GLOBAL_BOARDS, 
  GLOBAL_GRADES, 
  GLOBAL_SUBJECT_CATEGORIES, 
  ALL_FLAT_SUBJECTS 
} from '../data';
import { 
  Globe, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Search, 
  SlidersHorizontal, 
  Check, 
  ChevronDown, 
  Plus, 
  Sparkles,
  X
} from 'lucide-react';

interface GlobalCurriculumPickerProps {
  country: string;
  setCountry: (val: string) => void;
  board: string;
  setBoard: (val: string) => void;
  grade: string;
  setGrade: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  compact?: boolean;
}

export const GlobalCurriculumPicker: React.FC<GlobalCurriculumPickerProps> = ({
  country,
  setCountry,
  board,
  setBoard,
  grade,
  setGrade,
  subject,
  setSubject,
  compact = false
}) => {
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePickerTab, setActivePickerTab] = useState<'country' | 'board' | 'grade' | 'subject'>('country');

  // Custom inputs
  const [customCountry, setCustomCountry] = useState('');
  const [customBoard, setCustomBoard] = useState('');
  const [customGrade, setCustomGrade] = useState('');
  const [customSubject, setCustomSubject] = useState('');

  // Filtered Countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_COUNTRIES;
    const q = searchQuery.toLowerCase();
    return GLOBAL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_BOARDS;
    const q = searchQuery.toLowerCase();
    return GLOBAL_BOARDS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.region.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Grades
  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_GRADES;
    const q = searchQuery.toLowerCase();
    return GLOBAL_GRADES.filter(
      (g) => g.name.toLowerCase().includes(q) || g.stage.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Subjects
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_SUBJECT_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return GLOBAL_SUBJECT_CATEGORIES.map((cat) => ({
      category: cat.category,
      subjects: cat.subjects.filter((s) => s.toLowerCase().includes(q))
    })).filter((cat) => cat.subjects.length > 0);
  }, [searchQuery]);

  const handleApplyCustomCountry = () => {
    if (customCountry.trim()) {
      setCountry(customCountry.trim());
      setCustomCountry('');
    }
  };

  const handleApplyCustomBoard = () => {
    if (customBoard.trim()) {
      setBoard(customBoard.trim());
      setCustomBoard('');
    }
  };

  const handleApplyCustomGrade = () => {
    if (customGrade.trim()) {
      setGrade(customGrade.trim());
      setCustomGrade('');
    }
  };

  const handleApplyCustomSubject = () => {
    if (customSubject.trim()) {
      setSubject(customSubject.trim());
      setCustomSubject('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Primary Selector Grid */}
      <div className="space-y-3 text-xs">
        {/* Country / Region */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Country / Region</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setActivePickerTab('country');
                setIsExpandedModalOpen(true);
              }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Explore All (60+)</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <select
            value={country}
            onChange={(e) => {
              if (e.target.value === 'CUSTOM_PROMPT') {
                setActivePickerTab('country');
                setIsExpandedModalOpen(true);
              } else {
                setCountry(e.target.value);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <optgroup label="Popular Global Standards">
              <option value="Global">Global Standard (Universal)</option>
              <option value="International">International (Cambridge / IB)</option>
              <option value="UK">United Kingdom (GCSE / A-Level)</option>
              <option value="US">United States (AP / State)</option>
              <option value="India">India (CBSE / ICSE / State)</option>
              <option value="Nigeria">Nigeria / West Africa (WAEC / NECO)</option>
              <option value="Canada">Canada (OSSD / Alberta)</option>
              <option value="Australia">Australia (ATAR / HSC / VCE)</option>
              <option value="South Africa">South Africa (CAPS / IEB)</option>
              <option value="Kenya">Kenya (KCSE / CBC)</option>
              <option value="Singapore">Singapore (GCE O/A)</option>
              <option value="Germany">Germany (Abitur)</option>
              <option value="France">France (Baccalauréat)</option>
              <option value="UAE">United Arab Emirates (MOE/British/American)</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Brazil">Brazil (ENEM)</option>
              <option value="Japan">Japan (MEXT)</option>
              <option value="China">China (Gaokao / AP / IB)</option>
            </optgroup>
            <optgroup label="All Global Regions">
              {GLOBAL_COUNTRIES.slice(10).map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name} ({c.region})
                </option>
              ))}
            </optgroup>
            <option value="CUSTOM_PROMPT">+ Enter Custom Country...</option>
          </select>
        </div>

        {/* Exam Board */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-500 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Curriculum & Exam Board</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setActivePickerTab('board');
                setIsExpandedModalOpen(true);
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Browse Boards</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <select
            value={board}
            onChange={(e) => {
              if (e.target.value === 'CUSTOM_PROMPT') {
                setActivePickerTab('board');
                setIsExpandedModalOpen(true);
              } else {
                setBoard(e.target.value);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <optgroup label="International & Global">
              <option value="Cambridge IGCSE / A-Level">Cambridge IGCSE / A-Level (CAIE)</option>
              <option value="IB Diploma">IB Diploma Programme (DP / MYP)</option>
              <option value="Edexcel International">Pearson Edexcel International</option>
              <option value="OxfordAQA">OxfordAQA International</option>
              <option value="General / Global Curriculum">General Universal Curriculum</option>
            </optgroup>
            <optgroup label="UK & Europe">
              <option value="Edexcel">Edexcel (Pearson UK)</option>
              <option value="AQA">AQA (UK)</option>
              <option value="OCR">OCR (UK)</option>
              <option value="WJEC / Eduqas">WJEC / Eduqas</option>
              <option value="SQA">SQA (Scotland)</option>
              <option value="French Baccalauréat">French Baccalauréat</option>
              <option value="German Abitur">German Abitur</option>
            </optgroup>
            <optgroup label="North America">
              <option value="AP / CollegeBoard">AP (Advanced Placement - CollegeBoard)</option>
              <option value="SAT / ACT Subject Standards">SAT / ACT Standards</option>
              <option value="US State Standards / Common Core">US Common Core & NGSS</option>
              <option value="Ontario Curriculum (OSSD)">Ontario Curriculum (OSSD Canada)</option>
              <option value="Alberta Education Curriculum">Alberta Education (Canada)</option>
            </optgroup>
            <optgroup label="Asia & India">
              <option value="CBSE">CBSE (India - Class 1-12)</option>
              <option value="ICSE / ISC">CISCE (ICSE / ISC India)</option>
              <option value="IIT-JEE / NEET Foundation">IIT-JEE / NEET Entrance</option>
              <option value="State Board (State Govt)">Indian State Boards</option>
              <option value="Singapore-Cambridge GCE">Singapore-Cambridge GCE</option>
            </optgroup>
            <optgroup label="Africa & Oceania">
              <option value="WAEC / WASSCE">WAEC / WASSCE (West Africa)</option>
              <option value="NECO">NECO (Nigeria)</option>
              <option value="KCSE / CBC">KCSE / CBC (Kenya)</option>
              <option value="CAPS / DBE">CAPS / DBE Matric (South Africa)</option>
              <option value="IEB South Africa">IEB (South Africa)</option>
              <option value="ATAR / NESA (Australia)">ATAR / NESA (Australia)</option>
              <option value="NCEA (New Zealand)">NCEA (New Zealand)</option>
            </optgroup>
            <optgroup label="University / Higher Ed">
              <option value="University / Undergraduate Standard">Undergraduate / College Syllabi</option>
            </optgroup>
            <option value="CUSTOM_PROMPT">+ Enter Custom Exam Board...</option>
          </select>
        </div>

        {/* Grade Level & Subject Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Grade / Educational Stage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-500 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Grade / Stage</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setActivePickerTab('grade');
                  setIsExpandedModalOpen(true);
                }}
                className="text-[10px] text-emerald-600 hover:underline font-semibold"
              >
                All Levels
              </button>
            </div>
            <select
              value={grade}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM_PROMPT') {
                  setActivePickerTab('grade');
                  setIsExpandedModalOpen(true);
                } else {
                  setGrade(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <optgroup label="High School & Pre-University">
                <option value="Grade 12">Grade 12 / Year 13 (A-Level / AP / IB DP / Class 12)</option>
                <option value="Grade 11">Grade 11 / Year 12 (AS-Level / AP / Class 11)</option>
                <option value="Grade 10">Grade 10 / Year 11 (GCSE / IGCSE / Matric / Class 10)</option>
                <option value="Grade 9">Grade 9 / Year 10 (Freshman / IGCSE 1)</option>
              </optgroup>
              <optgroup label="Middle & Lower Secondary">
                <option value="Grade 8">Grade 8 / Year 9 (KS3 / JSS 3)</option>
                <option value="Grade 7">Grade 7 / Year 8 (Middle School)</option>
                <option value="Grade 6">Grade 6 / Year 7 (Middle School)</option>
              </optgroup>
              <optgroup label="Primary / Elementary">
                <option value="Grade 5">Grade 5 / Year 6 (KS2)</option>
                <option value="Grade 4">Grade 4 / Year 5</option>
                <option value="Grade 3">Grade 3 / Year 4</option>
                <option value="Grade 2">Grade 2 / Year 3</option>
                <option value="Grade 1">Grade 1 / Year 2</option>
                <option value="Kindergarten">Kindergarten / Reception</option>
              </optgroup>
              <optgroup label="Higher Education & University">
                <option value="Undergraduate - 1st Year">Undergraduate - 1st Year (Freshman)</option>
                <option value="Undergraduate - 2nd Year">Undergraduate - 2nd Year (Sophomore)</option>
                <option value="Undergraduate - 3rd Year">Undergraduate - 3rd Year (Junior)</option>
                <option value="Undergraduate - Final Year">Undergraduate - Final Year (Senior)</option>
                <option value="Postgraduate / Master's">Postgraduate / Master's Degree</option>
                <option value="Doctoral / PhD">Doctoral / PhD Level</option>
                <option value="Professional Certification">Professional Certification</option>
              </optgroup>
              <option value="CUSTOM_PROMPT">+ Custom Grade Level...</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-500 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Subject</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setActivePickerTab('subject');
                  setIsExpandedModalOpen(true);
                }}
                className="text-[10px] text-purple-600 hover:underline font-semibold"
              >
                All Subjects
              </button>
            </div>
            <select
              value={subject}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM_PROMPT') {
                  setActivePickerTab('subject');
                  setIsExpandedModalOpen(true);
                } else {
                  setSubject(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <optgroup label="STEM & Sciences">
                <option value="Mathematics">Mathematics (Pure & Applied)</option>
                <option value="Calculus">Calculus (AP / Multivariable)</option>
                <option value="Statistics">Statistics & Probability</option>
                <option value="Biology">Biology (AP / A-Level / IB)</option>
                <option value="Chemistry">Chemistry (Organic & Physical)</option>
                <option value="Physics">Physics (Mechanics & Quantum)</option>
                <option value="Computer Science">Computer Science & Algorithms</option>
                <option value="Artificial Intelligence">AI & Machine Learning</option>
                <option value="Environmental Science">Environmental Science</option>
              </optgroup>
              <optgroup label="Business & Economics">
                <option value="Economics">Economics (Micro & Macro)</option>
                <option value="Business Studies">Business Studies & Management</option>
                <option value="Accounting">Accounting & Finance</option>
              </optgroup>
              <optgroup label="Humanities & Social Sciences">
                <option value="World History">World History</option>
                <option value="Psychology">Psychology</option>
                <option value="Geography">Geography</option>
                <option value="Sociology">Sociology</option>
                <option value="Philosophy">Philosophy & Ethics</option>
                <option value="Political Science">Political Science & Government</option>
                <option value="Law">Law & Legal Studies</option>
              </optgroup>
              <optgroup label="Languages & Arts">
                <option value="English Literature">English Literature</option>
                <option value="English Language">English Language</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Mandarin Chinese">Mandarin Chinese</option>
                <option value="Art & Design">Art & Graphic Design</option>
                <option value="Music Theory">Music Theory & Composition</option>
              </optgroup>
              <option value="CUSTOM_PROMPT">+ Custom Subject...</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Curriculum Deep Explorer Modal */}
      {isExpandedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Global Curriculum & Syllabus Navigator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target any country, exam board, educational stage, or academic subject worldwide
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpandedModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Selection Pills */}
            <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Active Configuration:</span>
              <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-blue-800 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" /> {country}
              </span>
              <span className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-800 font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-600" /> {board}
              </span>
              <span className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-800 font-bold flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-emerald-600" /> {grade}
              </span>
              <span className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-purple-800 font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-600" /> {subject}
              </span>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              {[
                { id: 'country', label: '1. Country / Region', icon: Globe },
                { id: 'board', label: '2. Exam Board', icon: BookOpen },
                { id: 'grade', label: '3. Grade / Stage', icon: GraduationCap },
                { id: 'subject', label: '4. Subject', icon: Layers }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activePickerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActivePickerTab(tab.id as any);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search and Custom Entry Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={`Search ${activePickerTab}... (e.g. ${
                    activePickerTab === 'country'
                      ? 'United States, Germany, Japan'
                      : activePickerTab === 'board'
                      ? 'Cambridge, AP, CBSE, WAEC'
                      : activePickerTab === 'grade'
                      ? 'Grade 12, Year 11, Master\'s'
                      : 'Calculus, Organic Chemistry, AI'
                  })`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-1.5">
                {activePickerTab === 'country' && (
                  <>
                    <input
                      type="text"
                      placeholder="Custom Country..."
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 w-36"
                    />
                    <button
                      onClick={handleApplyCustomCountry}
                      disabled={!customCountry.trim()}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Set
                    </button>
                  </>
                )}
                {activePickerTab === 'board' && (
                  <>
                    <input
                      type="text"
                      placeholder="Custom Board..."
                      value={customBoard}
                      onChange={(e) => setCustomBoard(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 w-36"
                    />
                    <button
                      onClick={handleApplyCustomBoard}
                      disabled={!customBoard.trim()}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Set
                    </button>
                  </>
                )}
                {activePickerTab === 'grade' && (
                  <>
                    <input
                      type="text"
                      placeholder="Custom Grade/Level..."
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 w-36"
                    />
                    <button
                      onClick={handleApplyCustomGrade}
                      disabled={!customGrade.trim()}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Set
                    </button>
                  </>
                )}
                {activePickerTab === 'subject' && (
                  <>
                    <input
                      type="text"
                      placeholder="Custom Subject..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 w-36"
                    />
                    <button
                      onClick={handleApplyCustomSubject}
                      disabled={!customSubject.trim()}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Set
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Body: Selection List */}
            <div className="flex-1 overflow-y-auto p-6 max-h-96 space-y-4">
              {/* Country Tab */}
              {activePickerTab === 'country' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredCountries.map((c) => {
                    const isSelected = country.toLowerCase() === c.name.toLowerCase() || country.toLowerCase() === c.code.toLowerCase();
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCountry(c.name);
                          if (c.popularBoards && c.popularBoards.length > 0) {
                            setBoard(c.popularBoards[0]);
                          }
                          setActivePickerTab('board');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            Region: {c.region}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Board Tab */}
              {activePickerTab === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredBoards.map((b) => {
                    const isSelected = board.toLowerCase() === b.id.toLowerCase() || board.toLowerCase() === b.name.toLowerCase();
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBoard(b.id);
                          setActivePickerTab('grade');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-900">{b.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {b.region}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{b.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Grade Tab */}
              {activePickerTab === 'grade' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredGrades.map((g) => {
                    const isSelected = grade.toLowerCase().includes(g.id.toLowerCase()) || grade.toLowerCase() === g.name.toLowerCase();
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setGrade(g.id);
                          setActivePickerTab('subject');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-900">{g.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100/60 text-emerald-800">
                            {g.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{g.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Subject Tab */}
              {activePickerTab === 'subject' && (
                <div className="space-y-5">
                  {filteredCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>{cat.category}</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {cat.subjects.map((sub, sIdx) => {
                          const isSelected = subject.toLowerCase() === sub.toLowerCase();
                          return (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setSubject(sub);
                                setIsExpandedModalOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold ring-2 ring-purple-500/20'
                                  : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <span>{sub}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Selected: <strong>{subject}</strong> ({grade}, {board}, {country})
              </span>
              <button
                onClick={() => setIsExpandedModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Apply & Confirm Scope
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
