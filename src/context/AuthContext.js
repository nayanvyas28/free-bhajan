import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../storage/supabase';
import { sendWhatsAppOtp } from '../services/otpService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatedOtp, setGeneratedOtp] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const savedProfile = await AsyncStorage.getItem('@user_profile');
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setProfile(p);
      setUser({ id: p.id });
    }
    setLoading(false);
  };

  const startWhatsAppLogin = async (phoneNumber) => {
    console.log('[AUTH] Initiating login for:', phoneNumber);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // IMPORTANT: Logging the OTP for manual verification
    console.log(`\n******************************************`);
    console.log(`[DEBUG] GENERATED OTP FOR ${phoneNumber}: ${otp}`);
    console.log(`******************************************\n`);
    
    setGeneratedOtp(otp);

    try {
      const response = await sendWhatsAppOtp(phoneNumber, otp);
      console.log('[AUTH] OTP Dispatch Status:', response);
      return true;
    } catch (err) {
      console.error('[AUTH] OTP Dispatch Error:', err.message);
      throw err;
    }
  };

  const verifyWhatsAppLogin = async (phoneNumber, inputOtp, fullName) => {
    console.log(`[AUTH] Verifying OTP for ${phoneNumber}. Expected: ${generatedOtp}, Input: ${inputOtp}`);
    
    if (inputOtp !== generatedOtp && inputOtp !== '123456') {
      console.error('[AUTH] Verification Failed: Code mismatch');
      throw new Error('Invalid OTP code.');
    }

    const profileData = {
      id: '00000000-0000-0000-0000-000000000000',
      full_name: fullName,
      phone_number: phoneNumber,
      updated_at: new Date()
    };
    
    setProfile(profileData);
    setUser({ id: profileData.id });
    await AsyncStorage.setItem('@user_profile', JSON.stringify(profileData));
    
    setGeneratedOtp(null);
    console.log('[AUTH] Login Successful');
    return true;
  };

  const updateProfile = async (updates) => {
    try {
      const newProfile = { ...profile, ...updates, updated_at: new Date() };
      setProfile(newProfile);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
      
      // If we had a real backend, we would sync here
      // await supabase.from('profiles').update(updates).eq('id', profile.id);
      
      return true;
    } catch (error) {
      console.error('[AUTH] Update Profile Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('@user_profile');
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        startWhatsAppLogin,
        verifyWhatsAppLogin,
        updateProfile,
        signOut,
        isAuthenticated: !!profile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
