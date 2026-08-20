import { CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import jimp from "jimp";
import path from "path";
import sharp from "sharp";
import config from "../../settings/config";
import { getSanitizedText } from "../stringUtils";
import logger from "../winston";
import { getRandomFileName, s3FromConfig } from "./commonUtils";

// resizing images

export const FULL_WIDTH = 1280;
export const PREVIEW_WIDTH = 720;
export const THUMBNAIL_WIDTH = 280;
export const RESIZE_STRATEGY: "sharp" | "jimp" = "sharp";

function resizeWithSharp(
  inputFile: Buffer,
  width: number,
  height: number | undefined,
  fit: "cover" | "inside",
  imageType?: keyof sharp.FormatEnum,
) {
  return sharp(inputFile)
    .resize({
      width: width,
      withoutEnlargement: true,
      height: height,
      fit: fit === "cover" ? sharp.fit.cover : sharp.fit.inside,
    })
    .withMetadata()
    .toFormat(imageType || "png")
    .toBuffer();
}

const resizeWithJimp = async (
  inputFile: Buffer,
  width: number,
  height: number | undefined,
) => {
  const imageObj = await jimp.read(inputFile);
  const resized = imageObj.resize(width, height || jimp.AUTO);
  return resized.getBufferAsync(jimp.MIME_JPEG);
};

const getResizedImagesJimp = async (
  inputFile: Buffer,
  fullWidth: number | undefined,
  previewWidth: number | undefined,
  thumbnailWidth: number | undefined,
): Promise<{
  resizedFull: Buffer | undefined;
  resizedPreview: Buffer | undefined;
  resizedThumbnail: Buffer | undefined;
}> => {
  let resizedFull: Buffer | undefined,
    resizedPreview: Buffer | undefined,
    resizedThumbnail: Buffer | undefined;

  if (fullWidth) {
    resizedFull = await resizeWithJimp(inputFile, fullWidth, undefined);
  }
  if (previewWidth) {
    resizedPreview = await resizeWithJimp(inputFile, previewWidth, undefined);
  }
  if (thumbnailWidth) {
    resizedThumbnail = await resizeWithJimp(
      inputFile,
      thumbnailWidth,
      undefined,
    );
  }

  return {
    resizedFull,
    resizedPreview,
    resizedThumbnail,
  };
};

const getResizedImagesSharp = async (
  inputFile: Buffer,
  fullWidth: number | undefined,
  previewWidth: number | undefined,
  thumbnailWidth: number | undefined,
  imageType?: keyof sharp.FormatEnum,
): Promise<{
  resizedFull: Buffer | undefined;
  resizedPreview: Buffer | undefined;
  resizedThumbnail: Buffer | undefined;
}> => {
  let resizedFull: Buffer | undefined,
    resizedPreview: Buffer | undefined,
    resizedThumbnail: Buffer | undefined;

  if (fullWidth) {
    resizedFull = await resizeWithSharp(
      inputFile,
      fullWidth,
      undefined,
      "inside",
      imageType,
    );
  }
  if (previewWidth) {
    resizedPreview = await resizeWithSharp(
      inputFile,
      previewWidth,
      undefined,
      "inside",
      imageType,
    );
  }
  if (thumbnailWidth) {
    resizedThumbnail = await resizeWithSharp(
      inputFile,
      thumbnailWidth,
      undefined,
      "inside",
      imageType,
    );
  }

  return {
    resizedFull,
    resizedPreview,
    resizedThumbnail,
  };
};

const getResizedImages = (
  inputFile: Buffer,
  processor: "jimp" | "sharp",
  fullWidth: number | undefined,
  previewWidth: number | undefined,
  thumbnailWidth: number | undefined,
  imageType?: keyof sharp.FormatEnum,
) => {
  if (processor === "sharp") {
    return getResizedImagesSharp(
      inputFile,
      fullWidth,
      previewWidth,
      thumbnailWidth,
      imageType,
    );
  } else {
    return getResizedImagesJimp(
      inputFile,
      fullWidth,
      previewWidth,
      thumbnailWidth,
    );
  }
};

// image types and formats

export function detectMimeType(buffer: Buffer) {
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "jpeg";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }
  return "png";
}

export const checkImageFileSize = (
  file: Express.Multer.File,
  maxSizeInMB: number,
) => {
  const maxRangeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > 0 && file.size <= maxRangeInBytes) return true;
  return false;
};

export const checkImageFileType = (file: Express.Multer.File) => {
  const fileTypes = /^.(jpg|jpeg|png|webp)$/i;
  const isValidExtension = fileTypes.test(path.extname(file.originalname));
  if (!isValidExtension) return false;

  const mimeTypes = /^(image\/)/;
  const isValidMimeType = mimeTypes.test(file.mimetype);
  if (!isValidMimeType) return false;

  // for security purpose, check the header for the file signature AKA magic bytes
  const headerTypes = /^(89504E470D0A1A0A|FFD8FF|52494646)/i;
  const isValidHeader = headerTypes.test(
    file.buffer.subarray(0, 12).toString("hex"),
  );
  if (!isValidHeader) return false;

  return true;
};

export const imageUrlToBase64 = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"];

    const base64String = `data:${contentType};base64,${Buffer.from(
      response.data,
    ).toString("base64")}`;

    return base64String;
  } catch (err) {
    logger.error("error converting image URL to base64");
  }
};

// s3 and image uploads
export async function customResizeAndUploadImage(
  title: string,
  folderName: string,
  shouldRandomizeTitle: boolean,
  fileBuffer: Buffer,
  width: number,
  height: number | undefined = undefined,
  fit: "cover" | "inside" = "inside",
) {
  const mimeType = detectMimeType(fileBuffer);
  const sanitizedText = getSanitizedText(title);

  const finalKey = `${folderName}/${
    shouldRandomizeTitle ? getRandomFileName(sanitizedText) : sanitizedText
  }`;

  const originalKey = `${finalKey}.${mimeType}`;

  const resizedBuffer = await resizeWithSharp(
    fileBuffer,
    width,
    height,
    fit,
    mimeType,
  );

  const s3Response = (await new Upload({
    client: s3FromConfig,
    params: {
      Bucket: config.S3_BUCKET,
      Key: originalKey,
      Body: resizedBuffer,
      ACL: "public-read",
      ContentType: "image/png",
    },
  }).done()) as CompleteMultipartUploadCommandOutput;

  return s3Response.Location;
}

export async function resizeAndUploadToStorage(
  title: string,
  fileBuffer: Buffer,
  storeId: string,
  folderName: string,
  full: boolean,
  preview: boolean,
  thumbnail: boolean,
  thumbnailImageSize?: number,
  previewImageSize?: number,
  fullImageSize?: number,
) {
  const imageType = detectMimeType(fileBuffer);
  const { resizedFull, resizedPreview, resizedThumbnail } =
    await getResizedImages(
      fileBuffer,
      RESIZE_STRATEGY,
      full ? (fullImageSize ? fullImageSize : FULL_WIDTH) : undefined,
      preview
        ? previewImageSize
          ? previewImageSize
          : PREVIEW_WIDTH
        : undefined,
      thumbnail
        ? thumbnailImageSize
          ? thumbnailImageSize
          : THUMBNAIL_WIDTH
        : undefined,
      imageType,
    );

  const randomFileName = getRandomFileName(title);

  const fullKey = `stores/${storeId}/${folderName}/tr-${FULL_WIDTH}xauto/${randomFileName}.${imageType}`;
  const previewKey = `stores/${storeId}/${folderName}/tr-${PREVIEW_WIDTH}xauto/${randomFileName}.${imageType}`;
  const thumbnailKey = `stores/${storeId}/${folderName}/tr-${THUMBNAIL_WIDTH}xauto/${randomFileName}.${imageType}`;

  let fullImg: string | undefined,
    previewImg: string | undefined,
    thumbnailImg: string | undefined;

  const s3ToUse = s3FromConfig;
  const s3BucketToUse = config.S3_BUCKET;

  if (full && resizedFull) {
    const fullUploadData = (await new Upload({
      client: s3ToUse,
      params: {
        Bucket: s3BucketToUse,
        Key: fullKey,
        Body: resizedFull,
        ACL: "public-read",
        ContentType: `image/${imageType}`,
      },
    }).done()) as CompleteMultipartUploadCommandOutput;
    fullImg = fullUploadData.Location;
  }
  if (preview && resizedPreview) {
    const previewData = (await new Upload({
      client: s3ToUse,
      params: {
        Bucket: s3BucketToUse,
        Key: previewKey,
        Body: resizedPreview,
        ACL: "public-read",
        ContentType: `image/${imageType}`,
      },
    }).done()) as CompleteMultipartUploadCommandOutput;
    previewImg = previewData.Location;
  }
  if (thumbnail && resizedThumbnail) {
    const thumbnailData = (await new Upload({
      client: s3ToUse,
      params: {
        Bucket: s3BucketToUse,
        Key: thumbnailKey,
        Body: resizedThumbnail,
        ACL: "public-read",
        ContentType: `image/${imageType}`,
      },
    }).done()) as CompleteMultipartUploadCommandOutput;
    thumbnailImg = thumbnailData.Location;
  }

  return {
    fullImg,
    previewImg,
    thumbnailImg,
  };
}

const expire30daysFolderName = "temporary30d";

export async function customResizeAndUploadImageWithExpirationTime(
  title: string,
  folderName: string,
  shouldRandomizeTitle: boolean,
  fileBuffer: Buffer,
  width: number,
  height: number | undefined = undefined,
  fit: "cover" | "inside" = "inside",
) {
  const mimeType = detectMimeType(fileBuffer);
  const sanitizedText = getSanitizedText(title);

  const finalKey = `${expire30daysFolderName}/${folderName}/${
    shouldRandomizeTitle ? getRandomFileName(sanitizedText) : sanitizedText
  }`;

  const originalKey = `${finalKey}.${mimeType}`;

  const resizedBuffer = await resizeWithSharp(
    fileBuffer,
    width,
    height,
    fit,
    mimeType,
  );

  const s3Response = (await new Upload({
    client: s3FromConfig,
    params: {
      Bucket: config.S3_BUCKET,
      Key: originalKey,
      Body: resizedBuffer,
      ACL: "public-read",
      ContentType: "image/png",
    },
  }).done()) as CompleteMultipartUploadCommandOutput;

  return s3Response.Location;
}

export async function deleteObjectsFromStorage(
  objectUrls: (string | undefined)[],
) {
  const keys: { Key: string }[] = [];
  objectUrls.forEach((o) => {
    if (o && o.split("aws.com/").length === 2) {
      keys.push({ Key: o.split("aws.com/")[1] });
    }
  });
  if (keys.length) {
    try {
      await s3FromConfig.deleteObjects({
        Bucket: config.S3_BUCKET,
        Delete: { Objects: keys },
      });
    } catch (err) {}
  }
}
