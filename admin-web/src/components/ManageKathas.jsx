import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Image as ImageIcon,
  Save,
  X,
  Loader2,
  Video,
  Upload,
  Database
} from 'lucide-react';

export default function ManageKathas() {
  const [kathas, setKathas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKatha, setEditingKatha] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    content: '',
    content_hi: '',
    image_url: '',
    video_url: '',
    duration: 0,
    is_active: true
  });

  useEffect(() => {
    fetchKathas();
  }, []);

  const fetchKathas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kathas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching kathas:', error);
    else setKathas(data || []);
    setLoading(false);
  };

  const fileInputRef = useRef(null);

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('Excel file is empty!');
          setLoading(false);
          return;
        }

        // Clean data for Supabase
        const cleanedData = data.map(row => ({
          title: row.title || row.Title || '',
          title_hi: row.title_hi || row.Title_HI || row.title_hindi || '',
          content: row.content || row.Content || '',
          content_hi: row.content_hi || row.Content_HI || row.content_hindi || '',
          image_url: row.image_url || row.Image_URL || '',
          video_url: row.video_url || row.Video_URL || '',
          duration: parseInt(row.duration || row.Duration || 0),
          is_active: true
        }));

        const { error } = await supabase.from('kathas').insert(cleanedData);

        if (error) {
          console.error('Error inserting bulk kathas:', error);
          alert('Error: ' + error.message);
        } else {
          alert(`Successfully uploaded ${cleanedData.length} kathas! 🙏`);
          fetchKathas();
        }
      } catch (err) {
        console.error('Bulk upload error:', err);
        alert('Error parsing Excel file.');
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = null;
  };

  const downloadTemplate = () => {
    const template = [{
      title: 'Sample Story Name',
      title_hi: 'कहानी का नाम',
      content: 'Detailed story content goes here...',
      content_hi: 'कहानी का पूरा विवरण यहाँ आएगा...',
      image_url: 'https://example.com/image.jpg',
      video_url: 'https://example.com/video.mp4',
      duration: 300
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KathaTemplate");
    XLSX.writeFile(wb, "Katha_Bulk_Upload_Template.xlsx");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (editingKatha) {
      const { error } = await supabase
        .from('kathas')
        .update(formData)
        .eq('id', editingKatha.id);
      if (error) alert('Error updating katha');
    } else {
      const { error } = await supabase
        .from('kathas')
        .insert([formData]);
      if (error) alert('Error adding katha');
    }

    setShowModal(false);
    setEditingKatha(null);
    setFormData({ title: '', title_hi: '', content: '', content_hi: '', image_url: '', video_url: '', duration: 0, is_active: true });
    fetchKathas();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this katha?')) {
      const { error } = await supabase
        .from('kathas')
        .delete()
        .eq('id', id);
      if (error) alert('Error deleting katha');
      else fetchKathas();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.split('.')[0] }));
      }
      
      // Extract duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        setFormData(prev => ({ ...prev, duration: Math.floor(video.duration) }));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToR2(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setFormData({ ...formData, video_url: url });
      alert('Video uploaded to Cloudflare successfully!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredKathas = kathas.filter(k => 
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.title_hi.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-amber-500" size={32} />
            Manage Vrat Kathas
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Add and manage sacred stories for the app</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button
            onClick={downloadTemplate}
            className="bg-slate-800 hover:bg-slate-700 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            Download Template
          </button>
          
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
          >
            <Upload size={20} />
            Bulk Import
          </button>

          <button 
            onClick={() => {
              setEditingKatha(null);
              setFormData({ title: '', title_hi: '', content: '', content_hi: '', image_url: '', video_url: '' });
              setShowModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add New Katha
          </button>
        </div>
      </div>

      <div className="bg-[#1E293B] p-4 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-xl">
        <Search className="text-slate-500 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search stories by title..." 
          className="bg-transparent border-none outline-none text-white w-full font-bold placeholder:text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !showModal ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKathas.map(katha => (
            <div key={katha.id} className="bg-[#1E293B] rounded-3xl border border-slate-800 overflow-hidden group hover:border-amber-500/50 transition-all shadow-xl">
              <div className="h-48 relative">
                <img src={katha.image_url || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover" alt={katha.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent opacity-60" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingKatha(katha);
                      setFormData(katha);
                      setShowModal(true);
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-amber-500 transition-colors shadow-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(katha.id)}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-colors shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-white line-clamp-1">{katha.title}</h3>
                <p className="text-amber-500 font-black text-sm mt-1">{katha.title_hi}</p>
                <p className="text-slate-400 mt-4 text-sm line-clamp-3 font-medium leading-relaxed">
                  {katha.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-[#1E293B] w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                {editingKatha ? 'Edit Vrat Katha' : 'Add New Vrat Katha'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Title (English)</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Title (Hindi)</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.title_hi}
                    onChange={e => setFormData({...formData, title_hi: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Image URL</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <ImageIcon className="absolute left-4 top-4 text-slate-500" size={20} />
                    <input 
                      required
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 pl-12 text-white font-bold focus:border-amber-500 outline-none transition-all"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">YouTube / Video URL (Optional)</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                        placeholder="Paste YouTube or MP4 link..."
                        value={formData.video_url}
                        onChange={e => setFormData({...formData, video_url: e.target.value})}
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                        <Video size={22} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="text-amber-500" size={24} />
                      <div>
                        <p className="text-white font-bold text-sm">Upload to Cloudflare R2</p>
                        <p className="text-slate-500 text-xs">Directly host your katha video</p>
                      </div>
                    </div>
                    <label className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${uploading ? 'bg-slate-700 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'}`}>
                      <Upload size={18} />
                      {uploading ? 'Uploading...' : (selectedFile ? 'Change File' : 'Select Video')}
                      <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                    </label>
                  </div>

                  {selectedFile && !uploading && (
                    <button 
                      type="button"
                      onClick={handleUpload}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Upload size={18} /> Start Uploading "{selectedFile.name.substring(0, 20)}..."
                    </button>
                  )}

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Katha Content (English)</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-medium focus:border-amber-500 outline-none transition-all resize-none"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Katha Content (Hindi)</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-medium focus:border-amber-500 outline-none transition-all resize-none"
                  value={formData.content_hi}
                  onChange={e => setFormData({...formData, content_hi: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-4 pt-4 sticky bottom-0 bg-[#1E293B]">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Save Katha
                </button>
                <div className="hidden md:flex flex-col items-center justify-center bg-[#0F172A] px-6 py-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                  <span className="text-amber-500 font-black">{formData.duration}s</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
