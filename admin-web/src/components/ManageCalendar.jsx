import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar as CalendarIcon, 
  Save,
  X,
  Loader2,
  BookOpen,
  MapPin,
  Upload
} from 'lucide-react';

export default function ManageCalendar() {
  const [events, setEvents] = useState([]);
  const [kathas, setKathas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    event_date: new Date().toISOString().split('T')[0],
    type: 'Festival',
    tithi: '',
    paksha: 'Shukla',
    katha_id: null
  });

  useEffect(() => {
    fetchEvents();
    fetchKathas();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('festivals')
      .select('*, kathas(title, content, content_hi)')
      .order('event_date', { ascending: true });
    
    if (error) console.error('Error fetching events:', error);
    else setEvents(data || []);
    setLoading(false);
  };

  const fetchKathas = async () => {
    const { data } = await supabase.from('kathas').select('id, title, content, content_hi');
    setKathas(data || []);
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
          event_date: row.event_date || row.Date || row.Event_Date || new Date().toISOString().split('T')[0],
          type: row.type || row.Type || 'Festival',
          tithi: row.tithi || row.Tithi || '',
          paksha: row.paksha || row.Paksha || 'Shukla',
          katha_id: row.katha_id || row.Katha_ID || null
        }));

        const { error } = await supabase.from('festivals').insert(cleanedData);

        if (error) {
          console.error('Error inserting bulk events:', error);
          alert('Error: ' + error.message);
        } else {
          alert(`Successfully uploaded ${cleanedData.length} events! 🙏`);
          fetchEvents();
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
      title: 'Festival Name',
      title_hi: 'त्यौहार का नाम',
      event_date: '2024-05-12',
      type: 'Festival',
      tithi: 'Ekadashi',
      paksha: 'Shukla'
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CalendarTemplate");
    XLSX.writeFile(wb, "Calendar_Bulk_Upload_Template.xlsx");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: formData.title,
      title_hi: formData.title_hi,
      event_date: formData.event_date,
      type: formData.type,
      tithi: formData.tithi,
      paksha: formData.paksha,
      katha_id: formData.katha_id === "" ? null : formData.katha_id
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('festivals')
        .update(payload)
        .eq('id', editingEvent.id);
      if (error) alert('Update Error: ' + error.message);
    } else {
      const { error } = await supabase
        .from('festivals')
        .insert([payload]);
      if (error) alert('Insert Error: ' + error.message);
    }

    setShowModal(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      title_hi: '',
      event_date: new Date().toISOString().split('T')[0],
      type: 'Festival',
      tithi: '',
      paksha: 'Shukla',
      katha_id: null
    });
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const { error } = await supabase
        .from('festivals')
        .delete()
        .eq('id', id);
      if (error) alert('Error deleting event');
      else fetchEvents();
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.title_hi.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <CalendarIcon className="text-amber-500" size={32} />
            Manage Spiritual Calendar
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Manage festivals, Ekadashis and Vrats</p>
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
              setEditingEvent(null);
              setFormData({
                title: '',
                title_hi: '',
                event_date: new Date().toISOString().split('T')[0],
                type: 'Festival',
                tithi: '',
                paksha: 'Shukla',
                katha_id: null
              });
              setShowModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-[#1E293B] p-4 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-xl">
        <Search className="text-slate-500 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search calendar events..." 
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
        <div className="bg-[#1E293B] rounded-3xl border border-slate-800 overflow-x-auto shadow-xl custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-6 py-5">Date</th>
                 <th className="px-6 py-5">Event</th>
                 <th className="px-6 py-5">Vedic Details</th>
                 <th className="px-6 py-5">Katha Preview</th>
                 <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEvents.map(event => (
                <tr key={event.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex flex-col items-center justify-center border border-amber-500/20">
                        <span className="text-xs font-black text-amber-500 uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm font-black text-white">{new Date(event.event_date).getDate()}</span>
                      </div>
                      <span className="text-slate-400 font-bold text-sm">{event.event_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-white">{event.title}</div>
                    <div className="text-amber-500 font-bold text-xs">{event.title_hi}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-800 text-slate-300 border border-slate-700">
                      {event.tithi} • {event.paksha}
                    </span>
                  </td>
                   <td className="px-6 py-5 max-w-xs">
                     {event.kathas ? (
                       <div className="space-y-1">
                         <div className="flex items-center gap-2 text-white font-black text-sm">
                           <BookOpen size={14} className="text-amber-500" />
                           {event.kathas.title}
                         </div>
                         <p className="text-slate-500 text-xs line-clamp-2 font-medium">
                           {event.kathas.content_hi || event.kathas.content}
                         </p>
                       </div>
                     ) : (
                       <span className="text-slate-600 text-xs italic">No katha linked</span>
                     )}
                   </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingEvent(event);
                          setFormData({
                            ...event,
                            katha_id: event.katha_id || ""
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-[#1E293B] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                {editingEvent ? 'Edit Calendar Event' : 'Add Calendar Event'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Event Title</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Hindi Title</label>
                  <input 
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.title_hi}
                    onChange={e => setFormData({...formData, title_hi: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Event Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.event_date}
                    onChange={e => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Tithi</label>
                  <input 
                    placeholder="e.g. Ekadashi"
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.tithi}
                    onChange={e => setFormData({...formData, tithi: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Paksha</label>
                  <select 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.paksha}
                    onChange={e => setFormData({...formData, paksha: e.target.value})}
                  >
                    <option value="Shukla">Shukla</option>
                    <option value="Krishna">Krishna</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Link Vrat Katha</label>
                  <select 
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                    value={formData.katha_id || ""}
                    onChange={e => setFormData({...formData, katha_id: e.target.value})}
                  >
                    <option value="">None</option>
                    {kathas.map(k => (
                      <option key={k.id} value={k.id}>{k.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.katha_id && (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Katha Preview (Full Story)</h4>
                    <BookOpen size={16} className="text-slate-600" />
                  </div>
                  <div className="max-h-40 overflow-y-auto text-slate-400 text-sm font-medium leading-relaxed custom-scrollbar">
                    {kathas.find(k => k.id === formData.katha_id)?.content_hi || 
                     kathas.find(k => k.id === formData.katha_id)?.content || 
                     'Story content will appear here...'}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Save Event
                </button>
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
