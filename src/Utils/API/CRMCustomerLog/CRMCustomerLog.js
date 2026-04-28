import { CommonAPI } from "../CommonAPI/CommonAPI";

export const CRMCustomerLog = async (Mode, CustomerId) => {
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
