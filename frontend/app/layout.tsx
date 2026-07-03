import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '../components/Toast';

export const metadata: Metadata = {
  title: 'Vayu Vigil | National Civic-Tech Platform for Neighborhood Air Quality',
  description: 'Neighborhood-level air quality monitoring combining citizen-uploaded reports, local IoT sensor grids, satellite imagery, and automated municipal fleet dispatch.',
  keywords: 'vayu vigil, air quality, pollution, civic tech, municipal, smart city, sentinel-5p, dpcc, cpcb, hackathon',
  authors: [{ name: 'Vayu Vigil Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/assets/vayu-vigil-logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#1C1F26]">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
