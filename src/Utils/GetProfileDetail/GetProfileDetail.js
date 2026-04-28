import { CommonAPI } from "../CommonAPI/CommonAPI";

export const GetProfileDetail = async (Mode) => {
  let response;
  try {
    // const token = "V352825MW6N8F601Y3UD" ?? "";
    // const DeviceToken = "S95DGCL406Q3C11J" ?? "";
    
    const token = sessionStorage.getItem("token") ?? "";
    const DeviceToken = sessionStorage.getItem("device_token") ?? "";
    const SV = sessionStorage.getItem("SV") ?? "";

    const combinedValue = JSON.stringify({
      Token: `${token}` ?? "",
      DeviceToken: DeviceToken ?? "",
      Mode: `${Mode}` ?? "",
    });

    const body = {
      Token: `${token}`,
      DeviceToken: DeviceToken,
      SV: SV,
      ReqData: combinedValue,
    };

    response = await CommonAPI(body);
  } catch (error) {
    console.error("Error:", error);
  }
  return response;
};
