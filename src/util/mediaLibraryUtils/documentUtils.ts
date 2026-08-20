import { CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import config from "../../settings/config";
import { getRandomFileName, s3FromConfig } from "./commonUtils";

// supported document types - Excel files only
const SUPPORTED_DOCUMENT_TYPES = {
  // Excel files
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  // csv
  "text/csv": "csv",
  // pdf
  "application/pdf": "pdf",
  // word documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
  // images
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type getSupportedDocumentTypes = keyof typeof SUPPORTED_DOCUMENT_TYPES;

// Helper to get allowed mime types from extensions
export const getAllowedMimeTypes = (
  allowedExtensions: string[],
): getSupportedDocumentTypes[] => {
  return Object.entries(SUPPORTED_DOCUMENT_TYPES)
    .filter(([_, ext]) => allowedExtensions.includes(ext))
    .map(([mimeType]) => mimeType as getSupportedDocumentTypes);
};

export const getDocumentExtension = (mimeType: string): string | undefined => {
  return SUPPORTED_DOCUMENT_TYPES[mimeType];
};

export const detectDocumentMimeType = (
  buffer: Buffer,
  originalName?: string,
): string | undefined => {
  // PDF signature
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // JPEG signature
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG signature
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // GIF signature
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WebP signature
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
    return "image/webp";
  }

  // ZIP-based Office documents (XLSX, DOCx)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    if (originalName) {
      const ext = path.extname(originalName).toLowerCase();
      if (ext === ".xlsx") {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
      if (ext === ".docx") {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
    }
    return undefined;
  }

  // Old Office documents signature (XLS)
  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    if (originalName) {
      const ext = path.extname(originalName).toLowerCase();
      if (ext === ".xls") {
        return "application/vnd.ms-excel";
      }
      if (ext === ".doc") {
        return "application/msword";
      }
    }
    // If it's an old Office file but not specifically .xls, reject it
    return undefined;
  }

  // CSV files (plain text, so check extension)
  if (originalName) {
    const ext = path.extname(originalName).toLowerCase();
    if (ext === ".csv") {
      return "text/csv";
    }
  }

  return undefined;
};

export const checkDocumentFileType = (
  file: Express.Multer.File,
  allowedMimeTypes: getSupportedDocumentTypes[],
): boolean => {
  const detectedMimeType = detectDocumentMimeType(
    file.buffer,
    file.originalname,
  );

  if (!detectedMimeType) {
    return false;
  }

  // Check if detected mime type is in the allowed list
  return allowedMimeTypes.includes(
    detectedMimeType as getSupportedDocumentTypes,
  );
};

export async function uploadDocumentToStorage(
  title: string,
  fileBuffer: Buffer,
  storeId: string,
  folderName: string,
  originalFileName?: string,
): Promise<string> {
  const mimeType = detectDocumentMimeType(fileBuffer, originalFileName);

  if (!mimeType) {
    throw new Error("Unsupported document type");
  }

  const extension = getDocumentExtension(mimeType);
  if (!extension) {
    throw new Error("Cannot determine file extension");
  }

  const randomFileName = getRandomFileName(title);
  const documentKey = `stores/${storeId}/${folderName}/${randomFileName}.${extension}`;

  const uploadData = (await new Upload({
    client: s3FromConfig,
    params: {
      Bucket: config.S3_BUCKET,
      Key: documentKey,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: mimeType,
      ContentDisposition: `attachment; filename="${randomFileName}.${extension}"`,
    },
  }).done()) as CompleteMultipartUploadCommandOutput;

  if (!uploadData.Location) {
    throw new Error("Document upload failed");
  }

  return uploadData.Location;
}
