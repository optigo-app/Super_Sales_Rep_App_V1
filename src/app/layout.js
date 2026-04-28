import "./globals.css";
import "../sass/main.scss";
import MuiProvider from "../components/MuiProvider";
import { Poppins } from "next/font/google";
import ToastContainer from "@/components/Toast/ToastContainer";

const poppins = Poppins({
  subsets: ['latin'],
  variable: "--font-poppins",
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export const metadata = {
  title: "Super Sales",
  description: "Super Sales Rep - Mobile Sales Management App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Super Sales",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={poppins.className}
        suppressHydrationWarning  
      >
        <MuiProvider>
          <div className="mobile-app">{children}</div>
        </MuiProvider>
        <ToastContainer />
      </body>
    </html>
  );
}


    // "start": "next start -p 6008" - local 
    // "start": "next start -p 6007" - online test  
