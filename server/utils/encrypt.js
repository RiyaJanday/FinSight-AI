import CryptoJS from "crypto-js";

const KEY = process.env.ENCRYPTION_KEY || "default_key_32_chars_min_length!";

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, KEY).toString();
};

export const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};