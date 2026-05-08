import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Loader2, Save, X, Flower2, Image as ImageIcon, Stars, Eye, EyeOff, Lightbulb } from 'lucide-react';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    type: 'deity',
    is_visible: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    
    if (data) setCategories(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Category updated successfully!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);
        if (error) throw error;
        alert('New category added!');
      }
      
      setFormData({ name: '', image_url: '', type: 'deity' });
      setEditingId(null);
      setShowAddForm(false);
      fetchCategories();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      image_url: item.image_url,
      type: item.type || 'deity',
      is_visible: item.is_visible !== false
    });
    setEditingId(item.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? Removing this category will not delete bhajans, but they will lose their category tag.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
  };

  const toggleVisibility = async (item) => {
    const newStatus = item.is_visible === false ? true : false;
    const { error } = await supabase
      .from('categories')
      .update({ is_visible: newStatus })
      .eq('id', item.id);
    
    if (!error) {
      setCategories(categories.map(c => c.id === item.id ? { ...c, is_visible: newStatus } : c));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[#1E293B]/30 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-white">Explore Management</h2>
          <p className="text-slate-400 font-medium">Add, Edit or Remove Deities & Kundli Dosh</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) { setEditingId(null); setFormData({ name: '', image_url: '', type: 'deity' }); }
          }}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 ${showAddForm ? 'bg-slate-700 text-white' : 'bg-amber-500 text-white shadow-amber-500/30'}`}
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          {showAddForm ? 'Close Editor' : 'Add New Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#1E293B] rounded-3xl p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-6 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                    <input 
                      required
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                      placeholder="e.g. Mahadev / Rahu Dosh"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Section Type</label>
                    <select 
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none appearance-none font-bold"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="deity">Bhagwan (Deity)</option>
                      <option value="dosh">Kundli Dosh</option>
                      <option value="solution">Upaye Category</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">App Visibility</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all border ${formData.is_visible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        {formData.is_visible ? <Eye size={20} /> : <EyeOff size={20} />}
                        {formData.is_visible ? 'Visible on App' : 'Hidden from App'}
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-all ${formData.is_visible ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_visible ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Image Link (Photo URL)</label>
                  <div className="relative">
                    <input 
                      required
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                      placeholder="Paste high-quality image URL here..."
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                      <ImageIcon size={22} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Live Preview</label>
                <div className="aspect-[4/5] bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 overflow-hidden flex items-center justify-center relative group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src='https://via.placeholder.com/400x500?text=Invalid+Image+URL'} />
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon size={40} className="text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold">Image preview will appear here</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                    <p className="text-white font-black text-xl leading-tight">{formData.name || 'Category Name'}</p>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      {formData.type === 'deity' ? 'Devotional Selection' : formData.type === 'dosh' ? 'Astrological Guide' : 'Remedy Category'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
              {editingId ? 'Update Category' : 'Create Category'}
            </button>
          </form>
        </div>
      )}

      {loading && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-amber-500" size={60} />
          <p className="text-slate-500 font-bold animate-pulse">Fetching your divine collection...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {['deity', 'dosh', 'solution'].map(type => (
            <div key={type} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800" />
                <h3 className="text-2xl font-black text-white flex items-center gap-3 px-4">
                  {type === 'deity' ? <Flower2 className="text-amber-500" /> : type === 'dosh' ? <Stars className="text-amber-500" /> : <Lightbulb className="text-amber-500" />}
                  {type === 'deity' ? 'Bhagwan Categories' : type === 'dosh' ? 'Kundli Dosh Categories' : 'Upaye Categories'}
                </h3>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {categories.filter(c => (c.type || 'deity') === type).map(item => (
                  <div key={item.id} className="bg-[#1E293B] rounded-[2.5rem] border border-slate-800 overflow-hidden hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group">
                    <div className="h-56 bg-slate-900 relative">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-[#1E293B]/20 to-transparent" />
                      
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-2xl hover:bg-amber-500 transition-colors border border-white/10"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-3 bg-red-500/20 backdrop-blur-xl text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-white leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                             <div className={`w-2 h-2 rounded-full shadow-lg ${item.is_visible !== false ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                               {item.is_visible !== false ? 'Active Category' : 'Hidden Category'}
                             </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleVisibility(item)}
                          className={`p-3 rounded-2xl border transition-all ${item.is_visible !== false ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/20 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                        >
                          {item.is_visible !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="h-56 rounded-[2.5rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Plus size={32} />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">Add New {type}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
