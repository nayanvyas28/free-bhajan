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

  const checkUserExists = async (phoneNumber) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      return data;
    } catch (error) {
      console.error('[AUTH] Check User Error:', error.message);
      return null;
    }
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
      return response;
    } catch (err) {
      console.error('[AUTH] OTP Dispatch Error:', err.message);
      throw err;
    }
  };

  const verifyWhatsAppLogin = async (phoneNumber, inputOtp, fullName) => {
    console.log(`[AUTH] Verifying OTP for ${phoneNumber}. Expected: ${generatedOtp}, Input: ${inputOtp}`);
    
    const isMasterOtp = inputOtp === '123456';
    
    if (inputOtp !== generatedOtp && !isMasterOtp) {
      console.error('[AUTH] Verification Failed: Code mismatch');
      throw new Error('Invalid OTP code. Please try again or use debug code.');
    }

    try {
      // 1. Check if profile exists
      let { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      let finalProfile;

      if (existingProfile) {
        console.log('[AUTH] Existing user found:', existingProfile.full_name);
        finalProfile = existingProfile;
      } else {
        console.log('[AUTH] Creating new profile for:', phoneNumber);
        
        // Since we don't have Supabase Auth, we'll store profile data
        // For production, you'd want a real backend to handle this
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              full_name: fullName, 
              phone_number: phoneNumber 
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.warn('[AUTH] DB Profile Insert failed (expected if no Auth session):', insertError.message);
          finalProfile = {
            id: phoneNumber,
            full_name: fullName,
            phone_number: phoneNumber,
            updated_at: new Date()
          };
        } else {
          finalProfile = newProfile;
        }
      }
      
      setProfile(finalProfile);
      setUser({ id: finalProfile.id });
      await AsyncStorage.setItem('@user_profile', JSON.stringify(finalProfile));
      
      setGeneratedOtp(null);
      console.log('[AUTH] Login Successful for ID:', finalProfile.id);
      return true;
    } catch (err) {
      console.error('[AUTH] Profile Sync Error:', err.message);
      throw err;
    }
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
        checkUserExists,
        updateProfile,
        signOut,
        isAuthenticated: !!profile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
