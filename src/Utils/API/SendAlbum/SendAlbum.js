import { CommonAPI } from "../CommonAPI/CommonAPI";
import Cookies from "js-cookie";

export const SendAlbum = async (Mode, Id, CustomerId) => {
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
        CustomerId: `${CustomerId}` ?? "",
      }),
      f: `${Mode}`,
    };

    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
