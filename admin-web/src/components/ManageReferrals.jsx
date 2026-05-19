import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Gift, Save, Settings, Users, Info, Clock } from 'lucide-react';

export default function ManageReferrals() {
  const [config, setConfig] = useState({
    guest_trial_minutes: 10,
    base_minutes: 30,
    minutes_per_referral: 15,
    max_referral_bonus_minutes: 300,
    unlimited_threshold: 10,
    is_referral_system_enabled: true,
    referral_share_message: "🙏 Jai Shree Ram! 🙏\n\nI am listening to beautiful bhajans on *MantraPuja*.\n\nUse my Referral Code: {CODE}\n\n📲 Download here: https://play.google.com/store/apps/details?id=com.mantrapuja"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'referral_config')
        .maybeSingle();

      if (data) {
        setConfig(data.value);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'referral_config', 
          value: config,
          updated_at: new Date()
        }, { onConflict: 'key' });

      if (error) throw error;
      alert('Referral configuration updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Gift className="text-amber-500" size={32} />
            Referral System
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage listening limits and referral bonuses</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
        >
          {saving ? 'SAVING...' : (
            <>
              <Save size={20} />
              SAVE SETTINGS
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Configuration */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <Settings className="text-amber-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Usage Limits</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Guest Trial Time (Minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={config.guest_trial_minutes || 10}
                  onChange={(e) => setConfig({ ...config, guest_trial_minutes: parseInt(e.target.value) || 0 })}
                  className="flex-1 bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                />
                <span className="text-amber-500 font-bold">MINS / TRIAL</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">Total listening time allowed for Guest users before forcing Login.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Base Listening Time (Minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={config.base_minutes}
                  onChange={(e) => setConfig({ ...config, base_minutes: parseInt(e.target.value) })}
                  className="flex-1 bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                />
                <span className="text-slate-500 font-bold">MINS / DAY</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">Standard daily limit for users with 0 referrals.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Minutes Per Referral
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={config.minutes_per_referral}
                  onChange={(e) => setConfig({ ...config, minutes_per_referral: parseInt(e.target.value) })}
                  className="flex-1 bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                />
                <span className="text-amber-500 font-bold">+ MINS</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">Extra time granted for every successful signup using a referral code.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Maximum Bonus Limit
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={config.max_referral_bonus_minutes}
                  onChange={(e) => setConfig({ ...config, max_referral_bonus_minutes: parseInt(e.target.value) })}
                  className="flex-1 bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                />
                <span className="text-slate-500 font-bold">TOTAL MAX</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">The absolute maximum bonus time a user can accumulate.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Unlimited Access Threshold
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={config.unlimited_threshold}
                  onChange={(e) => setConfig({ ...config, unlimited_threshold: parseInt(e.target.value) })}
                  className="flex-1 bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                />
                <span className="text-emerald-500 font-bold">REFERRALS</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">Number of referrals needed to unlock UNLIMITED listening time permanently.</p>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                Custom Share Message
              </label>
              <textarea
                value={config.referral_share_message}
                onChange={(e) => setConfig({ ...config, referral_share_message: e.target.value })}
                rows={5}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all resize-none"
                placeholder="Enter share message template..."
              />
              <p className="text-slate-500 text-xs mt-2 italic">Use <span className="text-amber-500 font-bold">{'{CODE}'}</span> as a placeholder for the user's referral code.</p>
            </div>
          </div>
        </div>

        {/* System Status & Info */}
        <div className="space-y-8">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                  <Info className="text-emerald-500" size={24} />
                </div>
                <h2 className="text-xl font-black text-white">System Status</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.is_referral_system_enabled}
                  onChange={(e) => setConfig({ ...config, is_referral_system_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="p-6 bg-[#0F172A] rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="text-amber-500 mt-1" size={18} />
                <p className="text-sm text-slate-400 leading-relaxed">
                  Users currently start with <span className="text-white font-bold">{config.base_minutes} mins</span>. 
                  With 5 referrals, they will have <span className="text-white font-bold">{config.base_minutes + (5 * config.minutes_per_referral)} mins</span>.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <Users className="text-amber-500 mt-1" size={18} />
                <p className="text-sm text-slate-400 leading-relaxed">
                  Referral codes are 6-digit unique strings automatically generated for every user upon first login.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 rounded-3xl p-8">
            <h3 className="text-lg font-black text-amber-500 mb-2">Pro Tip</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Setting "Minutes Per Referral" to a higher value will encourage users to share the app more frequently. 
              The system automatically resets listening time at 12:00 AM every day for all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
