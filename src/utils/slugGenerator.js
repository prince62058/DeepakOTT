const slugify = require("slugify");
const crypto = require("crypto");

/**
 * Generates a unique slug with a random ID.
 * @param {String} text - The text to generate slug from (e.g., title).
 * @returns {String} - A unique slug string.
 */
const generateSlugWithId = (text) => {
  // Create base slug from text
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Generate short unique id (4 random bytes -> 8 hex chars)
  const uniqueId = crypto.randomBytes(4).toString("hex");

  // Combine both
  return `${baseSlug}-${uniqueId}`;
};

module.exports = { generateSlugWithId };
