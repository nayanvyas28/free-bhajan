import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Save, Trash2, Plus, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ManageBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true });
    
    if (data) setBanners(data);
    setLoading(false);
  };

  const updateBanner = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBanner = async (banner) => {
    setSaving(true);
    const { error } = await supabase
      .from('banners')
      .upsert({
        id: banner.id,
        position: banner.position,
        image_url: banner.image_url,
        link_url: banner.link_url,
        is_visible: banner.is_visible
      });
    
    if (!error) {
      alert(`${banner.position.toUpperCase()} Banner updated successfully! 🙏`);
    } else {
      alert("Error updating banner: " + error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="manage-banners">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight">App Banners</h1>
        <p className="text-slate-400 mt-2 font-medium">Control the upside and bottom advertisements</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {['top', 'bottom'].map(pos => {
          const banner = banners.find(b => b.position === pos) || { 
            position: pos, 
            image_url: '', 
            link_url: '', 
            is_visible: false 
          };

          return (
            <div key={pos} className="bg-[#1E293B] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 p-6 ${banner.is_visible ? 'text-emerald-500' : 'text-slate-500'}`}>
                {banner.is_visible ? <Eye size={24} /> : <EyeOff size={24} />}
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500">
                  <ImageIcon size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white capitalize">{pos} Banner</h2>
                  <p className="text-slate-400 text-sm font-medium">Configure display and links</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3 block">Visibility Control</label>
                  <button 
                    onClick={() => updateBanner(banner.id, 'is_visible', !banner.is_visible)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                      banner.is_visible 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {banner.is_visible ? 'Currently Visible' : 'Hidden from App'}
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3 block">Image URL</label>
                  <input 
                    type="text" 
                    value={banner.image_url}
                    onChange={(e) => updateBanner(banner.id, 'image_url', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  />
                  {banner.image_url && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 h-32 bg-[#0F172A]">
                      <img src={banner.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3 block">Redirect Link</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={banner.link_url}
                      onChange={(e) => updateBanner(banner.id, 'link_url', e.target.value)}
                      placeholder="https://mantrapuja.com/offer"
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all pl-14"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                      <ExternalLink size={20} />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={saving}
                  onClick={() => saveBanner(banner)}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  Update {pos.toUpperCase()} Banner
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
