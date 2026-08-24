export interface GlobalCountry {
  code: string;
  name: string;
  region: string;
  flag?: string;
  popularBoards?: string[];
}

export interface GlobalBoard {
  id: string;
  name: string;
  region: string;
  description: string;
  popularBoards?: string[];
}

export interface GlobalGrade {
  id: string;
  name: string;
  stage: string;
  description: string;
}

export interface SubjectCategory {
  category: string;
  subjects: string[];
}

export const GLOBAL_COUNTRIES: GlobalCountry[] = [
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧', popularBoards: ['Cambridge (CAIE)', 'Edexcel / Pearson', 'AQA'] },
  { code: 'US', name: 'United States', region: 'Americas', flag: '🇺🇸', popularBoards: ['AP / CollegeBoard', 'IB (International Baccalaureate)'] },
  { code: 'SG', name: 'Singapore', region: 'Asia-Pacific', flag: '🇸🇬', popularBoards: ['Cambridge (CAIE)', 'IB (International Baccalaureate)'] },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪', popularBoards: ['Cambridge (CAIE)', 'Edexcel / Pearson', 'IB (International Baccalaureate)'] },
  { code: 'IN', name: 'India', region: 'South Asia', flag: '🇮🇳', popularBoards: ['Cambridge (CAIE)', 'IB (International Baccalaureate)'] },
  { code: 'INT', name: 'International / Global', region: 'Worldwide', flag: '🌐', popularBoards: ['Cambridge (CAIE)', 'IB (International Baccalaureate)'] }
];

export const GLOBAL_BOARDS: GlobalBoard[] = [
  { id: 'CAIE', name: 'Cambridge (CAIE)', region: 'International', description: 'IGCSE, O-Level, AS & A-Level Specifications', popularBoards: ['CAIE'] },
  { id: 'EDEXCEL', name: 'Edexcel / Pearson', region: 'UK & International', description: 'GCSE & International A-Level Curricula', popularBoards: ['EDEXCEL'] },
  { id: 'AQA', name: 'AQA', region: 'United Kingdom', description: 'GCSE & GCE A-Level Standardized Exams' },
  { id: 'OCR', name: 'OCR', region: 'United Kingdom', description: 'Oxford Cambridge and RSA Examinations' },
  { id: 'IB', name: 'IB (International Baccalaureate)', region: 'Global', description: 'Diploma Programme (HL/SL) & MYP' },
  { id: 'AP', name: 'AP / CollegeBoard', region: 'United States / Global', description: 'Advanced Placement College Credit Examinations' }
];

export const GLOBAL_GRADES: GlobalGrade[] = [
  { id: 'AL12', name: 'A-Level Year 12', stage: 'Sixth Form / Senior', description: 'AS-Level / First Year Advanced Level' },
  { id: 'AL13', name: 'A-Level Year 13', stage: 'Sixth Form / Senior', description: 'A2-Level Final Examination Year' },
  { id: 'GC10', name: 'IGCSE / GCSE Year 10', stage: 'Secondary', description: 'Key Stage 4 Foundation Year' },
  { id: 'GC11', name: 'IGCSE / GCSE Year 11', stage: 'Secondary', description: 'Key Stage 4 Terminal Examination Year' },
  { id: 'IB1', name: 'IB Diploma Year 1', stage: 'DP Level', description: 'Higher & Standard Level First Year' },
  { id: 'IB2', name: 'IB Diploma Year 2', stage: 'DP Level', description: 'Final IB Diploma Examination Series' },
  { id: 'AP12', name: 'AP High School Senior', stage: 'High School', description: 'CollegeBoard Advanced Placement Exams' }
];

export const GLOBAL_SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    category: 'Core Mathematics & Computing',
    subjects: [
      'Pure Mathematics 1 (9709)',
      'Pure Mathematics 3 (9709)',
      'Mechanics (9709)',
      'Probability & Statistics 1 (9709)',
      'Computer Science (9618)',
      'Further Mathematics (9231)',
      'Edexcel A-Level Pure Mathematics',
      'IB Mathematics AA HL',
      'IB Mathematics AI SL',
      'AP Calculus BC',
      'AP Computer Science A'
    ]
  },
  {
    category: 'Natural Sciences & Medicine',
    subjects: [
      'Chemistry (9701)',
      'Physics (9702)',
      'Biology (9700)',
      'AQA A-Level Chemistry (7405)',
      'AQA A-Level Biology (7402)',
      'OCR A Physics A (H556)',
      'IB Chemistry HL',
      'IB Physics HL',
      'IB Biology HL',
      'AP Chemistry',
      'AP Physics C: Mechanics'
    ]
  },
  {
    category: 'Economics, Business & Social Sciences',
    subjects: [
      'Economics (9708)',
      'Business (9609)',
      'Accounting (9706)',
      'AQA Psychology (7182)',
      'AQA Sociology (7192)',
      'IB Economics HL',
      'IB Business Management HL',
      'AP Microeconomics',
      'AP Macroeconomics'
    ]
  },
  {
    category: 'Humanities, Languages & Arts',
    subjects: [
      'Geography (9696)',
      'History (9489)',
      'Literature in English (9695)',
      'Law (9084)',
      'IB History HL',
      'IB English A Literature',
      'AP World History: Modern'
    ]
  }
];

export const ALL_FLAT_SUBJECTS: string[] = GLOBAL_SUBJECT_CATEGORIES.flatMap((cat) => cat.subjects);
