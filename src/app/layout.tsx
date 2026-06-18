import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Spicy Ocean - Biggest Open Kitchen in Beach Road",
  description: "Spicy Ocean Restaurant Dashboard",
  authors: [{ name: "Lovable" }],
  openGraph: {
    type: "website",
    title: "Spicy Ocean - Biggest Open Kitchen in Beach Road",
    description: "Spicy Ocean Restaurant Dashboard",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d8635e9c-f452-49d2-b511-f88927a987e1",
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Lovable",
    title: "Spicy Ocean - Biggest Open Kitchen in Beach Road",
    description: "Spicy Ocean Restaurant Dashboard",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d8635e9c-f452-49d2-b511-f88927a987e1",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
