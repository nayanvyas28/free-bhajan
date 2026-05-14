import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBanners } from '../services/youtubeApi';

const BannerContext = createContext();

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const data = await getBanners();
      if (data) setBanners(data);
    } catch (error) {
      console.error("Global Banner Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const getBanner = (position) => banners.find(b => b.position === position);

  return (
    <BannerContext.Provider value={{ banners, getBanner, fetchBanners, loading }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanners = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanners must be used within a BannerProvider');
  }
  return context;
};
