import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Video, Music, Save, Loader2, Link as LinkIcon, Layout, Image as ImageIcon, Tags } from 'lucide-react';

export default function AddBhajan() {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('youtube');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    sub_type: 'Bhajan',
    thumbnail: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('name').order('name');
      if (data) {
        setCategories(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    };
    fetchCategories();
  }, []);

  const fetchYoutubeDetails = async (videoId) => {
    const idMatch = videoId.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/);
    return idMatch ? idMatch[1] : videoId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalUrl = formData.url;
      let finalThumb = formData.thumbnail;

      if (type === 'youtube') {
        finalUrl = await fetchYoutubeDetails(formData.url);
        finalThumb = `https://img.youtube.com/vi/${finalUrl}/maxresdefault.jpg`;
      }

      const { error } = await supabase.from('bhajans').insert([
        { 
          title: formData.title,
          type: type,
          url: finalUrl,
          thumbnail: finalThumb,
          category: formData.category,
          sub_type: formData.sub_type
        }
      ]);

      if (error) throw error;
      
      alert('Content added successfully!');
      setFormData(prev => ({ ...prev, title: '', url: '', thumbnail: '' }));
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `bhajans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      setFormData({ ...formData, url: publicUrl });
      alert('Audio uploaded!');
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-black text-white">Add New Content</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Expanding the divine collection</p>
          </div>
          <div className="flex bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setType('youtube')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${type === 'youtube' ? 'bg-amber-500 shadow-lg shadow-amber-500/30 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Video size={18} /> YouTube
            </button>
            <button 
              onClick={() => setType('audio')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${type === 'audio' ? 'bg-amber-500 shadow-lg shadow-amber-500/30 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Music size={18} /> Audio
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
            <input 
              required
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-bold"
              placeholder="e.g. Mere Kanha Ki Muskan"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="flex gap-6">
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Deity / Category</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none appearance-none font-bold"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c.name}>{c.name}</option>)}
                  <option>Other</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Layout size={20} />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none appearance-none font-bold"
                  value={formData.sub_type}
                  onChange={e => setFormData({...formData, sub_type: e.target.value})}
                >
                  <option>Bhajan</option>
                  <option>Mantra</option>
                  <option>Song</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Tags size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
              {type === 'youtube' ? 'YouTube Link or Video ID' : 'Audio File URL'}
            </label>
            <div className="relative">
              <input 
                required
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                placeholder={type === 'youtube' ? 'Paste YouTube link here...' : 'Paste direct MP3 link here...'}
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <LinkIcon size={22} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Thumbnail URL</label>
            <div className="relative">
              <input 
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                placeholder="Paste image/thumbnail URL here..."
                value={formData.thumbnail}
                onChange={e => setFormData({...formData, thumbnail: e.target.value})}
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <ImageIcon size={22} />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-500 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-amber-500/25 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              Confirm and Save Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
