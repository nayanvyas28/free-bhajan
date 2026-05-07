import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Loader2, Save, X, Lightbulb, Image as ImageIcon, Video, Link as LinkIcon, Eye, EyeOff, Music, Database } from 'lucide-react';
import { uploadToR2, deleteFromR2 } from '../lib/r2';

export default function ManageSolutions() {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Health',
    image_url: '',
    url: '',
    type: 'video',
    duration: 0,
    is_visible: true
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const CATEGORIES = ['Health', 'Wealth', 'Job', 'Family', 'Peace', 'Other'];

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setSolutions(data);
    } catch (err) {
      console.error('Fetch Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYoutubeDetails = (url) => {
    if (!url) return '';
    const idMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/);
    return idMatch ? idMatch[1] : url;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-set title if empty
      if (!formData.title) {
        const name = file.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, title: name }));
      }

      // Extract duration
      const media = document.createElement(formData.type === 'video' ? 'video' : 'audio');
      media.preload = 'metadata';
      media.onloadedmetadata = () => {
        window.URL.revokeObjectURL(media.src);
        setFormData(prev => ({ ...prev, duration: Math.floor(media.duration) }));
      };
      media.src = URL.createObjectURL(file);
    }
  };

  const handleManualUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const publicUrl = await uploadToR2(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(100);
      setFormData({ ...formData, url: publicUrl });
      alert(`${formData.type} uploaded successfully!`);
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalData = { ...formData };
      
      if (formData.type === 'video' && formData.url.includes('youtube.com')) {
        const videoId = fetchYoutubeDetails(formData.url);
        finalData.url = videoId;
        if (!finalData.image_url) {
          finalData.image_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from('solutions')
          .update(finalData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Updated successfully!');
      } else {
        const { error } = await supabase
          .from('solutions')
          .insert([finalData]);
        if (error) throw error;
        alert('Added successfully!');
      }
      
      setFormData({ title: '', description: '', category: 'Health', image_url: '', url: '', type: 'video', duration: 0, is_visible: true });
      setEditingId(null);
      setShowAddForm(false);
      setSelectedFile(null);
      fetchSolutions();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      image_url: item.image_url || '',
      url: item.url || '',
      type: item.type || 'video',
      duration: item.duration || 0,
      is_visible: item.is_visible !== false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    const item = solutions.find(s => s.id === id);
    if (!window.confirm(`Delete solution "${item?.title}"?`)) return;
    
    // Delete from Cloudflare if it's an R2 URL
    if (item?.url) {
      await deleteFromR2(item.url);
    }

    const { error } = await supabase.from('solutions').delete().eq('id', id);
    if (!error) fetchSolutions();
  };

  const toggleVisibility = async (item) => {
    const newStatus = item.is_visible === false ? true : false;
    const { error } = await supabase
      .from('solutions')
      .update({ is_visible: newStatus })
      .eq('id', item.id);
    
    if (!error) {
      setSolutions(solutions.map(s => s.id === item.id ? { ...s, is_visible: newStatus } : s));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white">Upaye Management</h2>
          <p className="text-slate-400 font-medium">Manage daily solutions and divine guidance</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) { 
              setEditingId(null); 
              setFormData({ title: '', description: '', category: 'Health', image_url: '', url: '', type: 'video', is_visible: true });
              setSelectedFile(null);
            }
          }}
          className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          {showAddForm ? 'Cancel' : 'Add New Upaye'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#1E293B] rounded-3xl p-8 border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#0F172A] p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center gap-4">
                {[
                  { id: 'video', label: 'Video Upaye', icon: Video },
                  { id: 'audio', label: 'Audio Upaye', icon: Music },
                  { id: 'text', label: 'Text Upaye', icon: Lightbulb }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.id, url: '' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all border ${formData.type === t.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                  >
                    <t.icon size={18} />
                    {t.label}
                  </button>
                ))}
              </div>

              {formData.type !== 'text' && (
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Cloud Hosting (Cloudflare R2)</p>
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Securely host your {formData.type} directly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${uploading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'}`}>
                      {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : selectedFile ? `Selected: ${selectedFile.name.substring(0, 10)}...` : 'Select File'}
                      {!uploading && (
                        <input 
                          type="file" 
                          accept={formData.type === 'video' ? "video/*" : "audio/*"} 
                          className="hidden" 
                          onChange={handleFileChange} 
                        />
                      )}
                    </label>
                    {selectedFile && !uploading && !formData.url && (
                      <button
                        type="button"
                        onClick={handleManualUpload}
                        className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Database size={20} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Title</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Category</label>
                  <select 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none appearance-none font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">{formData.type === 'video' ? 'YouTube / Cloud URL' : 'Audio URL'}</label>
                  <input 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="Enter URL..."
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Thumbnail URL</label>
                  <input 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="Optional"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Duration (Seconds)</label>
                <input 
                  type="number"
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                  placeholder="Auto-detected on file select..."
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Upaye Description</label>
              <textarea 
                required
                rows={4}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
              <div>
                <p className="text-white font-bold text-sm">App Visibility</p>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-0.5">Show this solution to users</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black transition-all ${formData.is_visible ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {formData.is_visible ? <><Eye size={18} /> Visible</> : <><EyeOff size={18} /> Hidden</>}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
              {editingId ? 'Update Upaye' : 'Save Upaye'}
            </button>
          </form>
        </div>
      )}

      {loading && !showAddForm ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map(item => (
            <div key={item.id} className="bg-[#1E293B] rounded-3xl border border-slate-800 p-6 flex flex-col hover:border-amber-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20">
                  {item.category}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl">
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => toggleVisibility(item)}
                    className={`p-2 rounded-xl border transition-all ${item.is_visible !== false ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                  >
                    {item.is_visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
              
              {item.image_url && (
                <div className="relative w-full h-40 mb-4 rounded-2xl overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  {item.url && (item.type === 'video') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Video size={32} className="text-white" />
                    </div>
                  )}
                  {item.url && (item.type === 'audio') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Music size={32} className="text-white" />
                    </div>
                  )}
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">{item.description}</p>
              
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                  {item.type === 'video' ? <Video size={20} /> : item.type === 'audio' ? <Music size={20} /> : <Lightbulb size={20} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold capitalize">{item.type || 'Text'} Upaye</span>
                  {item.duration > 0 && (
                    <span className="text-[10px] text-amber-500 font-black">{Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
