import { S3 } from "@aws-sdk/client-s3";
import config from "../../settings/config";
import { getSanitizedText } from "../stringUtils";

export const s3FromConfig = new S3({
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
  },
  region: config.AWS_ACCESS_REGION,
});

export const getRandomFileName = (imageTitle: string) => {
  const randKey = Math.floor(100000 + Math.random() * 900000);
  const imageTitleProcessed = getSanitizedText(imageTitle);

  return `${imageTitleProcessed}_${randKey}`;
};

export const getAvatarImages = (text: string) => ({
  thumbnailImage: `https://ui-avatars.com/api/?name=${text || ""}&size=180`,
  previewImage: `https://ui-avatars.com/api/?name=${text || ""}&size=480`,
  originalImage: `https://ui-avatars.com/api/?name=${text || ""}&size=720`,
});
