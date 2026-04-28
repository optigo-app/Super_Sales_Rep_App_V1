import React, { useEffect } from "react";
import io from "socket.io-client";
import config from "./config";
import { GetDesignStock } from "./GetDesignStock";
import { useSetRecoilState } from "recoil";
import { soketProductData } from "../../AllTheme/Pocatalog/Components/Recoil/atom";

const ConnectionManager = () => {
  let socket;

  const setProductData = useSetRecoilState(soketProductData);
  useEffect(() => {
    const { address, SoPath, di } = config;

    console.log("configconfigconfig", config);
    const details = {
      path: SoPath,
      transports: ["websocket"],
    };

    try {
      // socket = io.connect(address, details);

      socket = io?.connect(address, details);

      socket.on("connect", () => {
        socket.emit("joinRoom", di);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socket.on("connect_error", (error) => {
        console.error("Connection Error:", error);
      });

      socket.on("connectToRoom", (data) => {
        // console.log('Connected to room:', data);
      });

      socket.on("ReceiveSignal", (data) => {
        console.log("ReceiveSignal");
        try {
          if (data && data?.tvar) {
            // comboRebind(data?.tvar, data?.tparam);
            comboRebind(data?.tvar);
          }
        } catch (error) {
          console.error("Error handling ReceiveSignal:", error);
        }
      });

      // (() => {
      //   if (socket) {
      //     const signal = 'reacttest';
      //     const data = { roomno: config.di, tmode: 'SendSignal', tvar: signal };
      //     // alert('Sent signal:', data);
      //     socket.emit('SendSignal', data);
      //   } else {
      //     console.error('Socket is not connected.');
      //   }
      // })();
    } catch (error) {
      console.error("Socket connection error:", error);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleBtnClick = (signal) => {
    return () => {
      if (socket) {
        const data = { roomno: config.di, tmode: "SendSignal", tvar: signal };
        socket.emit("SendSignal", data);
      } else {
        console.error("Socket is not connected.");
      }
    };
  };

  const comboRebind = (_tvar) => {
    try {
      switch (_tvar.toLowerCase().trim()) {
        case "reacttest":
          if (typeof stockNotification === "function") {
            // stockNotification();
          }
          alert("This is testing for socket");
          break;

        case "getsolddata":
          console.log(
            "getsolddata Call",
            window.location.pathname.startsWith("/p")
          );
          if (window.location.pathname.startsWith("/p") == true) {
            GetDesignStock().then((res) => {
              setProductData(res?.Data?.rd);
            });
          }
          break;
        case "notificationaudioplay":
          if (typeof notificationAudioPlay === "function") {
            // notificationAudioPlay();
          }
          break;
        case "metal":
          if (typeof _ComboListArray_Metal === "function") {
            // _ComboListArray_Metal();
          }
          alert("Metal change happened");
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error in comboRebind:", error);
    }
  };

  return (
    <div>
      {/* <button className='btn btn-danger cust_btn' onClick={handleBtnClick('reacttest')}>Socket Event</button> */}
    </div>
  );
};

export default ConnectionManager;
