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

  const getBannersByPosition = (position) => banners.filter(b => {
    // Fallback: If position is missing, treat it as 'top'
    const bPos = b.position || 'top';
    return bPos === position && b.is_visible;
  });

  return (
    <BannerContext.Provider value={{ banners, getBannersByPosition, fetchBanners, loading }}>
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
