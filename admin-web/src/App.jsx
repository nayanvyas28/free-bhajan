import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListMusic, 
  Settings, 
  LogOut,
  Flower2,
  FileSpreadsheet,
  Lightbulb,
  Tags,
  Loader2,
  Quote,
  Flame,
  BookOpen,
  Calendar as CalendarIcon,
  Gift,
  MessageSquare
} from 'lucide-react';

import { supabase } from './lib/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddBhajan from './components/AddBhajan';
import BhajanList from './components/BhajanList';
import ExcelImport from './components/ExcelImport';
import ManageSolutions from './components/ManageSolutions';
import ManageCategories from './components/ManageCategories';
import ManageQuotes from './components/ManageQuotes';
import ManageAartis from './components/ManageAartis';
import ManageKathas from './components/ManageKathas';
import ManageCalendar from './components/ManageCalendar';
import ManageBanners from './components/ManageBanners';
import ManageReferrals from './components/ManageReferrals';
import ManageOtp from './components/ManageOtp';
import { Layout } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#0F172A] text-slate-100">
        {/* Sidebar */}
        <div className="w-64 bg-[#1E293B] border-r border-slate-800 flex flex-col shadow-2xl">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-amber-500/10 p-1 rounded-2xl shadow-xl shadow-amber-500/5">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">MantraPuja Bhajan Admin</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-3 custom-scrollbar">
            <SidebarLink to="/" icon={<LayoutDashboard size={22} />} label="Overview" end />
            <SidebarLink to="/add" icon={<PlusCircle size={22} />} label="Add Content" />
            <SidebarLink to="/categories" icon={<Tags size={22} />} label="Manage Categories" />
            <SidebarLink to="/upaye" icon={<Lightbulb size={22} />} label="Manage Upaye" />
            <SidebarLink to="/kathas" icon={<BookOpen size={22} />} label="Manage Kathas" />
            <SidebarLink to="/calendar" icon={<CalendarIcon size={22} />} label="Manage Calendar" />
            <SidebarLink to="/aartis" icon={<Flame size={22} />} label="Manage Aarti" />
            <SidebarLink to="/quotes" icon={<Quote size={22} />} label="Daily Quotes" />
            <SidebarLink to="/import" icon={<FileSpreadsheet size={22} />} label="Bulk Import" />
            <SidebarLink to="/banners" icon={<Layout size={22} />} label="App Banners" />
            <SidebarLink to="/referrals" icon={<Gift size={22} />} label="Referral System" />
            <SidebarLink to="/otp" icon={<MessageSquare size={22} />} label="OTP Settings" />
            <SidebarLink to="/list" icon={<ListMusic size={22} />} label="Manage Library" />
          </nav>

          <div className="p-6 border-t border-slate-800 bg-[#1E293B]">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 bg-red-500/10 text-red-500 font-bold px-4 py-4 rounded-xl transition-all w-full hover:bg-red-500 hover:text-white group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-[#0F172A] flex flex-col h-screen">
          <header className="h-20 bg-[#1E293B]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-10 sticky top-0 z-10 shrink-0">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Management Portal
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-[#0F172A] px-4 py-2 rounded-2xl border border-slate-800">
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{session.user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-wider">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/30 text-lg uppercase">
                  {session.user.email[0]}
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-500 flex items-center justify-center text-slate-400 hover:text-white transition-all group shadow-xl"
                title="Logout"
              >
                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </header>

          <main className="p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddBhajan />} />
              <Route path="/categories" element={<ManageCategories />} />
              <Route path="/upaye" element={<ManageSolutions />} />
              <Route path="/kathas" element={<ManageKathas />} />
              <Route path="/calendar" element={<ManageCalendar />} />
              <Route path="/aartis" element={<ManageAartis />} />
              <Route path="/quotes" element={<ManageQuotes />} />
              <Route path="/import" element={<ExcelImport />} />
              <Route path="/banners" element={<ManageBanners />} />
              <Route path="/referrals" element={<ManageReferrals />} />
              <Route path="/otp" element={<ManageOtp />} />
              <Route path="/list" element={<BhajanList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function SidebarLink({ to, icon, label, end = false }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all
        ${isActive 
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
      `}
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default App;
