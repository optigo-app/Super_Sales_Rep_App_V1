/**
 * Bridge utility: maps the main supersalesrep app's URL params / session variables
 * to the magicCatalog's expected format (AuthqueryParams, taskInit).
 *
 * URL params:      token, SV, version, SpVer, yearCode, AppVer
 * Main app stores: token, SV, version, SpVer, yearCode, AppVer (in sessionStorage)
 * MagicCatalog uses: AuthqueryParams {yc, cuver, sv, uid}, taskInit {token, version}
 */
export const bridgeSession = () => {
  if (typeof window === "undefined") return false;

  try {
    // First: try to read from URL query params (in case user lands directly on magicCatalog)
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get("token") || sessionStorage.getItem("token") || "";
    let SV = urlParams.get("SV") || sessionStorage.getItem("SV") || "0";
    let yearCode = urlParams.get("yearCode") || sessionStorage.getItem("yearCode") || "";
    let version = urlParams.get("version") || sessionStorage.getItem("version") || "R50B3";
    let SpVer = urlParams.get("SpVer") || sessionStorage.getItem("SpVer") || "V1";
    let AppVer = urlParams.get("AppVer") || sessionStorage.getItem("AppVer") || "1.0.0";

    if (!token) return false;

    // Store all URL params in sessionStorage (same as the main app does)
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("SV", SV);
    sessionStorage.setItem("SpVer", SpVer);
    sessionStorage.setItem("version", version);
    sessionStorage.setItem("yearCode", yearCode);
    sessionStorage.setItem("AppVer", AppVer);

    // Try to extract a uid from the main app's dashboardData
    let uid = "supersalesrep";
    try {
      const raw = sessionStorage.getItem("dashboardData");
      if (raw) {
        const data = JSON.parse(raw);
        const user = data?.userData?.rd?.[0];
        if (user?.UserID) {
          uid = String(user.UserID);
        } else if (user?.firstname) {
          uid = String(user.firstname);
        }
      }
    } catch (_) {
      // keep default uid
    }

    // Build AuthqueryParams in the format the magicCatalog expects
    const authQueryParams = {
      yc: yearCode,
      cuver: version,
      sv: SV,
      uid,
      exp: 0,
      iss: "supersalesrep",
    };
    sessionStorage.setItem("AuthqueryParams", JSON.stringify(authQueryParams));
    localStorage.setItem("AuthqueryParams", JSON.stringify(authQueryParams));

    // Build taskInit with the token and version
    const taskInit = { token, version };
    sessionStorage.setItem("taskInit", JSON.stringify(taskInit));

    return true;
  } catch (e) {
    console.error("bridgeSession error:", e);
    return false;
  }
};
