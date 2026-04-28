import { CommonAPI } from "../CommonAPI/CommonAPI";
import Cookies from "js-cookie";

export const CommonAPImainScan = async (Mode, JobNumber) => {
  let response;
  try {
    const body = {
      con: JSON.stringify({
        id: "",
        mode: `${Mode}`,
        y: "",
        appuserid: "",
        IPAddress: "",
      }),
      p: JSON.stringify({
        JobNo: `${JobNumber}` ?? "",
      }),
      f: `${Mode}`,
    };

    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
