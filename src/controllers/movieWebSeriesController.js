const MovieWebSeries = require("../models/movieWebSeriesModel");
const WatchHistory = require("../models/watchHistoryModel");
const WishList = require("../models/wishListModel");
const LikeRate = require("../models/likeRateModel");
const MovieRent = require("../models/movieRentModel");
const AWS = require("aws-sdk");
const { fixData } = require("../utils/urlFixer");
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

    // Ensure we construct the DigitalOcean URL correctly
    let mainURL = data.Location;
    // Fallback if Location is not what we expect (though for spaces it usually is)
    if (!mainURL.includes("digitaloceanspaces.com")) {
      mainURL = `https://${process.env.LINODE_OBJECT_BUCKET}.sgp1.digitaloceanspaces.com/${data.Key}`;
    }

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

    const data = await MovieWebSeries.create({
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
      totalDuration,
      genre: updatedGenre,
      language: updatedLanguage,
      mainType,
      parentsSeries,
      subSeries: updatedSubSeries,
      imdbRating,
      watchQuality: watchQuality || "HD",
      rating,
    });

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

    const data = await MovieWebSeries.findByIdAndUpdate(
      movieOrSeriesId,
      {
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
        totalDuration,
        genre: updatedGenre,
        language: updatedLanguage,
        mainType,
        parentsSeries,
        subSeries: updatedSubSeries,
        imdbRating,
        watchQuality: watchQuality || "HD",
        index,
        session,
      },
      { new: true },
    );

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
      filter.releaseYear = year;
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
    const data = await MovieWebSeries.findById(movieOrSeriesId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Data Not Found !",
      });
    }

    const moreLikeThis = await MovieWebSeries.find({
      genre: { $in: data.genre },
      _id: { $nin: data._id },
    });
    const watched = await WatchHistory.findOne({
      userId,
      movieOrSeriesId: movieOrSeriesId,
    });
    const wishListed = await WishList.findOne({
      userId,
      movieOrSeriesId: movieOrSeriesId,
    });
    const likeRate = await LikeRate.findOne({
      userId,
      movieOrSeriesId: movieOrSeriesId,
    });

    const rented = await MovieRent.findOne({
      userId,
      movieId: movieOrSeriesId,
      isActivePlan: true,
    });

    if (watched) {
      data._doc.playTimeStamps = watched.playTimeStamps;
    } else {
      await WatchHistory.create({
        userId,
        movieOrSeriesId: movieOrSeriesId,
      });
      data._doc.playTimeStamps = 0;
    }

    if (data.mainType == "WEB_SERIES") {
      data._doc.episode = data.parentsSeries
        ? await MovieWebSeries.find({
            $or: [
              { parentsSeries: data.parentsSeries },
              { _id: data.parentsSeries },
            ],
          })
        : await MovieWebSeries.find({ parentsSeries: data._id });
    }

    data._doc.isMyListed = wishListed ? true : false;
    data._doc.isRated = likeRate ? true : false;

    data._doc.isRented = rented ? true : false;

    return res.status(200).json({
      success: true,
      message: "MovieOrSeries Data Fetched Successfully.",
      data: data,
      moreLikeThis: moreLikeThis,
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
    const data =
      await MovieWebSeries.findById(movieOrSeriesId).populate("genre language");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Data Not Found !",
      });
    }

    const moreLikeThis = await MovieWebSeries.find({
      genre: { $in: data.genre },
      _id: { $nin: data._id },
    }).populate("genre language");
    const wishListed = await WishList.findOne({
      userId,
      movieOrSeriesId: movieOrSeriesId,
    });
    const likeRate = await LikeRate.findOne({
      userId,
      movieOrSeriesId: movieOrSeriesId,
    });

    if (data.mainType == "WEB_SERIES") {
      data._doc.episode = data.parentsSeries
        ? await MovieWebSeries.find({
            $or: [
              { parentsSeries: data.parentsSeries },
              { _id: data.parentsSeries },
            ],
          })
        : await MovieWebSeries.find({ parentsSeries: data._id });
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
  getAllByFilter,
  createMovieOrWebSeries,
  updateMovieOrWebSeries,
  getMovieOrSeriesById,
  getTrailerMovieOrSeriesById,
  deleteMovieOrWebSeries,
};
