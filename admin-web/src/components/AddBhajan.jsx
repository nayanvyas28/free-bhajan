import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { Video, Music, Save, Loader2, Link as LinkIcon, Layout, Image as ImageIcon, Tags, Upload, Database, Eye, EyeOff } from 'lucide-react';

export default function AddBhajan() {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('youtube');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    sub_type: 'Bhajan',
    thumbnail: '',
    duration: 0,
    is_visible: true
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleManualUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const publicUrl = await uploadToR2(selectedFile);
      setUploadProgress(100);
      
      setFormData({ ...formData, url: publicUrl });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (error) {
      console.error("Upload Error:", error);
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) return alert('Please select a category');
    
    setLoading(true);
    let finalUrl = formData.url;
    let finalThumb = formData.thumbnail;

    try {
      if (!finalUrl) {
        setLoading(false);
        return alert('Please enter a URL or upload a file first');
      }

      if (type === 'youtube') {
        finalUrl = await fetchYoutubeDetails(formData.url);
        if (!formData.thumbnail) {
          finalThumb = `https://img.youtube.com/vi/${finalUrl}/maxresdefault.jpg`;
        }
      }

      const { error } = await supabase.from('bhajans').insert([
        { 
          title: formData.title,
          type: type,
          url: finalUrl,
          thumbnail: finalThumb,
          category: formData.category,
          sub_type: formData.sub_type,
          duration: formData.duration,
          is_visible: formData.is_visible
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
      const media = document.createElement(type === 'video' ? 'video' : 'audio');
      media.preload = 'metadata';
      media.onloadedmetadata = () => {
        window.URL.revokeObjectURL(media.src);
        setFormData(prev => ({ ...prev, duration: Math.floor(media.duration) }));
      };
      media.src = URL.createObjectURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-10 border-b border-slate-800 flex flex-col gap-6 bg-[#1e293b]/50 backdrop-blur-sm">
          <div className="flex justify-between items-center">
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
                onClick={() => setType('video')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${type === 'video' ? 'bg-amber-500 shadow-lg shadow-amber-500/30 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Database size={18} /> Cloud Video
              </button>
              <button 
                onClick={() => setType('audio')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${type === 'audio' ? 'bg-amber-500 shadow-lg shadow-amber-500/30 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Music size={18} /> Cloud Audio
              </button>
            </div>
          </div>

          {(type === 'video' || type === 'audio') && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="text-amber-500" size={24} />
                <div>
                  <p className="text-white font-bold">Upload to Cloudflare R2</p>
                  <p className="text-slate-400 text-xs">Securely host your {type} files</p>
                </div>
              </div>
              <label className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${uploading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'}`}>
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Uploading...
                  </>
                ) : (
                  selectedFile ? `Selected: ${selectedFile.name.substring(0, 10)}...` : 'Select File'
                )}
                {!uploading && (
                  <input 
                    type="file" 
                    accept={type === 'video' ? "video/*" : "audio/*"} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                )}
              </label>

              {selectedFile && !uploading && !formData.url && (
                <button
                  type="button"
                  onClick={handleManualUpload}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all animate-in slide-in-from-left-4"
                >
                  <Database size={18} />
                  Upload to Cloudflare
                </button>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2 mt-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-slate-500">Uploading to Cloudflare...</span>
                <span className="text-amber-500">Processing...</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
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

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Seconds)</label>
            <input 
              type="number"
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-bold"
              placeholder="Auto-detected on file select..."
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
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
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Sub Type</label>
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
              {type === 'youtube' ? 'YouTube Link or Video ID' : 'File URL (Cloud)'}
            </label>
            <div className="relative">
              <input 
                required
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                placeholder={type === 'youtube' ? 'Paste YouTube link here...' : 'URL will appear here after upload...'}
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

          <div className="flex items-center justify-between p-6 bg-[#0F172A] border border-slate-800 rounded-2xl">
            <div>
              <p className="text-white font-bold">App Visibility</p>
              <p className="text-slate-500 text-xs mt-1">Choose if this content is visible to users</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black transition-all ${formData.is_visible ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              {formData.is_visible ? <><Eye size={18} /> Visible</> : <><EyeOff size={18} /> Hidden</>}
            </button>
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

