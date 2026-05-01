import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Loader2, Save, X, Lightbulb, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';

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
    video_url: ''
  });

  const CATEGORIES = ['Health', 'Wealth', 'Job', 'Family', 'Peace', 'Other'];

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      console.log('Fetching solutions...');
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase Error:', error);
        alert('Database Error: ' + error.message);
      }
      
      if (data) {
        console.log('Fetched solutions:', data);
        setSolutions(data);
      }
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

  const [addToLibrary, setAddToLibrary] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalData = { ...formData };
      
      // If video_url is provided, ensure it's just the ID
      if (finalData.video_url) {
        const videoId = fetchYoutubeDetails(finalData.video_url);
        finalData.video_url = videoId;
        // If image_url is empty, use YouTube thumbnail
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
        // Insert into solutions
        const { error } = await supabase
          .from('solutions')
          .insert([finalData]);
        if (error) throw error;

        // Optionally insert into library (bhajans table)
        if (addToLibrary) {
          const bhajanData = {
            title: finalData.title,
            description: finalData.description,
            type: 'youtube',
            url: finalData.video_url,
            thumbnail: finalData.image_url,
            category: finalData.category,
            sub_type: 'Mantra'
          };
          const { error: bhajanError } = await supabase
            .from('bhajans')
            .insert([bhajanData]);
          if (bhajanError) console.error('Error adding to library:', bhajanError);
        }

        alert('Added successfully!');
      }
      
      setFormData({ title: '', description: '', category: 'Health', image_url: '', video_url: '' });
      setEditingId(null);
      setShowAddForm(false);
      setAddToLibrary(false);
      fetchSolutions();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      image_url: item.image_url || '',
      video_url: item.video_url || ''
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this solution?')) return;
    const { error } = await supabase.from('solutions').delete().eq('id', id);
    if (!error) fetchSolutions();
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
              setFormData({ title: '', description: '', category: 'Health', image_url: '', video_url: '' }); 
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
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Video URL (YouTube)</label>
                <div className="relative">
                  <input 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="Paste YouTube link..."
                    value={formData.video_url}
                    onChange={e => setFormData({...formData, video_url: e.target.value})}
                  />
                  <Video size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Image URL (Optional)</label>
                <div className="relative">
                  <input 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="Auto-fetched from YT if empty"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                  />
                  <ImageIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Description / Content</label>
              <textarea 
                required
                rows={4}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex items-center gap-3 bg-[#0F172A] p-4 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer" onClick={() => setAddToLibrary(!addToLibrary)}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${addToLibrary ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-slate-800'}`}>
                {addToLibrary && <Plus size={16} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">Also add to Mantra Library</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">This will also show up in the main library</p>
              </div>
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
                </div>
              </div>
              
              {item.image_url && (
                <div className="relative w-full h-40 mb-4 rounded-2xl overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  {item.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Video size={32} className="text-white" />
                    </div>
                  )}
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">{item.description}</p>
              
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  {item.video_url ? <Video size={20} /> : <Lightbulb size={20} />}
                </div>
                <span className="text-xs font-bold">{item.video_url ? 'Video Upaye' : 'Divine Guidance'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
