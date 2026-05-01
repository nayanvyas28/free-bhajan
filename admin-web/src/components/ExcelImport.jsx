import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

export default function ExcelImport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws);
      setData(json);
      setStatus({ type: 'success', message: `Loaded ${json.length} records. Click "Import" to save to database.` });
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    setLoading(true);
    setStatus({ type: 'info', message: 'Importing data...' });

    try {
      // Process data to ensure it matches schema
      const formattedData = data.map(item => ({
        title: item.title || 'Untitled',
        url: item.url || '',
        type: item.type || 'youtube',
        category: item.category || 'Krishna',
        thumbnail: item.thumbnail || (item.type === 'youtube' ? `https://img.youtube.com/vi/${item.url}/maxresdefault.jpg` : '')
      }));

      const { error } = await supabase.from('bhajans').insert(formattedData);

      if (error) throw error;

      setStatus({ type: 'success', message: `Successfully imported ${formattedData.length} bhajans!` });
      setData([]);
    } catch (error) {
      setStatus({ type: 'error', message: 'Import failed: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { title: 'Mere Kanha', url: 'dQw4w9WgXcQ', type: 'youtube', category: 'Krishna', thumbnail: '' },
      { title: 'Shiv Dhun', url: 'https://example.com/audio.mp3', type: 'audio', category: 'Shiv', thumbnail: '' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bhajans");
    XLSX.writeFile(wb, "bhajan_import_template.xlsx");
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-black text-white">Bulk Import</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Upload Excel sheet to add multiple bhajans at once</p>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-sm font-black transition-all border border-slate-700"
          >
            <Download size={18} /> Template
          </button>
        </div>

        <div className="p-10 space-y-8">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-800 rounded-3xl bg-[#0F172A]/50 p-12 text-center group hover:border-amber-500/50 transition-all">
            <input 
              type="file" 
              id="excel-upload" 
              className="hidden" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-4">
              <div className="p-6 bg-amber-500/10 rounded-full text-amber-500 group-hover:scale-110 transition-transform shadow-inner">
                <FileSpreadsheet size={48} />
              </div>
              <div>
                <span className="text-xl font-black text-white block mb-1">Select Excel File</span>
                <p className="text-slate-500 font-bold">Drag and drop or click to browse</p>
              </div>
              <p className="text-xs text-slate-600 font-black uppercase tracking-widest mt-2">Supports .xlsx, .xls, .csv</p>
            </label>
          </div>

          {/* Status Message */}
          {status.message && (
            <div className={`p-5 rounded-2xl flex items-center gap-4 border-2 ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={24} /> : 
               status.type === 'error' ? <AlertCircle size={24} /> : 
               <Loader2 className="animate-spin" size={24} />}
              <span className="font-bold">{status.message}</span>
            </div>
          )}

          {/* Data Preview */}
          {data.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white ml-1">Data Preview</h3>
                <span className="text-xs font-black text-slate-500 uppercase bg-[#0F172A] px-4 py-2 rounded-full border border-slate-800">
                  {data.length} Rows Detected
                </span>
              </div>
              <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Category</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 font-bold text-sm">
                    {data.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-6 py-4 truncate max-w-[200px]">{row.title}</td>
                        <td className="px-6 py-4 uppercase text-[10px]"><span className="bg-slate-800 px-2 py-1 rounded-md">{row.type}</span></td>
                        <td className="px-6 py-4">{row.category}</td>
                      </tr>
                    ))}
                    {data.length > 5 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-3 text-center text-slate-500 italic text-xs">
                          ...and {data.length - 5} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button 
                onClick={handleImport}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-50 disabled:scale-100 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                Start Bulk Import
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
