import { CommonAPI } from "../CommonAPI/CommonAPI";
import Cookies from "js-cookie";

export const CommonAPImain = async (Mode) => {
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
      p: JSON.stringify({}),
      f: `${Mode}`,
    };

    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
