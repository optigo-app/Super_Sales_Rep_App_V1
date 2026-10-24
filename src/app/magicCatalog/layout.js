import { Suspense } from "react";
import ThemeProvider from "@mc/theme/ThemeProvider";
import { ToastProvider } from "@mc/context/ToastContext";
import { CartProvider } from "@mc/context/CartContext";
import { AuthProvider } from "@mc/context/AuthContext";
import { ProductDataProvider } from "@mc/context/ProductDataContext";
import ClientWrappers from "@mc/components/Common/ClientWrappers";

export const metadata = {
  title: "Magic Catalog",
  description: "Find the perfect jewelry using advanced AI-powered search technology",
};

export default function MagicCatalogLayout({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Suspense>
          <AuthProvider>
            <CartProvider>
              <ProductDataProvider>
                <ClientWrappers>
                  <Suspense>
                    {children}
                  </Suspense>
                </ClientWrappers>
              </ProductDataProvider>
            </CartProvider>
          </AuthProvider>
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  );
}
