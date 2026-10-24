"use client";

import { Suspense } from "react";
import CheckoutClient from "@mc/components/Checkout/CheckoutClient";
import FullPageLoader from "@mc/components/FullPageLoader";

export default function CheckoutPage() {
    return (
        <Suspense fallback={<FullPageLoader open={true} />}>
            <CheckoutClient />
        </Suspense>
    );
}
