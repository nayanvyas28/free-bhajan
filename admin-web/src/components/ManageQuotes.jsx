import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Loader2, Save, X, Quote, Eye, EyeOff, Languages, Sparkles } from 'lucide-react';

export default function ManageQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    text_en: '',
    text_hi: '',
    author_en: '',
    author_hi: '',
    is_active: true
  });

  const PREDEFINED_QUOTES = [
    { 
      text_en: "The soul is neither born, nor does it ever die.", 
      text_hi: "आत्मा न तो पैदा होती है और न ही कभी मरती है।", 
      author_en: "Bhagavad Gita", 
      author_hi: "श्रीमद्भगवद्गीता" 
    },
    { 
      text_en: "Set your heart upon your work, but never its reward.", 
      text_hi: "कर्म पर अपना दिल लगाओ, लेकिन उसके फल पर कभी नहीं।", 
      author_en: "Lord Krishna", 
      author_hi: "श्री कृष्ण" 
    },
    { 
      text_en: "Change is the law of the universe. You can be a millionaire, or a pauper in an instant.", 
      text_hi: "परिवर्तन ही सृष्टि का नियम है। आप एक पल में करोड़पति या कंगाल हो सकते हैं।", 
      author_en: "Bhagavad Gita", 
      author_hi: "श्रीमद्भगवद्गीता" 
    },
    { 
      text_en: "A man is made by his belief. As he believes, so he is.", 
      text_hi: "मनुष्य अपने विश्वास से निर्मित होता है। जैसा वह विश्वास करता है, वैसा ही वह बन जाता है।", 
      author_en: "Lord Krishna", 
      author_hi: "श्री कृष्ण" 
    },
    { 
      text_en: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", 
      text_hi: "जब ध्यान सिद्ध हो जाता है, तो मन हवा रहित स्थान पर मोमबत्ती की लौ की तरह स्थिर हो जाता है।", 
      author_en: "Bhagavad Gita", 
      author_hi: "श्रीमद्भगवद्गीता" 
    },
    { 
      text_en: "Perform your obligatory duty, for action is indeed better than inaction.", 
      text_hi: "अपना अनिवार्य कर्तव्य निभाएं, क्योंकि कर्म वास्तव में अकर्म से बेहतर है।", 
      author_en: "Lord Krishna", 
      author_hi: "श्री कृष्ण" 
    },
    { 
      text_en: "Peace is the highest form of happiness.", 
      text_hi: "शांति खुशी का उच्चतम रूप है।", 
      author_en: "Gautam Buddha", 
      author_hi: "गौतम बुद्ध" 
    },
    { 
      text_en: "Truth can only be experienced, not described.", 
      text_hi: "सत्य का केवल अनुभव किया जा सकता है, उसका वर्णन नहीं।", 
      author_en: "Spiritual Wisdom", 
      author_hi: "आध्यात्मिक ज्ञान" 
    },
    { 
      text_en: "Happiness is a state of mind, it has nothing to do with the external world.", 
      text_hi: "खुशी मन की एक अवस्था है, इसका बाहरी दुनिया से कोई लेना-देना नहीं है।", 
      author_en: "Lord Krishna", 
      author_hi: "श्री कृष्ण" 
    },
    { 
      text_en: "Whatever happened, happened for the good. Whatever is happening, is happening for the good. Whatever will happen, will also happen for the good.", 
      text_hi: "जो हुआ, वह अच्छा हुआ। जो हो रहा है, वह अच्छा हो रहा है। जो होगा, वह भी अच्छा ही होगा।", 
      author_en: "Bhagavad Gita", 
      author_hi: "श्रीमद्भगवद्गीता" 
    }
  ];

  const handleAutoGenerate = () => {
    const randomQuote = PREDEFINED_QUOTES[Math.floor(Math.random() * PREDEFINED_QUOTES.length)];
    setFormData({
      ...formData,
      text_en: randomQuote.text_en,
      text_hi: randomQuote.text_hi,
      author_en: randomQuote.author_en,
      author_hi: randomQuote.author_hi
    });
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    // Note: If table doesn't exist yet, this will fail gracefully
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setQuotes(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('quotes')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Quote updated successfully!');
      } else {
        const { error } = await supabase
          .from('quotes')
          .insert([formData]);
        if (error) throw error;
        alert('New Divine Quote added!');
      }
      
      setFormData({ text_en: '', text_hi: '', author_en: '', author_hi: '', is_active: true });
      setEditingId(null);
      setShowAddForm(false);
      fetchQuotes();
    } catch (error) {
      alert(error.message + "\n\nPlease ensure the 'quotes' table exists in Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      text_en: item.text_en,
      text_hi: item.text_hi,
      author_en: item.author_en,
      author_hi: item.author_hi,
      is_active: item.is_active !== false
    });
    setEditingId(item.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this divine quote?')) return;
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (!error) fetchQuotes();
  };

  const toggleStatus = async (item) => {
    const newStatus = !item.is_active;
    const { error } = await supabase
      .from('quotes')
      .update({ is_active: newStatus })
      .eq('id', item.id);
    
    if (!error) {
      setQuotes(quotes.map(q => q.id === item.id ? { ...q, is_active: newStatus } : q));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[#1E293B]/30 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-white">Daily Divine Quotes</h2>
          <p className="text-slate-400 font-medium">Manage spiritual wisdom for the Home screen</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAutoGenerate}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles size={20} />
            Auto-Generate
          </button>
          <button 
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) { setEditingId(null); setFormData({ text_en: '', text_hi: '', author_en: '', author_hi: '', is_active: true }); }
            }}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 ${showAddForm ? 'bg-slate-700 text-white' : 'bg-amber-500 text-white shadow-amber-500/30'}`}
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
            {showAddForm ? 'Close Editor' : 'Add New Quote'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-[#1E293B] rounded-3xl p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* English Section */}
              <div className="space-y-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Languages size={18} className="text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">English Content</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Quote Text (EN)</label>
                  <textarea 
                    required
                    rows={3}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="Enter quote in English..."
                    value={formData.text_en}
                    onChange={e => setFormData({...formData, text_en: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Author (EN)</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="e.g. Bhagavad Gita"
                    value={formData.author_en}
                    onChange={e => setFormData({...formData, author_en: e.target.value})}
                  />
                </div>
              </div>

              {/* Hindi Section */}
              <div className="space-y-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Languages size={18} className="text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Hindi Content (हिंदी)</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Quote Text (HI)</label>
                  <textarea 
                    required
                    rows={3}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="हिंदी में विचार लिखें..."
                    value={formData.text_hi}
                    onChange={e => setFormData({...formData, text_hi: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Author (HI)</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold"
                    placeholder="जैसे: श्रीमद्भगवद्गीता"
                    value={formData.author_hi}
                    onChange={e => setFormData({...formData, author_hi: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black transition-all border ${formData.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                >
                  {formData.is_active ? <Eye size={20} /> : <EyeOff size={20} />}
                  {formData.is_active ? 'Active' : 'Hidden'}
                </button>
                <p className="text-xs font-bold text-slate-500">Quotes marked as 'Hidden' won't appear on the app.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="bg-amber-500 text-white px-12 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {editingId ? 'Update Quote' : 'Publish Quote'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-amber-500" size={60} />
          <p className="text-slate-500 font-bold animate-pulse">Loading wisdom...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quotes.map(item => (
            <div key={item.id} className="bg-[#1E293B] rounded-[2.5rem] border border-slate-800 p-8 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-slate-800 group-hover:text-amber-500/20 transition-colors">
                <Quote size={80} />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {item.is_active ? 'Live on App' : 'Hidden'}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-lg font-bold text-white italic">"{item.text_hi}"</p>
                    <p className="text-amber-500 font-black text-sm mt-2">— {item.author_hi}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-800/50">
                    <p className="text-sm font-medium text-slate-400 italic">"{item.text_en}"</p>
                    <p className="text-slate-500 font-bold text-xs mt-1">— {item.author_en}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={() => setShowAddForm(true)}
            className="rounded-[2.5rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-slate-600 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group min-h-[250px]"
          >
            <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
              <Plus size={32} />
            </div>
            <span className="font-black text-sm uppercase tracking-widest mt-4">Add New Divine Quote</span>
          </button>
        </div>
      )}
    </div>
  );
}
