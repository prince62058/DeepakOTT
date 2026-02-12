const MovieWebSeries = require("../models/movieWebSeriesModel");
const WatchHistory = require("../models/watchHistoryModel");
const WishList = require("../models/wishListModel");
const LikeRate = require("../models/likeRateModel");
const MovieRent = require("../models/movieRentModel");
const AWS = require("aws-sdk");
const { fixData, parseDurationToMinutes } = require("../utils/urlFixer");
require("dotenv").config();

// configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(
  process.env.LINODE_OBJECT_STORAGE_ENDPOINT.startsWith("http")
    ? process.env.LINODE_OBJECT_STORAGE_ENDPOINT
    : `https://${process.env.LINODE_OBJECT_STORAGE_ENDPOINT}`,
);

const s3 = new AWS.S3({
  accessKeyId: process.env.LINODE_ACCESS_KEY,
  secretAccessKey: process.env.LINODE_SECRET_KEY,
  endpoint: spacesEndpoint,
  s3ForcePathStyle: false, // DigitalOcean supports virtual-hosted style
  signatureVersion: "v4",
  region: "sgp1",
});

// Generate Presigned URL for Direct Upload
const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "File name and type are required",
      });
    }

    const key = `movies/${Date.now()}-${fileName}`;

    // Params for the signed URL
    const params = {
      Bucket: process.env.LINODE_OBJECT_BUCKET,
      Key: key,
      Expires: 300, // URL expires in 5 minutes
      ContentType: fileType,
      ACL: "public-read",
    };

    // Generate signed URL
    const signedUrl = await s3.getSignedUrlPromise("putObject", params);

    // Public URL for accessing the file after upload
    const publicUrl = `https://${process.env.LINODE_OBJECT_BUCKET}.sgp1.digitaloceanspaces.com/${key}`;

    res.status(200).json({
      success: true,
      url: signedUrl,
      publicUrl: publicUrl,
      key: key,
    });
  } catch (error) {
    console.error("Presigned URL Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// upload controller for movies/ web series
const uploadMovie = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Movie file is required!",
      });
    }

    console.log(
      "Uploading file to Spaces:",
      req.file.originalname,
      "Bucket:",
      process.env.LINODE_OBJECT_BUCKET,
    );

    // set upload parameters
    const params = {
      Bucket: process.env.LINODE_OBJECT_BUCKET,
      Key: `movies/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer, // direct buffer
      ContentType: req.file.mimetype,
      ACL: "public-read", // make it publicly viewable
    };

    // multipart upload for large files
    const uploadToS3 = s3.upload(params, {
      partSize: 20 * 1024 * 1024, // 20MB chunks
      queueSize: 10, // concurrent uploads
    });

    uploadToS3.on("httpUploadProgress", (progress) => {
      // console.log(progress); // Too detailed for production logs
    });

    const data = await uploadToS3.promise();
    console.log("Upload success:", data.Location);

    // IMPORTANT: AWS SDK returns path-style URL like:
    // "https://sgp1.digitaloceanspaces.com/satyakabir-bucket/movies/..."
    // We need virtual-hosted style URL:
    // "https://satyakabir-bucket.sgp1.digitaloceanspaces.com/movies/..."
    const mainURL = `https://${process.env.LINODE_OBJECT_BUCKET}.sgp1.digitaloceanspaces.com/${data.Key}`;

    console.log("Corrected URL:", mainURL);

    res.status(201).json({
      success: true,
      message: "Movie uploaded successfully",
      url: mainURL,
    });
  } catch (error) {
    console.error("Upload Error Details:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.code, // extra info for debugging
    });
  }
};

// create movie/ web series api
const createMovieOrWebSeries = async (req, res) => {
  const {
    file,
    poster,
    teaserUrl,
    name,
    description,
    releaseDate,
    releaseYear,
    director,
    writer,
    cast,
    maturityInfo,
    totalDuration,
    genre,
    language,
    mainType,
    parentsSeries,
    subSeries,
    imdbRating,
    watchQuality,
    rating,
  } = req.body;

  // Helper function to safely parse JSON strings
  const parseIfString = (value) => {
    if (!value) return undefined;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const updatedCast = parseIfString(cast);
  const updatedGenre = parseIfString(genre);
  const updatedLanguage = parseIfString(language);
  const updatedSubSeries = parseIfString(subSeries);

  try {
    // if (!file || !poster || !name) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "File, poster, and name are required !",
    //   });
    // }

    // Handle web series nested structure from admin panel
    // Admin panel sends: { mainType: "WEB_SERIES", subSeries: [{ name, description, Series: [...], ... }] }
    // We need to extract data from subSeries[0] and flatten it
    let finalData = {
      file,
      poster,
      teaserUrl,
      name,
      description,
      releaseDate,
      releaseYear,
      director,
      writer,
      cast: updatedCast,
      maturityInfo,
      totalDuration: parseDurationToMinutes(totalDuration),
      genre: updatedGenre,
      language: updatedLanguage,
      mainType,
      parentsSeries,
      subSeries: updatedSubSeries,
      imdbRating,
      watchQuality: watchQuality || "HD",
      rating,
      sessions: updatedSubSeries?.map((s) => s.session || 1) || [],
    };

    // If web series with nested structure, extract metadata to top level
    if (mainType === "WEB_SERIES" && updatedSubSeries?.[0]) {
      const seriesDetails = updatedSubSeries[0];
      finalData = {
        ...finalData,
        name: seriesDetails.name || name,
        description: seriesDetails.description || description,
        poster: seriesDetails.poster || poster,
        teaserUrl: seriesDetails.teaserUrl || teaserUrl,
        cast: seriesDetails.cast || updatedCast,
        releaseDate: seriesDetails.releaseDate || releaseDate,
        releaseYear: seriesDetails.releaseYear || releaseYear,
        director: seriesDetails.director || director,
        writer: seriesDetails.writer || writer,
        imdbRating: seriesDetails.imdbRating || imdbRating,
        maturityInfo: seriesDetails.maturityInfo || maturityInfo,
        totalDuration: seriesDetails.totalDuration || totalDuration,
        rating: seriesDetails.rating || rating,
        subSeries: updatedSubSeries,
      };
    }

    const data = await MovieWebSeries.create(finalData);

    return res.status(201).json({
      success: true,
      message: "Movie / Web Series Post Created Successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update
const updateMovieOrWebSeries = async (req, res) => {
  const {
    movieOrSeriesId,
    file,
    poster,
    teaserUrl,
    name,
    description,
    releaseDate,
    releaseYear,
    director,
    writer,
    cast,
    maturityInfo,
    totalDuration,
    genre,
    language,
    mainType,
    parentsSeries,
    subSeries,
    imdbRating,
    watchQuality,
    index,
    session,
  } = req.body;

  // Helper function to safely parse JSON strings
  const parseIfString = (value) => {
    if (!value) return undefined;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const updatedCast = parseIfString(cast);
  const updatedGenre = parseIfString(genre);
  const updatedLanguage = parseIfString(language);
  const updatedSubSeries = parseIfString(subSeries);
  try {
    if (!movieOrSeriesId) {
      return res.status(400).json({
        success: false,
        message: "movieOrSeriesId is required !",
      });
    }

    let finalUpdateData = {
      file,
      poster,
      teaserUrl,
      name,
      description,
      releaseDate,
      releaseYear,
      director,
      writer,
      cast: updatedCast,
      maturityInfo,
      totalDuration: parseDurationToMinutes(totalDuration),
      genre: updatedGenre,
      language: updatedLanguage,
      mainType,
      parentsSeries,
      subSeries: updatedSubSeries,
      imdbRating,
      watchQuality: watchQuality || "HD",
      index,
      session,
      sessions: updatedSubSeries?.map((s) => s.session || 1) || [],
    };

    // If web series with nested structure, extract metadata to top level
    if (mainType === "WEB_SERIES" && updatedSubSeries?.[0]) {
      const seriesDetails = updatedSubSeries[0];
      finalUpdateData = {
        ...finalUpdateData,
        name: seriesDetails.name || name,
        description: seriesDetails.description || description,
        poster: seriesDetails.poster || poster,
        teaserUrl: seriesDetails.teaserUrl || teaserUrl,
        cast: seriesDetails.cast || updatedCast,
        releaseDate: seriesDetails.releaseDate || releaseDate,
        releaseYear: seriesDetails.releaseYear || releaseYear,
        director: seriesDetails.director || director,
        writer: seriesDetails.writer || writer,
        imdbRating: seriesDetails.imdbRating || imdbRating,
        maturityInfo: seriesDetails.maturityInfo || maturityInfo,
        totalDuration: seriesDetails.totalDuration || totalDuration,
        rating: seriesDetails.rating || rating,
      };
    }

    const data = await MovieWebSeries.findByIdAndUpdate(
      movieOrSeriesId,
      finalUpdateData,
      { new: true },
    ).populate("genre language");

    return res.status(200).json({
      success: true,
      message: "Movie / Web Series Post Updated Successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all
const getAllByFilter = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = "-createdAt",
    search = "",
    genre,
    language,
    year,
    type,
    minRating = 0,
    maxRating = 10,
    director,
    cast,
    excludeEpisodes = "false", // New parameter to control episode filtering
  } = req.query;

  const skip = (Number(page) - 1) * limit;

  try {
    // Build filter object
    const filter = {};

    // Search in name, description, director, writer, or cast names
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { director: { $regex: search, $options: "i" } },
        { writer: { $regex: search, $options: "i" } },
        { "cast.name": { $regex: search, $options: "i" } },
        { "subSeries.name": { $regex: search, $options: "i" } },
        { "subSeries.description": { $regex: search, $options: "i" } },
        { "subSeries.director": { $regex: search, $options: "i" } },
        { "subSeries.writer": { $regex: search, $options: "i" } },
        { "subSeries.cast.name": { $regex: search, $options: "i" } },
      ];
    }

    // Filter by genre (can be single ID or comma-separated IDs)
    if (genre) {
      const genreIds = genre.split(",");
      filter.genre = { $in: genreIds };
    }

    // Filter by language (can be single ID or comma-separated IDs)
    if (language) {
      const languageIds = language.split(",");
      filter.language = { $in: languageIds };
    }

    // Filter by release year
    if (year) {
      filter.releaseDate = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${Number(year) + 1}-01-01`),
      };
    }

    // Filter by type (MOVIE or WEB_SERIES)
    if (type) {
      filter.mainType = type.toUpperCase();
    }

    // Filter by rating range
    filter.rating = { $gte: Number(minRating), $lte: Number(maxRating) };

    // Filter by director
    if (director) {
      filter.director = { $regex: director, $options: "i" };
    }

    // Filter by cast member
    if (cast) {
      filter["cast.name"] = { $regex: cast, $options: "i" };
    }

    // Filter out child episodes - only for mobile app, not for admin panel
    // Admin panel needs to see all content including episodes for management
    if (excludeEpisodes === "true") {
      filter.parentsSeries = { $in: [null, undefined] };
    }

    // Execute query with filters
    const [data, total] = await Promise.all([
      MovieWebSeries.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate("genre language")
        .lean(),
      MovieWebSeries.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully with applied filters.",
      data: fixData(data),
      currentPage: Number(page),
      page: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// get by id and generate watch history
const getMovieOrSeriesById = async (req, res) => {
  const { movieOrSeriesId, userId } = req.query;
  try {
    if (!movieOrSeriesId || !userId) {
      return res.status(400).json({
        success: false,
        message: "movieOrSeriesId and userId are required",
      });
    }

    let data;
    let isNested = movieOrSeriesId.includes("_nested_");

    if (isNested) {
      const parts = movieOrSeriesId.split("_nested_");
      const parentId = parts[0];
      const idPart = parts[1];

      let seasonIdx = 0;
      let episodeIdx = 0;

      if (idPart.includes("_")) {
        const indexes = idPart.split("_");
        seasonIdx = parseInt(indexes[0]);
        episodeIdx = parseInt(indexes[1]);
      } else {
        episodeIdx = parseInt(idPart);
      }

      const parent =
        await MovieWebSeries.findById(parentId).populate("genre language");

      if (!parent || !parent.subSeries?.[seasonIdx]?.Series?.[episodeIdx]) {
        return res
          .status(404)
          .json({ success: false, message: "Episode Not Found !" });
      }

      const seasonData = parent.subSeries[seasonIdx];
      const ep = seasonData.Series[episodeIdx];

      // Create a virtual document for the episode
      const epData = parent.toObject();
      delete epData.totalDuration; // Don't inherit parent duration

      data = {
        ...epData,
        _id: movieOrSeriesId,
        name: ep.title || ep.name || `Episode ${episodeIdx + 1}`,
        file: ep.file || ep.url,
        poster: ep.poster || ep.thumbnail || parent.poster,
        description: ep.description || parent.description,
        totalDuration: ep.totalDuration || 0, // Use episode specific duration if available
        mainType: "EPISODE",
        parentsSeries: parentId,
        session: seasonData.session || seasonIdx + 1, // Add session info
        index: episodeIdx + 1,
      };
      // We need _doc for some property assignments below
      data._doc = { ...data };
    } else {
      data =
        await MovieWebSeries.findById(movieOrSeriesId).populate(
          "genre language",
        );
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Data Not Found !",
      });
    }

    const moreLikeThis = await MovieWebSeries.find({
      genre: { $in: data.genre },
      _id: {
        $nin: [isNested ? movieOrSeriesId.split("_nested_")[0] : data._id],
      },
    });
    const watched = await WatchHistory.findOne({
      userId,
      movieOrSeriesId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
    });
    const wishListed = await WishList.findOne({
      userId,
      movieOrSeriesId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
    });
    const likeRate = await LikeRate.findOne({
      userId,
      movieOrSeriesId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
    });

    const rented = await MovieRent.findOne({
      userId,
      movieId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
      isActivePlan: true,
    });

    if (watched) {
      data._doc.playTimeStamps = watched.playTimeStamps;
    } else {
      await WatchHistory.create({
        userId,
        movieOrSeriesId: isNested
          ? movieOrSeriesId.split("_nested_")[0]
          : movieOrSeriesId,
      });
      data._doc.playTimeStamps = 0;
    }

    if (data.mainType == "WEB_SERIES" || data.mainType == "EPISODE") {
      let episodes = [];
      const seriesId =
        data.mainType === "EPISODE" ? data.parentsSeries : data._id;

      // 1. Check for episodes in separate documents (parentsSeries pattern)
      const separateEpisodes = await MovieWebSeries.find({
        $or: [
          { parentsSeries: seriesId },
          { _id: seriesId }, // Include parent if it's considered part of the series
        ],
      });

      if (separateEpisodes && separateEpisodes.length > 0) {
        // Filter out the parent if it's just the container
        episodes = separateEpisodes.filter((doc) => doc.mainType === "EPISODE");
      }

      // 2. Check for nested episodes in subSeries (admin panel pattern)
      // We need to fetch the actual series document if the current 'data' is a virtual episode
      let seriesDoc =
        data.mainType === "EPISODE" && isNested
          ? await MovieWebSeries.findById(seriesId)
          : data;

      if (seriesDoc && seriesDoc.subSeries && seriesDoc.subSeries.length > 0) {
        // Iterate over ALL seasons (subSeries items)
        seriesDoc.subSeries.forEach((season, sIdx) => {
          if (season.Series && season.Series.length > 0) {
            const seasonEpisodes = season.Series.map((ep, eIdx) => ({
              _id: `${seriesDoc._id}_nested_${sIdx}_${eIdx}`, // Synthetic ID with Season Index
              name: ep.title || ep.name || `Episode ${eIdx + 1}`,
              file: ep.file || ep.url,
              poster: ep.poster || ep.thumbnail,
              description: ep.description || seriesDoc.description,
              mainType: "EPISODE",
              parentsSeries: seriesDoc._id,
              session: season.session || sIdx + 1, // Critical for frontend grouping
              index: eIdx + 1,
            }));
            episodes = [...episodes, ...seasonEpisodes];
          }
        });
      }

      data._doc.episodes = episodes;
      data._doc.episode = episodes; // Keeping for backward compatibility
    }

    data._doc.isMyListed = wishListed ? true : false;
    data._doc.isRated = likeRate ? true : false;

    data._doc.isRented = rented ? true : false;

    return res.status(200).json({
      success: true,
      message: "MovieOrSeries Data Fetched Successfully.",
      data: fixData(data),
      moreLikeThis: fixData(moreLikeThis),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// deep delete movie/ web series
const deleteMovieOrWebSeries = async (req, res) => {
  const { id } = req.params;
  try {
    const movie = await MovieWebSeries.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie/Web Series not found",
      });
    }

    // Helper to extract key from full URL
    // URL format: https://Bucket.Region.digitaloceanspaces.com/Key
    const extractKey = (url) => {
      if (!url) return null;
      try {
        const urlObj = new URL(url);
        // The pathname includes the leading slash, so we strip it.
        // example pathname: /movies/file.mp4 -> Key: movies/file.mp4
        return urlObj.pathname.substring(1);
      } catch (e) {
        console.error("Error parsing URL:", url, e);
        return null;
      }
    };

    const keysToDelete = [];
    if (movie.file) keysToDelete.push({ Key: extractKey(movie.file) });
    if (movie.poster) keysToDelete.push({ Key: extractKey(movie.poster) });
    if (movie.teaserUrl)
      keysToDelete.push({ Key: extractKey(movie.teaserUrl) });

    // Filter out null keys
    const validKeys = keysToDelete.filter((k) => k.Key);

    if (validKeys.length > 0) {
      const deleteParams = {
        Bucket: process.env.LINODE_OBJECT_BUCKET,
        Delete: {
          Objects: validKeys,
          Quiet: false,
        },
      };

      try {
        await s3.deleteObjects(deleteParams).promise();
        console.log("Deleted S3 objects:", validKeys);
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
        // We continue to delete from DB even if S3 fails, or you might choose to abort.
      }
    }

    // Delete related data
    await Promise.all([
      WatchHistory.deleteMany({ movieOrSeriesId: id }),
      WishList.deleteMany({ movieOrSeriesId: id }),
      LikeRate.deleteMany({ movieOrSeriesId: id }),
      MovieRent.deleteMany({ movieId: id }),
    ]);

    await MovieWebSeries.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Movie/Web Series and associated files deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get by id and see trailer without generating watch history
const getTrailerMovieOrSeriesById = async (req, res) => {
  const { movieOrSeriesId, userId } = req.query;
  try {
    if (!movieOrSeriesId || !userId) {
      return res.status(400).json({
        success: false,
        message: "movieOrSeriesId and userId are required",
      });
    }

    let data;
    let isNested = movieOrSeriesId.includes("_nested_");

    if (isNested) {
      const parts = movieOrSeriesId.split("_nested_");
      const parentId = parts[0];
      const idPart = parts[1];

      let seasonIdx = 0;
      let episodeIdx = 0;

      if (idPart.includes("_")) {
        const indexes = idPart.split("_");
        seasonIdx = parseInt(indexes[0]);
        episodeIdx = parseInt(indexes[1]);
      } else {
        episodeIdx = parseInt(idPart);
      }

      const parent =
        await MovieWebSeries.findById(parentId).populate("genre language");

      if (!parent || !parent.subSeries?.[seasonIdx]?.Series?.[episodeIdx]) {
        return res
          .status(404)
          .json({ success: false, message: "Episode Not Found !" });
      }

      const seasonData = parent.subSeries[seasonIdx];
      const ep = seasonData.Series[episodeIdx];
      data = {
        ...parent.toObject(),
        _id: movieOrSeriesId,
        name: ep.title || ep.name || `Episode ${episodeIdx + 1}`,
        file: ep.file || ep.url,
        poster: ep.poster || ep.thumbnail || parent.poster,
        description: ep.description || parent.description,
        mainType: "EPISODE",
        parentsSeries: parentId,
        session: seasonData.session || seasonIdx + 1,
        index: episodeIdx + 1,
      };
      data._doc = { ...data };
    } else {
      data =
        await MovieWebSeries.findById(movieOrSeriesId).populate(
          "genre language",
        );
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Data Not Found !",
      });
    }

    const moreLikeThis = await MovieWebSeries.find({
      genre: { $in: data.genre },
      _id: {
        $nin: [isNested ? movieOrSeriesId.split("_nested_")[0] : data._id],
      },
    }).populate("genre language");
    const wishListed = await WishList.findOne({
      userId,
      movieOrSeriesId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
    });
    const likeRate = await LikeRate.findOne({
      userId,
      movieOrSeriesId: isNested
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId,
    });

    if (data.mainType == "WEB_SERIES" || data.mainType == "EPISODE") {
      let episodes = [];
      const seriesId =
        data.mainType === "EPISODE" ? data.parentsSeries : data._id;

      // 1. Check for separate episodes
      const separateEpisodes = await MovieWebSeries.find({
        $or: [{ parentsSeries: seriesId }, { _id: seriesId }],
      });

      if (separateEpisodes && separateEpisodes.length > 0) {
        episodes = separateEpisodes.filter((doc) => doc.mainType === "EPISODE");
      }

      // 2. Check for nested episodes
      let seriesDoc =
        data.mainType === "EPISODE" && isNested
          ? await MovieWebSeries.findById(seriesId)
          : data;

      if (seriesDoc && seriesDoc.subSeries && seriesDoc.subSeries.length > 0) {
        // Iterate over ALL seasons (subSeries items)
        seriesDoc.subSeries.forEach((season, sIdx) => {
          if (season.Series && season.Series.length > 0) {
            const seasonEpisodes = season.Series.map((ep, eIdx) => ({
              _id: `${seriesDoc._id}_nested_${sIdx}_${eIdx}`, // Synthetic ID
              name: ep.title || ep.name || `Episode ${eIdx + 1}`,
              file: ep.file || ep.url,
              poster: ep.poster || ep.thumbnail,
              description: ep.description || seriesDoc.description,
              mainType: "EPISODE",
              parentsSeries: seriesDoc._id,
              session: season.session || sIdx + 1,
              index: eIdx + 1,
            }));
            episodes = [...episodes, ...seasonEpisodes];
          }
        });
      }

      data._doc.episodes = episodes;
      data._doc.episode = episodes;
    }

    data._doc.isMyListed = wishListed ? true : false;
    data._doc.isRated = likeRate ? true : false;

    return res.status(200).json({
      success: true,
      message: "MovieOrSeries Data Fetched Successfully.",
      data: fixData(data),
      moreLikeThis: fixData(moreLikeThis),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadMovie,
  getPresignedUrl,
  getAllByFilter,
  createMovieOrWebSeries,
  updateMovieOrWebSeries,
  getMovieOrSeriesById,
  getTrailerMovieOrSeriesById,
  deleteMovieOrWebSeries,
};
