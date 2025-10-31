import './globals.css';

export const metadata = {
  title: 'All Video Downloader - YouTube, Instagram, TikTok',
  description: 'Download videos from YouTube, Instagram, TikTok, Facebook, Pinterest in 1080p quality',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PropellerAds - Optional */}
        <script
          async
          src="//cdn.propellerads.com/YOUR_ZONE_ID.js"
        ></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
