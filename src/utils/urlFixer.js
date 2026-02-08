const fixUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  const oldDomain = "in-maa-1.linodeobjects.com/leadkart";
  const newDomain = "satyakabir-bucket.sgp1.digitaloceanspaces.com";

  let fixedUrl = url;

  // Replace old Linode domain with new DigitalOcean domain
  if (url.includes(oldDomain)) {
    fixedUrl = url.replace(oldDomain, newDomain);
  }

  // Fix malformed DigitalOcean URLs like:
  // "sgp1.digitaloceanspaces.com/satyakabir-bucket/..."
  // or "https://sgp1.digitaloceanspaces.com/satyakabir-bucket/..."
  // Should be: "https://satyakabir-bucket.sgp1.digitaloceanspaces.com/..."
  if (fixedUrl.includes("sgp1.digitaloceanspaces.com/satyakabir-bucket")) {
    fixedUrl = fixedUrl.replace(
      /https?:\/\/sgp1\.digitaloceanspaces\.com\/satyakabir-bucket\//g,
      "https://satyakabir-bucket.sgp1.digitaloceanspaces.com/",
    );
    // Handle case without protocol
    fixedUrl = fixedUrl.replace(
      /^sgp1\.digitaloceanspaces\.com\/satyakabir-bucket\//g,
      "https://satyakabir-bucket.sgp1.digitaloceanspaces.com/",
    );
  }

  // Ensure URL starts with https://
  if (!fixedUrl.startsWith("http")) {
    // If it's a relative path (doesn't contain the bucket domain), prepend it
    if (!fixedUrl.includes("digitaloceanspaces.com")) {
      fixedUrl = `https://satyakabir-bucket.sgp1.digitaloceanspaces.com/${fixedUrl.startsWith("/") ? fixedUrl.slice(1) : fixedUrl}`;
    } else {
      fixedUrl = `https://${fixedUrl}`;
    }
  }

  // Encode the URL to handle spaces and special characters
  // decodeURI first to prevent double encoding if it's already encoded
  try {
    return encodeURI(decodeURI(fixedUrl));
  } catch (e) {
    return encodeURI(fixedUrl);
  }
};

const fixData = (data) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => fixData(item));
  }

  if (typeof data === "object") {
    // Handle Mongoose documents
    const doc = data._doc ? data._doc : data;

    // Create a new object to avoid mutating the original if it's frozen
    const newDoc = { ...doc };

    // Fix all media URL fields
    if (newDoc.poster) newDoc.poster = fixUrl(newDoc.poster);
    if (newDoc.file) newDoc.file = fixUrl(newDoc.file);
    if (newDoc.video) newDoc.video = fixUrl(newDoc.video);
    if (newDoc.teaserUrl) newDoc.teaserUrl = fixUrl(newDoc.teaserUrl);
    if (newDoc.thumbnail) newDoc.thumbnail = fixUrl(newDoc.thumbnail);

    // Fix episodes array (for web series)
    if (newDoc.episode && Array.isArray(newDoc.episode)) {
      newDoc.episode = newDoc.episode.map((ep) => fixData(ep));
    }
    if (newDoc.episodes && Array.isArray(newDoc.episodes)) {
      newDoc.episodes = newDoc.episodes.map((ep) => fixData(ep));
    }

    // Fix nested movieOrSeriesId
    if (newDoc.movieOrSeriesId) {
      newDoc.movieOrSeriesId = fixData(newDoc.movieOrSeriesId);
    }

    return newDoc;
  }

  return data;
};

module.exports = { fixUrl, fixData };
