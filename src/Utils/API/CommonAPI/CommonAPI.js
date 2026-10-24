import axios from "axios";
import Cookies from "js-cookie";

const getAPIURL = () => {
  if (typeof window === "undefined") return "https://apilx.optigoapps.com/api/report";
  const host = window.location.hostname;
  return host === "localhost" || host === "nzen" || host === "supersalesrep.web"
    ? "http://newnextjs.web/api/report"
    : "https://apilx.optigoapps.com/api/report";
};

const isLocal = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "nzen" || host === "supersalesrep.web";
};

export const CommonAPI = async (body) => {
  const queryParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const token_url  = queryParams.get("token");
  const SV_url     = queryParams.get("SV");
  const cookie_token = Cookies.get("token");
  const cookie_SV    = Cookies.get("SV");
  const token = sessionStorage.getItem("token") ?? "";
  const SV    = sessionStorage.getItem("SV")    ?? "";

  const finalToken = isLocal()
    ? token
    : token || token_url || cookie_token || "";

  const finalSv = isLocal()
    ? "0"
    : SV || SV_url || cookie_SV || "";

  const header = {
    Authorization: `Bearer ${finalToken}`,
    version: "V1",
    sv: `${finalSv}`,
    sp: 60,
  };

  try {
    const response = await axios.post(getAPIURL(), body, { headers: header });
    return response?.data;
  } catch (error) {
    console.error("error is..", error);
  }
};