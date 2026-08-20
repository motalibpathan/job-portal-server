export function sanitizeForRegex(s: string | undefined) {
  if (!s) return "";
  return s.replace(/[#_+$]/g, "").trim();
}

export const getSanitizedText = (text: string) => {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(" ")
    .join("_");
};

export const getLettersSanitizedText = (text: string) => {
  return text.replace(/[^a-zA-Z0-9\s]/g, "").trim();
};

export const getSentenceFromSnakeCaseText = (text: string) =>
  text.replace(/_/g, " ");

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateRandomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const generateRandomUsername = (length: number) => {
  const validCharacters = "abcdefghijklmnopqrstuvwxyz0123456789-";
  let username = "";

  for (let i = 0; i < length; i++) {
    // Allow hyphens
    username += validCharacters.charAt(
      Math.floor(Math.random() * validCharacters.length),
    );
  }

  username = username.replace(/[-]+/g, "-"); // replace consecutive hyphens with single -
  username = username.replace(/^-|-$/g, ""); // remove initial / ending hyphens
  return username;
};

export const generateUsername = (name: string) => {
  if (!name?.length) return generateRandomUsername(8);

  const generatedName = name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9-]+/g, "-") // replace all characters except, a-z0-0, and -
    .replace(/[-]+/g, "-") // replace consecutive hyphens with single -
    .replace(/^-|-$/g, ""); // username does not start or end with -

  if (generatedName.length) {
    return generatedName;
  }
  return generateRandomUsername(10);
};

export const generateJobSlug = (title: string): string => {
  if (!title?.length) return generateRandomUsername(8);

  const slug = title
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/[-]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length) return slug;
  return generateRandomUsername(10);
};

export function getFirstWordFromString(str: string): string {
  const words = str.split(" ");
  return words[0];
}

/**
 * @returns truncated string with full word within maxLength
 */
export function getTruncatedStringWithFullWords(str: string, maxLength = 40) {
  if (str.length <= maxLength) return str;

  let trimmed = str.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");

  if (lastSpace > 0) {
    trimmed = trimmed.substring(0, lastSpace);
  }

  return trimmed;
}
