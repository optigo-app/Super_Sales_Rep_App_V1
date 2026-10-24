import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const AllowedDomains = ["localhost", 'taskmgmt.web'];

if (process.env.NODE_ENV === "development" ||
    AllowedDomains.some(domain => window.location.hostname.includes(domain))) {
    Cookies.set("skey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6IllXUnRhVzVBYjNKaGFXd3VZMjh1YVc0PSIsImV4cCI6MTc1NTQ5Njg4NywidWlkIjoiWVdSdGFXNUFiM0poYVd3dVkyOHVhVzQ9IiwieWMiOiJlM3R1ZW1WdWZYMTdlekl3ZlgxN2UyOXlZV2xzTWpWOWZYdDdiM0poYVd3eU5YMTkiLCJzdiI6IjAifQ.KLfVAffQcFpUBg57_r0S_mzxgL6VcAeBJS--TqYeEz4", { path: "/" });
}

export function decodeBase64(base64Str) {
    try {
        return decodeURIComponent(
            atob(base64Str)
                .split("")
                .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join("")
        );
    } catch (error) {
        console.error("Base64 decoding failed:", error);
        return null;
    }
}

export function GetCredentialsFromCookie() {
    try {
        const token = Cookies.get("skey");
        if (!token) {
            console.warn("skey cookie not found");
            return null;
        }
        const decoded = jwtDecode(token);
        const companyEncoded = decoded?.uid;
        const user = companyEncoded ? decodeBase64(companyEncoded) : null;
        return {
            ...decoded,
            userId: user,
        };
    } catch (error) {
        console.error("Failed to parse JWT from skey cookie:", error);
        return null;
    }
}
