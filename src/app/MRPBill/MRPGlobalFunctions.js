import img from "../../Assets/default.jpg";

export const handleImageError = (e) => {
    e.target.src = img
}

export const validateTwoDecimalPlaces = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    const regex = /^\d+(\.\d{0,2})?$/;
    return regex.test(value.toString());
  };