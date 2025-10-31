export const adsConfig = {
  monetag: {
    enabled: process.env.NEXT_PUBLIC_MONETAG_ENABLED === 'true',
    id: process.env.NEXT_PUBLIC_MONETAG_ID,
    zone: process.env.NEXT_PUBLIC_MONETAG_ZONE,
    tag: process.env.NEXT_PUBLIC_MONETAG_TAG,
  },
  propellerads: {
    enabled: process.env.NEXT_PUBLIC_PROPELLER_ENABLED === 'true',
    zoneId: process.env.NEXT_PUBLIC_PROPELLER_ZONE_ID,
  },
  googleAdsense: {
    enabled: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === 'true',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID,
  },
  adsterra: {
    enabled: process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true',
    id: process.env.NEXT_PUBLIC_ADSTERRA_ID,
  },
  
  // Safety Settings
  safety: {
    blockAdult: process.env.NEXT_PUBLIC_BLOCK_ADULT_ADS === 'true',
    safeContentOnly: process.env.NEXT_PUBLIC_SAFE_CONTENT_ONLY === 'true',
  },
};

export default adsConfig;
