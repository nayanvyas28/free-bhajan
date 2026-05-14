import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { 
  Flame, 
  Plus, 
  Search, 
  Music, 
  BookOpen, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Loader2, 
  Upload,
  Link as LinkIcon
} from 'lucide-react';

export default function ManageAartis() {
  const [aartis, setAartis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAarti, setEditingAarti] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'Bhajan',
    sub_type: 'Aarti',
    type: 'audio',
    thumbnail: 'https://img.freepik.com/free-photo/view-divine-lord-krishna_23-2151127025.jpg'
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAartis();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('name').order('name');
    if (data) setCategories(data);
  };

  const fetchAartis = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bhajans')
      .select('*')
      .eq('sub_type', 'Aarti')
      .order('created_at', { ascending: false });
    
    if (data) setAartis(data);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const publicUrl = await uploadToR2(file, (progress) => {
        setUploadProgress(progress);
      });
      setFormData({ ...formData, url: publicUrl, type: 'audio' });
      if (!formData.title) setFormData(prev => ({ ...prev, title: file.name.split('.')[0] }));
      alert('✅ File uploaded to Cloudflare successfully!');
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAarti) {
        const { error } = await supabase
          .from('bhajans')
          .update(formData)
          .eq('id', editingAarti.id);
        if (error) throw error;
        alert('✨ Aarti updated successfully!');
      } else {
        const { error } = await supabase
          .from('bhajans')
          .insert([formData]);
        if (error) throw error;
        alert('🎊 New Aarti added successfully!');
      }
      setShowModal(false);
      setEditingAarti(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        category: 'Bhajan',
        sub_type: 'Aarti',
        type: 'audio',
        thumbnail: 'https://img.freepik.com/free-photo/view-divine-lord-krishna_23-2151127025.jpg'
      });
      fetchAartis();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAarti = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Aarti?')) return;
    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) fetchAartis();
  };

  const filteredAartis = aartis.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Flame className="text-amber-500" size={40} />
            Manage Aarti Sangrah
          </h1>
          <p className="text-slate-400 font-medium mt-1">Dedicated section for Aartis with Audio & Lyrics</p>
        </div>
        <button 
          onClick={() => {
            setEditingAarti(null);
            setShowModal(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus size={24} /> Add New Aarti
        </button>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-2 mb-8 flex items-center gap-4">
        <div className="pl-6 text-slate-500"><Search size={20} /></div>
        <input 
          className="flex-1 bg-transparent py-4 text-white font-bold outline-none placeholder:text-slate-600"
          placeholder="Search Aartis by title or deity..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAartis.map(aarti => (
            <div key={aarti.id} className="bg-[#1E293B] border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all group shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={aarti.thumbnail || 'https://images.unsplash.com/photo-1590050752117-23a9d7fc2440?auto=format&fit=crop&q=80&w=800'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={aarti.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent opacity-80" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                    {aarti.category}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-white line-clamp-1 flex-1 mr-2">{aarti.title}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingAarti(aarti);
                        setFormData(aarti);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteAarti(aarti.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm font-bold">
                  <span className="flex items-center gap-1.5"><Music size={14} className="text-amber-500" /> Audio</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-amber-500" /> Lyrics Available</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs line-clamp-2 italic">
                  {aarti.description || 'No lyrics added yet.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1E293B] w-full max-w-2xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50">
              <h2 className="text-2xl font-black text-white">{editingAarti ? 'Edit Aarti' : 'Add New Aarti'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-all">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Aarti Title</label>
                <input 
                  required
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none font-bold"
                  placeholder="e.g. Om Jai Jagdish Hare"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Category / Deity</label>
                <select 
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none font-bold"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Audio Source</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      required
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-amber-500 outline-none font-bold"
                      placeholder="YouTube ID or Audio URL..."
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><LinkIcon size={20} /></div>
                  </div>
                  <label className={`w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${uploading ? 'bg-slate-800' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                {uploading && (
                  <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Thumbnail Image URL</label>
                <input 
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none font-bold"
                  placeholder="Paste image URL here..."
                  value={formData.thumbnail}
                  onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Aarti Lyrics</label>
                <textarea 
                  required
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-3xl px-6 py-4 text-white focus:border-amber-500 outline-none font-bold min-h-[200px]"
                  placeholder="Paste Aarti lyrics here..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-amber-500 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-amber-500/25 disabled:opacity-50 mt-4"
              >
                {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                {editingAarti ? 'Update Aarti' : 'Save Aarti'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
