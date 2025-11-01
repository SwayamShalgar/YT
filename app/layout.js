import './globals.css';

export const metadata = {
  // Primary Meta Tags
  title: 'Free Video Downloader - Download YouTube, Instagram, Pinterest Videos HD | AllVideoDownloader',
  description: 'Download videos from YouTube, Instagram, and Pinterest in HD quality for free. Fast, safe, and easy video downloader. No registration required. Download MP4 videos in 1080p, 720p, 4K quality.',
  keywords: 'video downloader, YouTube downloader, Instagram downloader, Pinterest downloader, download videos free, HD video download, MP4 downloader, online video downloader, video saver, youtube to mp4, instagram video download',
  
  // Author & Publisher
  authors: [{ name: 'AllVideoDownloader' }],
  creator: 'AllVideoDownloader',
  publisher: 'AllVideoDownloader',
  
  // Robots & Indexing
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://allvideodownloader.live',
    siteName: 'AllVideoDownloader',
    title: 'Free Video Downloader - YouTube, Instagram, Pinterest HD Downloads',
    description: 'Download videos from YouTube, Instagram, and Pinterest in HD quality. Fast, free, and easy to use. No registration needed.',
    images: [
      {
        url: 'https://allvideodownloader.live/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AllVideoDownloader - Free HD Video Downloader',
        type: 'image/jpeg',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@allvideodown',
    creator: '@allvideodown',
    title: 'Free Video Downloader - YouTube, Instagram, Pinterest',
    description: 'Download videos in HD quality from YouTube, Instagram, and Pinterest. Free, fast, and secure video downloader.',
    images: ['https://allvideodownloader.live/twitter-card.jpg'],
  },
  
  // Verification Tags
  verification: {
    google: 'your-google-site-verification-code-here',
    yandex: 'your-yandex-verification-code-here',
    bing: 'your-bing-verification-code-here',
  },
  
  // Canonical & Alternate URLs
  alternates: {
    canonical: 'https://allvideodownloader.live',
    languages: {
      'en-US': 'https://allvideodownloader.live',
      'es': 'https://allvideodownloader.live/es',
      'fr': 'https://allvideodownloader.live/fr',
      'de': 'https://allvideodownloader.live/de',
      'pt': 'https://allvideodownloader.live/pt',
      'hi': 'https://allvideodownloader.live/hi',
      'ar': 'https://allvideodownloader.live/ar',
      'ja': 'https://allvideodownloader.live/ja',
      'zh': 'https://allvideodownloader.live/zh',
    },
  },
  
  // App Info
  applicationName: 'AllVideoDownloader',
  appleWebApp: {
    capable: true,
    title: 'Video Downloader',
    statusBarStyle: 'black-translucent',
  },
  
  // Format Detection
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  
  // Category & Classification
  category: 'technology',
  classification: 'Video Downloader Tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Essential Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Theme & App Colors */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* SEO & Content Tags */}
        <meta name="rating" content="general" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        
        {/* Language */}
        <meta httpEquiv="content-language" content="en" />
        
        {/* Icons & Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.instagram.com" />
        <link rel="dns-prefetch" href="https://www.pinterest.com" />
        
        {/* Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AllVideoDownloader',
              url: 'https://allvideodownloader.live',
              logo: {
                '@type': 'ImageObject',
                url: 'https://allvideodownloader.live/logo.png',
                width: 512,
                height: 512,
              },
              description: 'Free online video downloader for YouTube, Instagram, and Pinterest. Download videos in HD quality.',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                availableLanguage: ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Hindi'],
              },
              sameAs: [
                'https://twitter.com/allvideodown',
                'https://www.facebook.com/allvideodown',
              ],
            }),
          }}
        />
        
        {/* Structured Data - WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AllVideoDownloader',
              url: 'https://allvideodownloader.live',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web Browser',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '15420',
                bestRating: '5',
                worstRating: '1',
              },
              description: 'Download videos from YouTube, Instagram, and Pinterest in HD quality. Fast, free, and easy to use video downloader. No registration required.',
              featureList: [
                'Download YouTube videos',
                'Download Instagram videos',
                'Download Pinterest videos',
                'HD quality support',
                '1080p, 720p, 4K quality',
                'Free and unlimited downloads',
                'No registration required',
              ],
            }),
          }}
        />
        
        {/* Structured Data - WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AllVideoDownloader',
              url: 'https://allvideodownloader.live',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://allvideodownloader.live/?url={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        
        {/* Structured Data - BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://allvideodownloader.live',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Video Downloader',
                  item: 'https://allvideodownloader.live',
                },
              ],
            }),
          }}
        />
        
        {/* Structured Data - SoftwareApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AllVideoDownloader',
              operatingSystem: 'Web',
              applicationCategory: 'MultimediaApplication',
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '15420',
              },
            }),
          }}
        />
        
        {/* Monetag Ads */}
        <meta name="monetag" content="a87b08c9cb4ad62c9a26764da16f9d1b"></meta>
        <script 
          src="https://fpyf8.com/88/tag.min.js" 
          data-zone="181909" 
          async 
          data-cfasync="false"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
