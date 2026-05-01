import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListMusic, 
  Settings, 
  LogOut,
  Flower2,
  FileSpreadsheet,
  Lightbulb,
  Tags
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import AddBhajan from './components/AddBhajan';
import BhajanList from './components/BhajanList';
import ExcelImport from './components/ExcelImport';
import ManageSolutions from './components/ManageSolutions';
import ManageCategories from './components/ManageCategories';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#0F172A] text-slate-100">
        {/* Sidebar */}
        <div className="w-64 bg-[#1E293B] border-r border-slate-800 flex flex-col shadow-2xl">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-amber-500/10 p-1 rounded-2xl shadow-xl shadow-amber-500/5">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">Bhajan Admin</span>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-3">
            <SidebarLink to="/" icon={<LayoutDashboard size={22} />} label="Overview" end />
            <SidebarLink to="/add" icon={<PlusCircle size={22} />} label="Add Content" />
            <SidebarLink to="/categories" icon={<Tags size={22} />} label="Manage Categories" />
            <SidebarLink to="/upaye" icon={<Lightbulb size={22} />} label="Manage Upaye" />
            <SidebarLink to="/import" icon={<FileSpreadsheet size={22} />} label="Bulk Import" />
            <SidebarLink to="/list" icon={<ListMusic size={22} />} label="Manage Library" />
          </nav>

          <div className="p-6 border-t border-slate-800">
            <button className="flex items-center gap-3 text-slate-400 font-semibold px-4 py-3 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full group">
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-[#0F172A]">
          <header className="h-20 bg-[#1E293B]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="text-sm font-semibold text-slate-400 uppercase letter-spacing-wide">
              Management Portal
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-white">Nayan</p>
                <p className="text-[10px] text-amber-500 font-black uppercase">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/30">
                N
              </div>
            </div>
          </header>

          <main className="p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddBhajan />} />
              <Route path="/categories" element={<ManageCategories />} />
              <Route path="/upaye" element={<ManageSolutions />} />
              <Route path="/import" element={<ExcelImport />} />
              <Route path="/list" element={<BhajanList />} />
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
