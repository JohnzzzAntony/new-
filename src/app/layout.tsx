import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "DREC PMS - Property Management System",
  description: "Dubai Real Estate Corporation Property Management System. Manage leases, subtenants, EJARI, rent collection, and compliance.",
  keywords: ["DREC", "Property Management", "Dubai", "Real Estate", "EJARI"],
  authors: [{ name: "DREC" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
