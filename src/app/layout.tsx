import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import type { Metadata } from 'next';
import '@/app/globals.css'; // Vlastní globální styly
//import '@/styles/globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Local POS',
  description: 'Pokladní systém',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}