import { CommonAPI } from "../CommonAPI/CommonAPI";
import Cookies from "js-cookie";

export const Catelog_AlbumDesignList = async (Mode, Id) => {
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
        AlbumMasterid: `${Id}` ?? "",
      }),
      f: `${Mode}`,
    };
    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
