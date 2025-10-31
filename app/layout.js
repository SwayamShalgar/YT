import './globals.css';

export const metadata = {
  title: 'YouTube Video Downloader',
  description: 'Download YouTube videos in any quality',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
