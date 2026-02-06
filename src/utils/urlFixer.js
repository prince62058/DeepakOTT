const fixUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  const oldDomain = "in-maa-1.linodeobjects.com/leadkart";
  const newDomain = "satyakabir-bucket.sgp1.digitaloceanspaces.com";

  let fixedUrl = url;
  if (url.includes(oldDomain)) {
    fixedUrl = url.replace(oldDomain, newDomain);
  }

  if (!fixedUrl.startsWith("http")) {
    fixedUrl = `https://${fixedUrl}`;
  }

  return fixedUrl;
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

    if (newDoc.poster) newDoc.poster = fixUrl(newDoc.poster);
    if (newDoc.file) newDoc.file = fixUrl(newDoc.file);
    if (newDoc.teaserUrl) newDoc.teaserUrl = fixUrl(newDoc.teaserUrl);

    // Also check for subSeries/episodes if nested
    if (newDoc.episode && Array.isArray(newDoc.episode)) {
      newDoc.episode = newDoc.episode.map((ep) => fixData(ep));
    }

    return newDoc;
  }

  return data;
};

module.exports = { fixUrl, fixData };
