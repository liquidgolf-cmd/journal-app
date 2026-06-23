import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Keep",
  description: "Capture it. Tag it. Find it again.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="px-5 pt-6 pb-3 flex items-center justify-between">
            <div className="text-xl font-serif tracking-wide text-amberlight">
              Keep
            </div>
          </header>
          <main className="flex-1 px-4 pb-24 max-w-2xl mx-auto w-full">
            {children}
          </main>
          <NavBar />
        </div>
      </body>
    </html>
  );
}
