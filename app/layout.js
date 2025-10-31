import './globals.css';

export const metadata = {
  title: 'YouTube Video Downloader',
  description: 'Download YouTube videos in any quality',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Safety Meta Tags - Block Adult Content */}
        <meta name="rating" content="general" />
        <meta name="content-rating" content="general" />
        <meta name="target-audience" content="all-ages" />

        {/* Google Safe Browsing */}
        <meta name="googlebot" content="noarchive" />

        {/* Family Safe */}
        <meta name="Family-Safe" content="true" />

        {adsConfig.monetag.enabled && (
          <>
            <meta name="monetag" content="a87b08c9cb4ad62c9a26764da16f9d1b"></meta>
            <script
              src={adsConfig.monetag.tag}
              data-zone={adsConfig.monetag.zone}
              async
              data-cfasync="false"
            ></script>
          </>
        )}
        {adsConfig.propellerads.enabled && (
          <script src="https://fpyf8.com/88/tag.min.js" data-zone="181909" async data-cfasync="false"></script>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
