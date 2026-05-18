import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Save, Trash2, Plus, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ManageBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // ID of banner being saved

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (data) setBanners(data);
    setLoading(false);
  };

  const updateBanner = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBanner = async (banner) => {
    if (!banner.image_url) {
        alert("Please provide an image URL 🙏");
        return;
    }
    setSaving(banner.id);
    
    const bannerData = {
        position: banner.position,
        image_url: banner.image_url,
        link_url: banner.link_url,
        is_visible: banner.is_visible
    };

    // Only include ID if it's not a temporary string (new banner)
    if (typeof banner.id === 'number' || (typeof banner.id === 'string' && !banner.id.startsWith('temp-'))) {
        bannerData.id = banner.id;
    }

    const { data, error } = await supabase
      .from('banners')
      .upsert(bannerData)
      .select();
    
    if (!error) {
      alert(`${banner.position.toUpperCase()} Banner updated successfully! 🙏`);
      // Update the banner in state with real ID if it was temporary
      if (data && data[0]) {
          setBanners(prev => prev.map(b => b.id === banner.id ? data[0] : b));
      }
    } else {
      alert("Error updating banner: " + error.message);
    }
    setSaving(null);
  };

  const deleteBanner = async (id) => {
      if (typeof id === 'string' && id.startsWith('temp-')) {
          setBanners(banners.filter(b => b.id !== id));
          return;
      }

      if (!window.confirm("Are you sure you want to delete this banner? 🗑️")) return;

      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) {
          setBanners(banners.filter(b => b.id !== id));
      } else {
          alert("Error deleting: " + error.message);
      }
  };

  const addBanner = (position) => {
      const newBanner = {
          id: `temp-${Date.now()}`,
          position,
          image_url: '',
          link_url: '',
          is_visible: true
      };
      setBanners([newBanner, ...banners]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
            <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
            <p className="text-slate-400 font-bold animate-pulse">Loading Banners...</p>
        </div>
      </div>
    );
  }

  const BannerSection = ({ position }) => {
      const filteredBanners = banners.filter(b => b.position === position);
      
      return (
          <div className="space-y-6">
              <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-4">
                      <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500 shadow-lg shadow-amber-500/5">
                          <ImageIcon size={28} />
                      </div>
                      <div>
                          <h2 className="text-2xl font-black text-white capitalize">{position} Banners</h2>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Mobile Carousel Banners</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => addBanner(position)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                  >
                      <Plus size={20} strokeWidth={3} />
                      ADD NEW
                  </button>
              </div>

              {filteredBanners.length === 0 ? (
                  <div className="bg-[#1E293B]/30 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-16 text-center">
                      <p className="text-slate-500 font-bold italic opacity-50">No banners added for {position} position yet.</p>
                  </div>
              ) : (
                  <div className="grid gap-6">
                      {filteredBanners.map((banner) => (
                          <div key={banner.id} className="bg-[#1E293B] rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl group hover:border-amber-500/30 transition-all">
                              <div className="flex flex-col xl:flex-row gap-8">
                                  {/* Preview */}
                                  <div className="w-full xl:w-64 h-40 bg-[#0F172A] rounded-[1.5rem] overflow-hidden border border-slate-800 flex-shrink-0 relative group/preview">
                                      {banner.image_url ? (
                                          <img src={banner.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-800">
                                              <ImageIcon size={48} />
                                          </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end p-4">
                                          <span className="text-[10px] font-black text-white uppercase tracking-wider">Preview Mode</span>
                                      </div>
                                  </div>

                                  {/* Inputs */}
                                  <div className="flex-1 space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-2">
                                              <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1 block">Image Source URL</label>
                                              <div className="relative">
                                                  <input 
                                                    type="text" 
                                                    value={banner.image_url}
                                                    onChange={(e) => updateBanner(banner.id, 'image_url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all pl-12"
                                                  />
                                                  <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                                              </div>
                                          </div>
                                          <div className="space-y-2">
                                              <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1 block">Redirect Link (Optional)</label>
                                              <div className="relative">
                                                  <input 
                                                    type="text" 
                                                    value={banner.link_url}
                                                    onChange={(e) => updateBanner(banner.id, 'link_url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all pl-12"
                                                  />
                                                  <ExternalLink size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                                              </div>
                                          </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                                          <div className="flex items-center gap-4">
                                              <button 
                                                onClick={() => updateBanner(banner.id, 'is_visible', !banner.is_visible)}
                                                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg ${
                                                    banner.is_visible 
                                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5' 
                                                      : 'bg-slate-800/50 text-slate-500 border border-slate-700 shadow-black/20'
                                                }`}
                                              >
                                                  {banner.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                  {banner.is_visible ? 'VISIBLE IN APP' : 'HIDDEN'}
                                              </button>
                                          </div>

                                          <div className="flex items-center gap-3">
                                              <button 
                                                onClick={() => deleteBanner(banner.id)}
                                                className="p-3.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group/del"
                                                title="Remove Banner"
                                              >
                                                  <Trash2 size={22} className="group-hover/del:scale-110 transition-transform" />
                                              </button>
                                              <button 
                                                disabled={saving === banner.id}
                                                onClick={() => saveBanner(banner)}
                                                className="bg-white hover:bg-slate-100 disabled:opacity-50 text-[#0F172A] px-8 py-3.5 rounded-[1.2rem] font-black text-xs flex items-center gap-3 shadow-xl transition-all active:scale-95 group/save"
                                              >
                                                  {saving === banner.id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                  {banner.id.toString().startsWith('temp-') ? 'PUBLISH BANNER' : 'SAVE CHANGES'}
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="manage-banners max-w-7xl mx-auto pb-20">
      <div className="mb-16">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">App Banners</h1>
        <p className="text-slate-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Manage multi-banner carousels for the mobile application
        </p>
      </div>

      <div className="grid grid-cols-1 gap-24">
        <BannerSection position="top" />
        <div className="relative h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </div>
        <BannerSection position="bottom" />
      </div>
    </div>
  );
}
