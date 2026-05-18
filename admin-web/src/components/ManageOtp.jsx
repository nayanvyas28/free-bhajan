import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Save, Search, RefreshCw, AlertCircle, CheckCircle, Clock, Database, Eye } from 'lucide-react';

export default function ManageOtp() {
  const [template, setTemplate] = useState('service_rejected_hindi');
  const [apiUser, setApiUser] = useState('MisCRM');
  const [apiPass, setApiPass] = useState('123456');
  const [apiSender, setApiSender] = useState('MisCRM');
  const [logs, setLogs] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (data && data.length > 0) {
        const templateSetting = data.find(s => s.key === 'whatsapp_otp_template');
        if (templateSetting) setTemplate(templateSetting.value);

        const userSetting = data.find(s => s.key === 'whatsapp_otp_user');
        if (userSetting) setApiUser(userSetting.value);

        const passSetting = data.find(s => s.key === 'whatsapp_otp_pass');
        if (passSetting) setApiPass(passSetting.value);

        const senderSetting = data.find(s => s.key === 'whatsapp_otp_sender');
        if (senderSetting) setApiSender(senderSetting.value);
      } else {
        // Create default if not exists
        await supabase.from('system_settings').insert([
          { key: 'whatsapp_otp_template', value: 'service_rejected_hindi', description: 'The active BhashSMS WhatsApp OTP template name' },
          { key: 'whatsapp_otp_user', value: 'MisCRM', description: 'BhashSMS API Username' },
          { key: 'whatsapp_otp_pass', value: '123456', description: 'BhashSMS API Password' },
          { key: 'whatsapp_otp_sender', value: 'MisCRM', description: 'BhashSMS Approved Sender ID' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching OTP config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      let query = supabase
        .from('otp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchPhone) {
        query = query.ilike('phone_number', `%${searchPhone}%`);
      }

      const { data, error } = await query;
      if (data) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching OTP logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'whatsapp_otp_template', value: template, description: 'The active BhashSMS WhatsApp OTP template name' },
        { key: 'whatsapp_otp_user', value: apiUser, description: 'BhashSMS API Username' },
        { key: 'whatsapp_otp_pass', value: apiPass, description: 'BhashSMS API Password' },
        { key: 'whatsapp_otp_sender', value: apiSender, description: 'BhashSMS Approved Sender ID' }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            description: setting.description,
            updated_at: new Date()
          }, { onConflict: 'key' });
        if (error) throw error;
      }

      alert('All OTP & BhashSMS Gateway configurations updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const sqlSetupCode = `-- Execute this in your Supabase SQL Editor if tables are missing:

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    template_used TEXT NOT NULL,
    status TEXT NOT NULL,
    response_gateway TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on system_settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated update on system_settings" ON system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert on system_settings" ON system_settings FOR INSERT USING (true);
CREATE POLICY "Allow public insert on otp_logs" ON otp_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on otp_logs" ON otp_logs FOR SELECT USING (true);

INSERT INTO system_settings (key, value, description)
VALUES 
('whatsapp_otp_template', 'service_rejected_hindi', 'The active BhashSMS WhatsApp OTP template name'),
('whatsapp_otp_user', 'MisCRM', 'BhashSMS API Username'),
('whatsapp_otp_pass', '123456', 'BhashSMS API Password'),
('whatsapp_otp_sender', 'MisCRM', 'BhashSMS Approved Sender ID')
ON CONFLICT (key) DO NOTHING;`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <MessageSquare className="text-amber-500" size={32} />
            OTP & Gateway Settings
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage WhatsApp OTP templates and monitor delivery logs</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loadingConfig}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
        >
          {saving ? 'SAVING...' : (
            <>
              <Save size={20} />
              SAVE CONFIG
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Template Config */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <MessageSquare className="text-amber-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Active Template</h2>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
              Select BhashSMS Template
            </label>
            <div className="relative">
              <select
                value={['service_rejected_hindi', 'whoapplied'].includes(template) ? template : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'custom') {
                    setTemplate(val);
                  } else {
                    setTemplate('');
                  }
                }}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="service_rejected_hindi" className="bg-[#0F172A] text-white">
                  service_rejected_hindi (Hindi WhatsApp OTP)
                </option>
                <option value="whoapplied" className="bg-[#0F172A] text-white">
                  whoapplied (English WhatsApp OTP)
                </option>
                <option value="custom" className="bg-[#0F172A] text-white">
                  ✍️ Enter Custom Template Name
                </option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                ▼
              </div>
            </div>

            {!['service_rejected_hindi', 'whoapplied'].includes(template) && (
              <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                  Custom Template Name
                </label>
                <input
                  type="text"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-850 rounded-xl px-5 py-3 text-sm text-white font-bold focus:border-amber-500 outline-none transition-all"
                  placeholder="Enter custom template key..."
                />
              </div>
            )}

            <p className="text-slate-500 text-xs mt-3 italic">
              Ensure this template name matches EXACTLY with the template approved in your BhashSMS dashboard.
            </p>
          </div>

          <div className="p-5 bg-[#0F172A]/50 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider">How Template Parameters Work</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              BhashSMS replaces placeholders sequentially. Our app automatically injects the randomly generated OTP code as the first parameter, and "OTP" as the second:
            </p>
            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-900 font-mono text-[10px] text-emerald-400">
              Params = {"{OTP}"}, OTP
            </div>
          </div>
        </div>

        {/* Center Column: Gateway Credentials */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <Database className="text-amber-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white">BhashSMS Gateway</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                API Username
              </label>
              <input
                type="text"
                value={apiUser}
                onChange={(e) => setApiUser(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-5 py-3 text-sm text-white font-bold focus:border-amber-500 outline-none transition-all"
                placeholder="e.g. MisCRM"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                API Password
              </label>
              <input
                type="text"
                value={apiPass}
                onChange={(e) => setApiPass(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-5 py-3 text-sm text-white font-bold focus:border-amber-500 outline-none transition-all"
                placeholder="e.g. 123456"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Sender ID / Header
              </label>
              <input
                type="text"
                value={apiSender}
                onChange={(e) => setApiSender(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-5 py-3 text-sm text-white font-bold focus:border-amber-500 outline-none transition-all"
                placeholder="e.g. MisCRM"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Database SQL Helper */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl lg:col-span-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <Database className="text-emerald-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Database Setup</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If you are installing or updating the OTP system for the first time, make sure the required tables are created in your Supabase database by pasting this script in your Supabase SQL Editor:
          </p>
          <textarea
            value={sqlSetupCode}
            readOnly
            rows={5}
            className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-[10px] focus:border-amber-500 outline-none transition-all resize-none"
            onClick={(e) => {
              e.target.select();
              navigator.clipboard.writeText(sqlSetupCode);
              alert('SQL Code copied to clipboard!');
            }}
          />
          <p className="text-[10px] text-slate-500 italic">Click inside the text area to copy code.</p>
        </div>
      </div>

      {/* Bottom Section: Delivery Logs */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <Clock className="text-amber-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Live OTP Delivery Logs</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-white font-bold focus:border-amber-500 outline-none transition-all"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="bg-[#0F172A] hover:bg-[#1E293B] border border-slate-800 text-slate-300 hover:text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              REFRESH LOGS
            </button>
          </div>
        </div>

        {loadingLogs && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-[#0F172A] rounded-2xl border border-slate-850">
            <AlertCircle className="mx-auto text-slate-600 mb-3" size={40} />
            <p className="text-slate-400 font-bold">No OTP logs found</p>
            <p className="text-slate-500 text-xs mt-1">Try refreshing the page or checking your gateway integration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse bg-[#0F172A]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-black">
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">OTP Code</th>
                  <th className="py-4 px-6">Template</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Gateway Response</th>
                  <th className="py-4 px-6">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1E293B]/20 transition-all font-semibold text-sm">
                    <td className="py-4 px-6 text-white font-extrabold">{log.phone_number}</td>
                    <td className="py-4 px-6 font-mono text-amber-500">{log.otp_code}</td>
                    <td className="py-4 px-6 text-slate-400">{log.template_used}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                        log.status === 'Success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/25'
                      }`}>
                        {log.status === 'Success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {log.response_gateway || <span className="text-slate-600 italic">None</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
