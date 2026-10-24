import React from "react";
import "./Snackbar.css";  // Add your custom styles here

const Snackbar = ({ message, open }) => {
  return (
    <div className={`snackbar ${open ? "show" : ""}`}>
      {message}
    </div>
  );
};

export default Snackbar;
