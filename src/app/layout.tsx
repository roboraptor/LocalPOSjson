import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS
import type { Metadata } from "next";
import "@/app/globals.css"; // Vlastní globální styly
//import '@/styles/globals.css';
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Local POS",
  description: "Pokladní systém",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="d-flex flex-column min-vh-100 m-0">
        <Header />
        <main className="flex-grow-1 d-flex flex-column">{children}</main>
      </body>
    </html>
  );
}
