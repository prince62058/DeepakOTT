const Genre = require("../models/genrePreferenceModel");

// get all genre
const getGenre = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, disable } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(Number(limit) || 20, 100));
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (disable) {
      filter.disable = disable;
    }
    if (search && typeof search === "string" && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const [data, total] = await Promise.all([
      Genre.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Genre.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Genre list fetched successfully.",
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get genre by id
const getGenreById = async (req, res) => {
  const { genreId } = req.query;
  try {
    const data = await Genre.findById(genreId);

    return res.status(200).json({
      success: true,
      message: "Genre Data Fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function toFirstCapital(str) {
  if (!str) return ""; // handle empty string
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
// create genre
const createGenre = async (req, res) => {
  const { name, image } = req.body;
  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }
    const search = toFirstCapital(name);
    const existGenre = await Genre.findOne({ name: search });
    if (existGenre) {
      return res.status(400).json({
        success: false,
        message: "Genre already exist !",
      });
    }

    const data = await Genre.create({
      name: search,
      image,
    });

    return res.status(201).json({
      success: true,
      message: "New Genre Created Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update genre
const updateGenre = async (req, res) => {
  const { id } = req.params;
  const { name, image, disable } = req.body;

  try {
    const updatePayload = {};

    if (name) {
      const formattedName = toFirstCapital(name);

      const duplicate = await Genre.findOne({
        _id: { $ne: id },
        name: formattedName,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Genre already exist !",
        });
      }

      updatePayload.name = formattedName;
    }

    if (image) {
      updatePayload.image = image;
    }

    if (typeof disable !== "undefined") {
      if (disable === "true" || disable === true) {
        updatePayload.disable = true;
      } else if (disable === "false" || disable === false) {
        updatePayload.disable = false;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedGenre = await Genre.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!updatedGenre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Genre updated successfully.",
      data: updatedGenre,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete genre
const deleteGenre = async (req, res) => {
  const { id } = req.params;
  try {
    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }
    await Genre.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getGenre,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
};
