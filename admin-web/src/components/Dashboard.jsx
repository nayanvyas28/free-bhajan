import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Music, Video, Layout, Upload } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, youtube: 0, audio: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data, error } = await supabase.from('bhajans').select('type');
    if (data) {
      const counts = data.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, { youtube: 0, audio: 0 });
      setStats({ total: data.length, ...counts });
    }
  };

  return (
    <div className="dashboard">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight">Overview</h1>
        <p className="text-slate-400 mt-2 font-medium">Monitoring your divine library</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <StatCard title="Total Bhajans" value={stats.total} icon={<Layout size={28} />} color="from-blue-500 to-blue-600" />
        <StatCard title="YouTube Videos" value={stats.youtube} icon={<Video size={28} />} color="from-red-500 to-red-600" />
        <StatCard title="Audio Files" value={stats.audio} icon={<Music size={28} />} color="from-emerald-500 to-emerald-600" />
      </div>

      <div className="bg-[#1E293B] rounded-3xl p-10 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="flex flex-wrap gap-6">
          <button className="flex items-center gap-3 bg-amber-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-600 hover:scale-105 transition-all shadow-lg shadow-amber-500/25">
            <Upload size={24} />
            Bulk Import Data
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-[#1E293B] p-8 rounded-[2rem] border border-slate-800 flex items-center justify-between shadow-xl group hover:border-slate-700 transition-all">
      <div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</p>
        <p className="text-4xl font-black text-white mt-2">{value}</p>
      </div>
      <div className={`bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-2xl group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
}
