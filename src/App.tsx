/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Phone, 
  MapPin, 
  X, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  Building2,
  Users,
  GraduationCap,
  MessageSquare,
  FileSpreadsheet,
  Mail,
  HardDrive
} from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout, sendOrderEmail, logOrderToSpreadsheet, saveOrderToDrive } from './services/googleWorkspace';
import { User } from 'firebase/auth';

interface Book {
  id: string;
  title: string;
  edition: string;
  curriculum: 'Cambridge IGCSE' | 'IB Diploma' | 'Pearson Edexcel' | 'Primary & Checkpoint';
  isbn: string;
  publisher: string;
  stockCount: number;
  dispatchTime: string;
  subject: string;
  gradeLevel: string;
  priceEstimate: string;
  coverColor: string;
}

const INITIAL_BOOKS: Book[] = [
  {
    id: 'ebs-01',
    title: 'Cambridge IGCSE™ Chemistry Coursebook with Digital Access',
    edition: '5th Edition (Latest 2026-2028 Syllabus)',
    curriculum: 'Cambridge IGCSE',
    isbn: '978-1108951609',
    publisher: 'Cambridge University Press',
    stockCount: 48,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'Chemistry',
    gradeLevel: 'Grade 9 - 10',
    priceEstimate: 'RM 145.00',
    coverColor: 'from-blue-900 to-indigo-950'
  },
  {
    id: 'ebs-02',
    title: 'IB Diploma Biology Course Companion 2026 Edition',
    edition: 'New Specification Edition',
    curriculum: 'IB Diploma',
    isbn: '978-0198423456',
    publisher: 'Oxford University Press',
    stockCount: 32,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'Biology (HL/SL)',
    gradeLevel: 'Grade 11 - 12',
    priceEstimate: 'RM 210.00',
    coverColor: 'from-emerald-900 to-teal-950'
  },
  {
    id: 'ebs-03',
    title: 'Pearson Edexcel International GCSE (9-1) Mathematics A',
    edition: 'Student Book 1 (With ActiveBook)',
    curriculum: 'Pearson Edexcel',
    isbn: '978-0435183456',
    publisher: 'Pearson Education',
    stockCount: 65,
    dispatchTime: 'Same-day dispatch available',
    subject: 'Mathematics',
    gradeLevel: 'Grade 9 - 10',
    priceEstimate: 'RM 155.00',
    coverColor: 'from-amber-900 to-orange-950'
  },
  {
    id: 'ebs-04',
    title: 'Cambridge Checkpoint Lower Secondary English Student\'s Book 8',
    edition: '3rd Edition Updated',
    curriculum: 'Primary & Checkpoint',
    isbn: '978-1398301234',
    publisher: 'Hodder Education',
    stockCount: 24,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'English',
    gradeLevel: 'Secondary 2 (Year 8)',
    priceEstimate: 'RM 115.00',
    coverColor: 'from-rose-900 to-red-950'
  },
  {
    id: 'ebs-05',
    title: 'Cambridge IGCSE™ Physics Practical Workbook',
    edition: '2nd Edition',
    curriculum: 'Cambridge IGCSE',
    isbn: '978-1108963201',
    publisher: 'Cambridge University Press',
    stockCount: 39,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'Physics',
    gradeLevel: 'Grade 9 - 10',
    priceEstimate: 'RM 85.00',
    coverColor: 'from-cyan-900 to-blue-950'
  },
  {
    id: 'ebs-06',
    title: 'IB Diploma Economics Course Book: for the IB Diploma',
    edition: '3rd Edition (2026 Updated)',
    curriculum: 'IB Diploma',
    isbn: '978-0198390123',
    publisher: 'Oxford University Press',
    stockCount: 18,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'Economics',
    gradeLevel: 'Grade 11 - 12',
    priceEstimate: 'RM 195.00',
    coverColor: 'from-purple-900 to-indigo-950'
  },
  {
    id: 'ebs-07',
    title: 'Pearson Edexcel International A Level Chemistry Student Book 1',
    edition: 'New 2026 Specification',
    curriculum: 'Pearson Edexcel',
    isbn: '978-1292244884',
    publisher: 'Pearson Education',
    stockCount: 27,
    dispatchTime: 'Dispatches within 24 hours',
    subject: 'Chemistry A-Level',
    gradeLevel: 'Form 6 / Year 12',
    priceEstimate: 'RM 180.00',
    coverColor: 'from-emerald-950 to-green-900'
  },
  {
    id: 'ebs-08',
    title: 'Cambridge Primary Mathematics Learner\'s Book 6',
    edition: '2nd Edition with Digital Pack',
    curriculum: 'Primary & Checkpoint',
    isbn: '978-1108746520',
    publisher: 'Cambridge University Press',
    stockCount: 52,
    dispatchTime: 'Same-day dispatch available',
    subject: 'Mathematics',
    gradeLevel: 'Primary Year 6',
    priceEstimate: 'RM 95.00',
    coverColor: 'from-amber-950 to-yellow-900'
  }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('All');
  
  // Reserved items: Map of bookId -> quantity
  const [reservedBooks, setReservedBooks] = useState<Record<string, number>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Google Workspace Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [workspaceConnected, setWorkspaceConnected] = useState(false);
  
  // Workspace integration status feedback
  const [syncStatus, setSyncStatus] = useState<{
    sheets: boolean;
    drive: boolean;
    gmail: boolean;
    sheetUrl?: string;
  }>({ sheets: false, drive: false, gmail: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<'Parent' | 'Student' | 'School Coordinator'>('Parent');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [isUrgentTermStart, setIsUrgentTermStart] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  
  // Success Modal State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setWorkspaceConnected(true);
        if (user.email && !email) setEmail(user.email);
        if (user.displayName && !fullName) setFullName(user.displayName);
      },
      () => {
        setCurrentUser(null);
        setWorkspaceConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setWorkspaceConnected(true);
        if (res.user.email) setEmail(res.user.email);
        if (res.user.displayName) setFullName(res.user.displayName);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setWorkspaceConnected(false);
  };

  // Filter books
  const filteredBooks = useMemo(() => {
    return INITIAL_BOOKS.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.includes(searchQuery) ||
        book.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCurriculum = 
        selectedCurriculum === 'All' || book.curriculum === selectedCurriculum;
        
      return matchesSearch && matchesCurriculum;
    });
  }, [searchQuery, selectedCurriculum]);

  const totalReservedCount = Object.values(reservedBooks).reduce((a, b) => a + b, 0);

  const handleToggleReserve = (book: Book) => {
    setReservedBooks(prev => {
      const current = prev[book.id] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[book.id];
        return copy;
      } else {
        return { ...prev, [book.id]: 1 };
      }
    });
  };

  const handleUpdateQuantity = (bookId: string, delta: number) => {
    setReservedBooks(prev => {
      const current = prev[bookId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[bookId];
        return copy;
      }
      return { ...prev, [bookId]: next };
    });
  };

  const handleProceedToInquiry = () => {
    setIsDrawerOpen(false);
    const formElement = document.getElementById('rapid-inquiry-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    const reservedListText = Object.entries(reservedBooks)
      .map(([id, qty]) => {
        const b = INITIAL_BOOKS.find(item => item.id === id);
        return `${qty}x ${b?.title} (ISBN: ${b?.isbn})`;
      })
      .join('\n');
    
    if (reservedListText && !customNotes) {
      setCustomNotes(`Reserved Books List:\n${reservedListText}`);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncError(null);

    const orderId = `EBS-${Math.floor(100000 + Math.random() * 900000)}`;
    const reservedItemsSummary = Object.entries(reservedBooks).map(([id, qty]) => {
      const b = INITIAL_BOOKS.find(item => item.id === id);
      return { title: b?.title, isbn: b?.isbn, qty };
    });

    const itemsTextString = reservedItemsSummary.length > 0 
      ? reservedItemsSummary.map(i => `${i.qty}x ${i.title} (${i.isbn})`).join('; ')
      : customNotes || 'General Custom Book Inquiry';

    const orderData = {
      orderId,
      role,
      fullName,
      whatsapp: `+60 ${whatsappNumber}`,
      email,
      schoolName,
      neededByDate: neededByDate || 'Urgent / Term Start',
      isUrgentTermStart,
      customNotes,
      items: itemsTextString,
      timestamp: new Date().toLocaleString()
    };

    let sheetsSuccess = false;
    let driveSuccess = false;
    let gmailSuccess = false;
    let sheetUrl = '';

    const token = await getAccessToken();

    if (token) {
      try {
        // 1. Log to Google Sheets
        const sheetRes = await logOrderToSpreadsheet(token, {
          orderId,
          fullName,
          schoolName,
          whatsapp: orderData.whatsapp,
          email,
          items: itemsTextString,
          timestamp: orderData.timestamp
        });
        sheetsSuccess = true;
        sheetUrl = sheetRes.spreadsheetUrl;
      } catch (err: any) {
        console.error('Google Sheets sync error:', err);
      }

      try {
        // 2. Save to Google Drive
        await saveOrderToDrive(token, {
          orderId,
          fullName,
          schoolName,
          items: itemsTextString,
          timestamp: orderData.timestamp
        });
        driveSuccess = true;
      } catch (err: any) {
        console.error('Google Drive sync error:', err);
      }

      try {
        // 3. Send email via Gmail
        await sendOrderEmail(
          token,
          email,
          `Emo Book Service - Order Inquiry Confirmation (${orderId})`,
          `Dear ${fullName},\n\nThank you for submitting your textbook stock inquiry with Emo Book Service Sdn Bhd.\n\nOrder ID: ${orderId}\nSchool: ${schoolName}\nNeeded By: ${orderData.neededByDate}\n\nReserved Items:\n${itemsTextString}\n\nOur Selangor warehouse team is verifying stock and will contact you shortly via WhatsApp (${orderData.whatsapp}).\n\nWarm regards,\nEmo Book Service Team`
        );
        gmailSuccess = true;
      } catch (err: any) {
        console.error('Gmail send error:', err);
      }
    }

    setSyncStatus({ sheets: sheetsSuccess, drive: driveSuccess, gmail: gmailSuccess, sheetUrl });
    setSubmittedData(orderData);
    setIsSubmitted(true);
    setIsSyncing(false);
  };

  const buildWhatsAppUrl = () => {
    const itemsText = Object.entries(reservedBooks).map(([id, qty]) => {
      const b = INITIAL_BOOKS.find(item => item.id === id);
      return `- ${qty}x ${b?.title} (${b?.isbn})`;
    }).join('%0A');

    const msg = `Hello Emo Book Service,%0A%0AI would like to verify and lock in stock for:%0A${itemsText}%0A%0AName: ${fullName}%0ARole: ${role}%0ASchool: ${schoolName}%0ANeeded By: ${neededByDate || 'Urgent'}`;
    return `https://wa.me/60102806610?text=${msg}`;
  };

  const buildCustomerWhatsAppUrl = () => {
    if (!submittedData) return '#';
    const cleanNum = (submittedData.whatsappNumber || '').replace(/\D/g, '');
    const formattedNum = cleanNum.startsWith('0') ? '60' + cleanNum.slice(1) : cleanNum.startsWith('60') ? cleanNum : '60' + cleanNum;
    const msg = `Hello ${submittedData.fullName}, this is Emo Book Service Sdn Bhd regarding your textbook stock inquiry (${submittedData.orderId}) for ${submittedData.schoolName}. We are verifying your stock in our Selangor warehouse now!`;
    return `https://wa.me/${formattedNum}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. TOP URGENCY & REASSURANCE BANNER */}
      <div className="bg-[#972828] text-white text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-[#FCAD38] animate-pulse shrink-0" />
        <span>⚡ Guaranteed Ready Local Stock in Malaysia • 24–48h Dispatch • Direct International School Syllabus Partner</span>
      </div>

      {/* 2. STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#972828] flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-[#E45742] transition-colors">
              EBO
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#1C1917] leading-none">
                Emo Book Service <span className="text-xs font-semibold text-[#972828] bg-red-50 px-1.5 py-0.5 rounded ml-1">Sdn Bhd</span>
              </span>
              <span className="text-[11px] text-stone-500 font-medium tracking-tight mt-0.5">
                Malaysia's Premier International School Book Distributor
              </span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#catalog" className="hover:text-[#972828] transition-colors whitespace-nowrap">Curriculums & Stock</a>
            <a href="#new-editions" className="hover:text-[#972828] transition-colors whitespace-nowrap">2026/2027 Editions</a>
            <a href="#workspace-integration" className="hover:text-[#972828] transition-colors whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" /> Google Workspace
            </a>
            <a href="#why-us" className="hover:text-[#972828] transition-colors whitespace-nowrap">Why Choose Us</a>
            <a href="#faqs" className="hover:text-[#972828] transition-colors whitespace-nowrap">FAQs</a>
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-3">
            {/* Google Sign In / Workspace Status */}
            {!workspaceConnected ? (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white text-stone-700 border border-stone-300 rounded-xl hover:bg-stone-50 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.32 7.23 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.13 0 9.83 0 12s.43 3.87 1.18 5.38l4.09-3.14z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Connect Workspace'}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800">{currentUser?.displayName || currentUser?.email || 'Connected'}</span>
                <button onClick={handleGoogleLogout} className="text-[10px] text-stone-500 hover:text-red-600 underline ml-1">Disconnect</button>
              </div>
            )}

            {/* Reserve Drawer Button */}
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-all border border-stone-200"
            >
              <ShoppingCart className="w-4 h-4 text-[#972828]" />
              <span className="hidden sm:inline">Reserved Books</span>
              {totalReservedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#EB7F31] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  {totalReservedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/80 via-[#FAFAF9] to-white pt-12 pb-16 px-4 sm:px-8 border-b border-stone-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-800 w-fit">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets, Gmail & Drive Integration Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
              Never Start the School Term <span className="text-[#972828]">Empty-Handed.</span>
            </h1>

            <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Direct international school syllabus partner supplying authentic Cambridge IGCSE, IB Diploma, and Pearson Edexcel editions. Orders sync instantly to your Google Sheets, Google Drive, and Gmail.
            </p>

            {/* Interactive Quick-Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-stone-200 flex flex-col sm:flex-row gap-3 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Search book title, subject, or 13-digit ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                />
              </div>

              <div className="sm:w-52">
                <select 
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                >
                  <option value="All">All Curriculums</option>
                  <option value="Cambridge IGCSE">Cambridge IGCSE</option>
                  <option value="IB Diploma">IB Diploma</option>
                  <option value="Pearson Edexcel">Pearson Edexcel</option>
                  <option value="Primary & Checkpoint">Primary & Checkpoint</option>
                </select>
              </div>

              <a 
                href="#catalog"
                className="bg-[#EB7F31] hover:bg-[#d86e24] text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md whitespace-nowrap"
              >
                Check Live Stock
              </a>
            </div>

            {/* Google Workspace Connection Banner */}
            <div id="workspace-integration" className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Google Workspace Sync</h4>
                  <p className="text-xs text-stone-500">Connect Gmail, Sheets, and Drive for automated pre-order logs & confirmations.</p>
                </div>
              </div>

              {!workspaceConnected ? (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="px-4 py-2.5 bg-[#972828] hover:bg-[#802222] text-white font-bold text-xs rounded-xl transition-all shadow-sm whitespace-nowrap"
                >
                  {isLoggingIn ? 'Connecting...' : 'Authorize Workspace'}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fully Connected & Ready</span>
                </div>
              )}
            </div>

          </div>

          {/* Hero Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#972828]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold tracking-wider text-[#972828] uppercase bg-red-50 px-3 py-1 rounded-full">
                  Google Workspace Active
                </span>
                <span className="text-xs text-stone-500 font-mono">API v3 Live</span>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <h5 className="font-bold text-stone-900">Google Sheets Integration</h5>
                    <p className="text-stone-500">Automatically creates and appends orders to a new Sheet.</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-xs">
                    <h5 className="font-bold text-stone-900">Google Drive Integration</h5>
                    <p className="text-stone-500">Saves formal text inquiry summaries securely to your Drive.</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-red-600 shrink-0" />
                  <div className="text-xs">
                    <h5 className="font-bold text-stone-900">Gmail API Integration</h5>
                    <p className="text-stone-500">Sends instant order confirmation receipts straight to your inbox.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500">Status: {workspaceConnected ? 'Authenticated ✓' : 'Awaiting Sign-In'}</span>
                <a 
                  href="#rapid-inquiry-form"
                  className="px-4 py-2 bg-[#EB7F31] hover:bg-[#d86e24] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Test Order Sync
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE NEW EDITIONS & STOCK CATALOG */}
      <section id="catalog" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#972828] uppercase mb-1">
              Live Inventory & Syllabus Catalog
            </div>
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Verified Editions Ready to Dispatch
            </h2>
          </div>

          {/* Curriculum Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/70 p-1.5 rounded-2xl w-fit">
            {['All', 'Cambridge IGCSE', 'IB Diploma', 'Pearson Edexcel', 'Primary & Checkpoint'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCurriculum(tab)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  selectedCurriculum === tab
                    ? 'bg-white text-stone-900 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900">No textbooks found matching your search</h3>
            <p className="text-stone-500 text-sm mt-1">Try searching by a different title or ISBN number.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCurriculum('All'); }}
              className="mt-4 px-5 py-2.5 bg-[#972828] text-white text-xs font-bold rounded-xl hover:bg-[#802222] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => {
              const isReserved = Boolean(reservedBooks[book.id]);
              return (
                <div 
                  key={book.id} 
                  className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className={`h-40 bg-gradient-to-br ${book.coverColor} p-5 flex flex-col justify-between relative overflow-hidden text-white`}>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[11px] font-bold tracking-wider uppercase bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-md">
                        {book.curriculum}
                      </span>
                      <span className="text-xs font-mono bg-white/20 backdrop-blur-md px-2 py-0.5 rounded">
                        {book.gradeLevel}
                      </span>
                    </div>

                    <div className="z-10 mt-auto">
                      <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {book.edition}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                        <span>{book.publisher}</span>
                        <span className="font-mono">{book.priceEstimate}</span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-[#972828] transition-colors line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-xs text-stone-500 font-mono">
                        ISBN: {book.isbn}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="font-semibold text-stone-700">In Warehouse</span>
                        </div>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {book.stockCount} left
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-stone-400" />
                        <span>{book.dispatchTime}</span>
                      </div>

                      <button
                        onClick={() => handleToggleReserve(book)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                          isReserved
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#EB7F31] hover:bg-[#d86e24] text-white'
                        }`}
                      >
                        {isReserved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Added to Reserve ✓
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" /> Add to Reserve List
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. SLIDE-OVER RESERVE DRAWER */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#972828] hover:bg-[#802222] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 border border-red-800"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-white" />
            {totalReservedCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#FCAD38] text-stone-900 text-[10px] font-extrabold flex items-center justify-center">
                {totalReservedCount}
              </span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-none">Reserve List</span>
            <span className="text-[11px] text-red-200 mt-0.5">{totalReservedCount} books selected</span>
          </div>
        </button>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              
              <div className="px-6 py-5 bg-[#972828] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-[#FCAD38]" />
                  <h3 className="font-bold text-lg">Your Book Reserve List</h3>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {Object.keys(reservedBooks).length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
                    <h4 className="font-bold text-stone-700">Your reserve list is empty</h4>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Browse our live catalog and click "Add to Reserve List" to secure your school term textbooks instantly.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-stone-500 pb-2 border-b border-stone-100 flex justify-between items-center">
                      <span>SELECTED TEXTBOOKS ({totalReservedCount})</span>
                      <button 
                        onClick={() => setReservedBooks({})}
                        className="text-red-600 hover:underline text-[11px]"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(reservedBooks).map(([id, qty]) => {
                        const book = INITIAL_BOOKS.find(b => b.id === id);
                        if (!book) return null;
                        return (
                          <div key={id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-stone-900 text-sm leading-snug">{book.title}</h4>
                              <button 
                                onClick={() => handleUpdateQuantity(id, -qty)}
                                className="text-stone-400 hover:text-red-600 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-stone-500">
                              <span>ISBN: {book.isbn}</span>
                              <span className="font-mono font-bold text-stone-800">{book.priceEstimate}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 mt-1">
                              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready in Warehouse
                              </span>

                              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-200">
                                <button 
                                  onClick={() => handleUpdateQuantity(id, -1)}
                                  className="text-stone-600 hover:text-black p-0.5"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-5 text-center">{qty}</span>
                                <button 
                                  onClick={() => handleUpdateQuantity(id, 1)}
                                  className="text-stone-600 hover:text-black p-0.5"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {Object.keys(reservedBooks).length > 0 && (
                <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600 font-medium">Estimated Total:</span>
                    <span className="font-extrabold text-stone-900">
                      RM {Object.entries(reservedBooks).reduce((sum, [id, qty]) => {
                        const b = INITIAL_BOOKS.find(item => item.id === id);
                        const price = b ? parseFloat(b.priceEstimate.replace('RM ', '')) : 0;
                        return sum + (price * qty);
                      }, 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleProceedToInquiry}
                    className="w-full py-3.5 px-4 bg-[#EB7F31] hover:bg-[#d86e24] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Proceed to Stock Inquiry <ChevronRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-stone-500 text-center">
                    Auto-syncs with Google Sheets & Drive upon submission.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 6. HIGH-CONVERTING LEAD CAPTURE FORM */}
      <section id="rapid-inquiry-form" className="py-20 px-4 sm:px-8 bg-gradient-to-t from-stone-200/50 to-[#FAFAF9] border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-[#972828] uppercase bg-red-50 px-3 py-1 rounded-full">
              Rapid Stock Inquiry & Google Workspace Sync
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 tracking-tight">
              Lock In Stock & Auto-Log to Workspace
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2">
              Submitting this form automatically logs your order into a Google Spreadsheet, saves a text summary in Google Drive, and sends your confirmation receipt via Gmail.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-10">
            {isSubmitted && submittedData ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-sm">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-stone-900">Inquiry Submitted & Workspace Synced!</h3>
                  <p className="text-stone-600 text-sm max-w-md mx-auto">
                    Thank you, <span className="font-bold text-stone-900">{submittedData.fullName}</span>. Your order has been successfully recorded across your connected Google apps.
                  </p>
                </div>

                {/* Workspace Sync Status Summary */}
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 text-left max-w-lg mx-auto space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Google Workspace Sync Results:</h4>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-stone-700">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Sheets Order Log
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${syncStatus.sheets ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {syncStatus.sheets ? 'Synced Successfully ✓' : workspaceConnected ? 'Skipped / Error' : 'Sign-In Required'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-stone-700">
                      <HardDrive className="w-4 h-4 text-blue-600" /> Google Drive Summary File
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${syncStatus.drive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {syncStatus.drive ? 'Saved to Drive ✓' : workspaceConnected ? 'Skipped / Error' : 'Sign-In Required'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-stone-700">
                      <Mail className="w-4 h-4 text-red-600" /> Gmail Confirmation Receipt
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${syncStatus.gmail ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {syncStatus.gmail ? 'Email Sent ✓' : workspaceConnected ? 'Skipped / Error' : 'Sign-In Required'}
                    </span>
                  </div>

                  {syncStatus.sheetUrl && (
                    <div className="pt-2 border-t border-stone-200 mt-2">
                      <a 
                        href={syncStatus.sheetUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Created Google Spreadsheet
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        💬
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">Auto-Message Customer on WhatsApp</h4>
                        <p className="text-[11px] text-emerald-700">Instantly open WhatsApp chat pre-filled with order confirmation for {submittedData?.fullName}.</p>
                      </div>
                    </div>
                    <a
                      href={buildCustomerWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all animate-pulse shrink-0 whitespace-nowrap"
                    >
                      <MessageSquare className="w-4 h-4" /> Send WhatsApp to Customer
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href={buildWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Notify Business (0102806610)
                    </a>
                    <button
                      onClick={() => { setIsSubmitted(false); setReservedBooks({}); }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-all"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-6">
                
                {/* Workspace Connection Notice */}
                {!workspaceConnected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800 font-medium">
                        Connect Google Workspace before submitting to automatically sync orders to Sheets, Drive, and Gmail.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition-all"
                    >
                      {isLoggingIn ? 'Connecting...' : 'Connect Now'}
                    </button>
                  </div>
                )}

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">I am inquiring as a:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Parent', 'Student', 'School Coordinator'] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                          role === r
                            ? 'bg-[#972828] text-white border-[#972828] shadow-md'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {r === 'Parent' && <Users className="w-4 h-4" />}
                        {r === 'Student' && <GraduationCap className="w-4 h-4" />}
                        {r === 'School Coordinator' && <Building2 className="w-4 h-4" />}
                        <span>{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Datin Sarah Tan / Mr. David Lee"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">WhatsApp Number *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 bg-stone-200 border border-r-0 border-stone-300 rounded-l-xl text-xs font-bold text-stone-700">
                        +60
                      </span>
                      <input 
                        type="tel"
                        required
                        placeholder="12-345 6789"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Email Address (for Gmail receipt) *</label>
                    <input 
                      type="email"
                      required
                      placeholder="sarah@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">International School Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Garden International School / Mont Kiara"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Needed-By Date</label>
                    <input 
                      type="date"
                      value={neededByDate}
                      onChange={(e) => setNeededByDate(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isUrgentTermStart}
                        onChange={(e) => setIsUrgentTermStart(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-300 text-[#972828] focus:ring-[#972828]"
                      />
                      <span className="text-xs font-bold text-stone-900">
                        ⚡ Urgent Term Start (Express 24h Dispatch Required)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Book Titles / ISBNs / Additional Notes (Synced with Reserve Drawer)
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Enter additional ISBNs or specific year group editions needed..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#972828]/20 focus:border-[#972828]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-4 bg-[#EB7F31] hover:bg-[#d86e24] text-white font-extrabold rounded-2xl text-base shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <span>Syncing with Google Sheets, Drive & Gmail...</span>
                  ) : (
                    <>
                      <span>Lock In Stock & Sync to Google Workspace</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-stone-500 text-center">
                  🔒 Seamlessly integrated with Google Workspace APIs. Data is securely processed in your browser session.
                </p>

              </form>
            )}
          </div>

        </div>
      </section>

      {/* 7. REASSURANCE "WHY CHOOSE US" GRID & FAQ ACCORDION */}
      <section id="why-us" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-[#972828] uppercase bg-red-50 px-3 py-1 rounded-full">
            The Emo Book Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 tracking-tight">
            Why International Schools & Parents Rely On Us
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#972828] flex items-center justify-center text-xl font-bold">
              📦
            </div>
            <h3 className="text-xl font-bold text-stone-900">Local Warehouse vs. Overseas Shipping</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Unlike overseas suppliers that take 4 to 6 weeks with customs clearance risks, our physical warehouse in Selangor stocks 100% verified editions ready for immediate dispatch.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
              🛡️
            </div>
            <h3 className="text-xl font-bold text-stone-900">100% Authentic New Editions</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              We source directly from Cambridge University Press, Oxford, Pearson Edexcel, and Hodder Education. Guaranteed latest 2026/2027 syllabus compliance for all international students.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-stone-900">24–48h Express Dispatch</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Partnered with reliable courier networks across Peninsular Malaysia and East Malaysia. Same-day dispatch options available for urgent school term start dates.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div id="faqs" className="max-w-3xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
          <h3 className="text-2xl font-extrabold text-stone-900 mb-6 text-center">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            {[
              {
                q: 'How does the Google Workspace integration work?',
                a: 'Once you sign in with your Google account using the top navigation button, every pre-order inquiry you submit automatically creates a new Google Sheet record, saves an official order file to your Google Drive, and emails a confirmation receipt via Gmail.'
              },
              {
                q: 'Are all textbooks listed on the website currently in your local Selangor warehouse?',
                a: 'Yes! Every book displaying the green "In Warehouse: Ready to Ship" badge is physically stocked in our Selangor distribution center.'
              },
              {
                q: 'How do I place a bulk order for our entire international school year group?',
                a: 'School coordinators can use our Rapid Stock Inquiry form or contact our dedicated institutional hotline via WhatsApp (+60 16-290 2022).'
              },
              {
                q: 'What payment methods are supported for parents and schools?',
                a: 'We support Online Instant FPX Banking, DuitNow QR, Credit/Debit Cards, and Official School Local Purchase Orders (LPO).'
              }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-stone-200/60 pb-4">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-stone-900 py-2 hover:text-[#972828] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#972828]' : ''}`} />
                </button>
                {openFaq === idx && (
                  <p className="text-stone-600 text-sm mt-2 leading-relaxed pr-8">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* 8. PROFESSIONAL FOOTER */}
      <footer className="bg-stone-900 text-stone-400 py-16 px-4 sm:px-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#972828] flex items-center justify-center text-white font-bold text-base">
                EBO
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Emo Book Service</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Emo Book Service Sdn Bhd (Co. Reg: 1998010XXXXX / 458223-X). Malaysia's leading educational book distributor specializing in international school curriculums.
            </p>
            <div className="text-xs text-stone-500 font-mono">
              Google Workspace Enabled
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Curriculums</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#catalog" className="hover:text-white transition-colors">Cambridge IGCSE & O Level</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">IB Diploma Programme (DP)</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Pearson Edexcel International</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Primary & Lower Secondary Checkpoint</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Google Workspace</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Google Sheets Sync</li>
              <li className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-blue-500" /> Google Drive Storage</li>
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-red-500" /> Gmail Confirmation API</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Warehouse & Helpline</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#EB7F31] shrink-0 mt-0.5" />
                <span>No. 12, Jalan Industri PBP 3, Taman Industri Pusat Bandar Puchong, 47100 Selangor, Malaysia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#EB7F31] shrink-0" />
                <span>WhatsApp: +60 16-290 2022</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#EB7F31] shrink-0" />
                <span>Mon–Fri: 8:30 AM – 5:30 PM (Sat until 1:00 PM)</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Emo Book Service Sdn Bhd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-stone-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Terms of Distribution</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Google Workspace Portal</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
