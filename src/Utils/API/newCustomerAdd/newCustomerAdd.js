import { CommonAPI } from "../CommonAPI/CommonAPI";
import Cookies from "js-cookie";

export const newCustomerAdd = async (Mode, Id, firstName, LastName, city, compny, mobile, email, compnyTypeId, CompnyTypeName, IsHelloApp) => {
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
        FName: `${firstName}` ?? "",
        LName: `${LastName}` ?? "",
        City: `${city}` ?? "",
        Company: `${compny}` ?? "",
        Mobile: `${mobile}` ?? "",
        Email: `${email}` ?? "",
        CompanyTypeId: `${compnyTypeId}` ?? "",
        CompanyTypeName: `${CompnyTypeName}` ?? "",
        InHelloApp: `${IsHelloApp}` ?? "",
      }),
      f: `${Mode}`,
    };

    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
