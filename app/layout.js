import './globals.css';

export const metadata = {
  title: 'YouTube Video Downloader',
  description: 'Download YouTube videos in any quality',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="monetag" content="a87b08c9cb4ad62c9a26764da16f9d1b"></meta>
      </head>
      <body>{children}</body>
    </html>
  );
}
