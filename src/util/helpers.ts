import axios from "axios";
import { Types } from "mongoose";
import QRCode from "qrcode";

export const sanitizeUrl = (inputUrl: string) => {
  return trimSingleCharAtEnd(inputUrl, "/");
};

export const trimSingleCharAtEnd = (inputString: string, char: string) => {
  let newInputString = inputString.trim();
  if (newInputString.charAt(newInputString.length - 1) === char) {
    newInputString = newInputString.substr(0, newInputString.length - 1);
  }
  return newInputString;
};

export function getPageNoZeroOnOne(pageNo: string) {
  try {
    const pageNoNumber = parseInt(pageNo);
    if (pageNo) {
      return pageNoNumber - 1;
    } else {
      return 0;
    }
  } catch {
    return 0;
  }
}

export function getPhoneNumberConvertedToE164(phone: string) {
  if (phone?.startsWith("01")) return `+88${phone}`;
  return phone;
}

export function arePhoneNumbersSame(
  newPhone: string,
  oldPhone: string,
): boolean {
  const newPhoneConverted = getPhoneNumberConvertedToE164(newPhone);
  return oldPhone === newPhoneConverted;
}

export function removeUndefinedFieldsFromObject<OB>(O: OB) {
  Object.keys(O as any).forEach((key) => {
    if ((O as any)[key] === undefined || (O as any)[key] === null)
      delete (O as any)[key];
  });
  return O;
}

export const generateQRBase64 = async (
  text: string,
  removeMetaHeader = false,
): Promise<string> => {
  try {
    let qrCodeDataURL = await QRCode.toDataURL(text);
    if (removeMetaHeader) {
      qrCodeDataURL = qrCodeDataURL.slice(22);
    }
    return qrCodeDataURL;
  } catch (err) {
    throw err;
  }
};

export const getImageBase64 = async (
  url: string,
): Promise<string | undefined> => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64String = Buffer.from(response.data, "binary").toString(
      "base64",
    );
    return base64String;
  } catch (err) {
    throw err;
  }
};

export const convertToMongooseObjectId = (id: string): Types.ObjectId => {
  return new Types.ObjectId(id);
};
