import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Edit, ExternalLink, Music, Video, Search, X, Save, Loader2, Layout, Tags, Eye, EyeOff, Cloud, Lightbulb, Check } from 'lucide-react';
import { deleteFromR2 } from '../lib/r2';

export default function BhajanList() {
  const [bhajans, setBhajans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: '',
    sub_type: '',
    type: '',
    thumbnail: '',
    duration: 0,
    is_visible: true
  });
  const [activeTab, setActiveTab] = useState('all'); // all, youtube, r2
  const [promotingId, setPromotingId] = useState(null);
  const [promoteCategory, setPromoteCategory] = useState('Health');
  const SOLUTION_CATS = ['Health', 'Wealth', 'Job', 'Family', 'Peace', 'Other'];

  useEffect(() => {
    fetchBhajans();
    fetchCategories();
  }, []);

  const fetchBhajans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bhajans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBhajans(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('name').order('name');
    if (data) setCategories(data);
  };

  const handleDelete = async (id) => {
    const bhajan = bhajans.find(b => b.id === id);
    if (!window.confirm(`Are you sure you want to delete "${bhajan?.title}"?`)) return;
    
    // Delete from Cloudflare if it's an R2 URL
    if (bhajan?.url) {
      await deleteFromR2(bhajan.url);
    }

    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) {
      setBhajans(bhajans.filter(b => b.id !== id));
    }
  };

  const startEdit = (bhajan) => {
    setEditingId(bhajan.id);
    setEditFormData({
      title: bhajan.title,
      category: bhajan.category,
      sub_type: bhajan.sub_type || 'Bhajan',
      type: bhajan.type,
      thumbnail: bhajan.thumbnail,
      duration: bhajan.duration || 0,
      is_visible: bhajan.is_visible !== false
    });
  };

  const toggleVisibility = async (bhajan) => {
    const newStatus = bhajan.is_visible === false ? true : false;
    const { error } = await supabase
      .from('bhajans')
      .update({ is_visible: newStatus })
      .eq('id', bhajan.id);
    
    if (!error) {
      setBhajans(bhajans.map(b => b.id === bhajan.id ? { ...b, is_visible: newStatus } : b));
    }
  };

  const saveEdit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('bhajans')
      .update(editFormData)
      .eq('id', editingId);
    
    if (!error) {
      setEditingId(null);
      fetchBhajans();
      alert('Updated successfully!');
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const handlePromoteToUpaye = async (bhajan) => {
    setLoading(true);
    try {
      const solutionData = {
        title: bhajan.title,
        description: `This ${bhajan.type} is recommended for ${promoteCategory}.`,
        category: promoteCategory,
        image_url: bhajan.thumbnail,
        url: bhajan.url,
        type: bhajan.type,
        is_visible: true
      };

      const { error } = await supabase
        .from('solutions')
        .insert([solutionData]);

      if (error) throw error;
      alert('Content successfully promoted to Upaye section!');
      setPromotingId(null);
    } catch (error) {
      alert('Promotion Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bhajans.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || 
                         (b.category && b.category.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === 'youtube') return matchesSearch && b.type === 'youtube';
    if (activeTab === 'r2') return matchesSearch && (b.type === 'video' || b.type === 'audio');
    return matchesSearch;
  });

  return (
    <div className="py-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white">Manage Library</h2>
          <p className="text-slate-400 font-medium mt-2">Curating and organizing your divine collection</p>
        </div>
        <div className="relative">
          <input 
            className="pl-14 pr-6 py-4 bg-[#1E293B] border border-slate-800 rounded-2xl w-80 text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold placeholder:text-slate-600 shadow-xl"
            placeholder="Search title or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        {[
          { id: 'all', label: 'All Content', icon: Layout },
          { id: 'youtube', label: 'YouTube', icon: Video },
          { id: 'r2', label: 'Cloudflare R2', icon: Cloud }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-[#1E293B] text-slate-400 hover:text-slate-200 border border-slate-800'}`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800'}`}>
              {tab.id === 'all' ? bhajans.length : 
               tab.id === 'youtube' ? bhajans.filter(b => b.type === 'youtube').length : 
               bhajans.filter(b => b.type === 'video' || b.type === 'audio').length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#1E293B] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0F172A]/50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800">
              <th className="px-8 py-7">Bhajan / Mantra Detail</th>
              <th className="px-8 py-7">Classification</th>
              <th className="px-8 py-7">Category</th>
              <th className="px-8 py-7">Status</th>
              <th className="px-8 py-7 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading && !bhajans.length ? (
              <tr><td colSpan="4" className="p-32 text-center">
                <Loader2 className="animate-spin mx-auto text-amber-500 mb-4" size={48} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Synchronizing Library...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="4" className="p-32 text-center text-slate-500 font-bold">No divine content found matching your search</td></tr>
            ) : filtered.map(bhajan => (
              <tr key={bhajan.id} className={`transition-all group ${editingId === bhajan.id ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'}`}>
                <td className="px-8 py-6">
                  {editingId === bhajan.id ? (
                    <div className="space-y-2">
                      <input 
                        className="w-full bg-[#0F172A] border border-amber-500/50 rounded-xl px-4 py-2 text-white font-bold outline-none"
                        value={editFormData.title}
                        placeholder="Title"
                        onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                      />
                      <input 
                        className="w-full bg-[#0F172A] border border-amber-500/50 rounded-xl px-4 py-2 text-slate-400 font-bold outline-none text-[10px]"
                        value={editFormData.thumbnail}
                        placeholder="Thumbnail URL"
                        onChange={e => setEditFormData({...editFormData, thumbnail: e.target.value})}
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          className="w-24 bg-[#0F172A] border border-amber-500/50 rounded-xl px-4 py-2 text-white font-bold outline-none text-[10px]"
                          value={editFormData.duration}
                          placeholder="Secs"
                          onChange={e => setEditFormData({...editFormData, duration: parseInt(e.target.value) || 0})}
                        />
                        <span className="text-[10px] text-slate-500 uppercase font-black">Seconds</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={bhajan.thumbnail} className="w-16 h-16 rounded-2xl object-cover bg-slate-900 shadow-xl group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                        <div className="absolute -top-2 -right-2 p-1.5 bg-[#0F172A] rounded-lg border border-slate-800">
                          {bhajan.type === 'youtube' ? (
                            <Video size={12} className="text-red-400" />
                          ) : bhajan.type === 'video' ? (
                            <Cloud size={12} className="text-blue-400" />
                          ) : bhajan.type === 'audio' ? (
                            <Music size={12} className="text-emerald-400" />
                          ) : (
                            <ExternalLink size={12} className="text-slate-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-white text-lg leading-tight">{bhajan.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {bhajan.url.slice(0, 15)}...</p>
                          {bhajan.duration > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black">{Math.floor(bhajan.duration / 60)}:{(bhajan.duration % 60).toString().padStart(2, '0')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6">
                  {editingId === bhajan.id ? (
                    <select 
                      className="bg-[#0F172A] border border-amber-500/50 rounded-xl px-4 py-3 text-white font-bold outline-none"
                      value={editFormData.sub_type}
                      onChange={e => setEditFormData({...editFormData, sub_type: e.target.value})}
                    >
                      <option>Bhajan</option>
                      <option>Mantra</option>
                      <option>Song</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] font-black uppercase text-amber-500">
                      <Tags size={12} /> {bhajan.sub_type || 'Bhajan'}
                    </span>
                  )}
                </td>
                <td className="px-8 py-6">
                  {editingId === bhajan.id ? (
                    <select 
                      className="bg-[#0F172A] border border-amber-500/50 rounded-xl px-4 py-3 text-white font-bold outline-none"
                      value={editFormData.category}
                      onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c.name}>{c.name}</option>)}
                      <option>Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                      <Layout size={16} className="text-slate-500" />
                      {bhajan.category}
                    </div>
                  )}
                </td>
                <td className="px-8 py-6">
                  <button 
                    onClick={() => toggleVisibility(bhajan)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${bhajan.is_visible !== false ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  >
                    {bhajan.is_visible !== false ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3 transition-opacity">
                    {editingId === bhajan.id ? (
                      <>
                        <button onClick={saveEdit} className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
                          <Save size={20} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all">
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <button 
                            onClick={() => setPromotingId(promotingId === bhajan.id ? null : bhajan.id)}
                            className={`p-3 rounded-xl transition-all ${promotingId === bhajan.id ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'}`}
                            title="Convert to Upaye"
                          >
                            <Lightbulb size={20} />
                          </button>
                          
                          {promotingId === bhajan.id && (
                            <div className="absolute right-0 top-full mt-3 bg-[#0F172A] border-2 border-amber-500/50 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] w-72 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                  <Lightbulb size={16} />
                                </div>
                                <p className="text-[11px] font-black uppercase text-white tracking-widest">Select Category</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2.5 mb-5">
                                {SOLUTION_CATS.map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => setPromoteCategory(cat)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border ${promoteCategory === cat ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                              
                              <button
                                onClick={() => handlePromoteToUpaye(bhajan)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                              >
                                <Check size={16} /> Confirm & Copy to Upaye
                              </button>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => startEdit(bhajan)}
                          className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                        >
                          <Edit size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(bhajan.id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
