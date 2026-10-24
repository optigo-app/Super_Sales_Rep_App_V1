import React from "react";
import "./Snackbar.css";  

const SnackbarEror = ({ message, open }) => {
  return (
    <div className={`snackbarEror ${open ? "showEror" : ""}`}>
      {message}
    </div>
  );
};

export default SnackbarEror;
