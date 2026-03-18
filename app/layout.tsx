import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
// import { NavMenu } from "@/components/nav-menu";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Forgeai",
  description:
    "Build something greate with Forgeai that work the way you want.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#3b82f6",
        },
      }}
    >
      <html lang="en" className={cn(inter.variable, "scroll-smooth")}>
        <body className="min-h-dvh bg-linear-to-r from-[#ff75c3] via-[#ffa647] to-[#ffe3ff]">
          <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4">
            {/* <NavMenu /> */}
            <div className="flex-1">{children}</div>
          </div>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}