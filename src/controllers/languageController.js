const Language = require("../models/languageModel");

// get all languages
const getLanguages = async (req, res) => {
  const { page = "1", limit = "20", search ,disable} = req.query;

  try {
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (search && search.trim()) {
      filter.name = new RegExp(search.trim(), "i");
    }
    if(disable){
      filter.disable = disable
    }
    const [data, total] = await Promise.all([
      Language.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Language.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return res.status(200).json({
      success: true,
      message: "All Languages Data Fetched Successfully.",
      data,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get language by id
const getLanguageById = async (req, res) => {
  const { languageId } = req.query;
  try {
    const data = await Language.findById(languageId);

    return res.status(200).json({
      success: true,
      message: "Language Data Fetched Successfully.",
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

// create language
const createLanguage = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }
    const search = toFirstCapital(name);
    const existLanguage = await Language.findOne({ name: search });
    if (existLanguage) {
      return res.status(400).json({
        success: false,
        message: "Language already exist !",
      });
    }

    const data = await Language.create({
      name: search,
    });

    return res.status(201).json({
      success: true,
      message: "New Language Created Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update language
const updateLanguage = async (req, res) => {
  const { id } = req.params;
  const { name, disable } = req.body;

  try {
    const updatePayload = {};

    if (name) {
      const formattedName = toFirstCapital(name);

      const duplicate = await Language.findOne({
        _id: { $ne: id },
        name: formattedName,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Language already exist !",
        });
      }

      updatePayload.name = formattedName;
    }

    if (typeof disable === "boolean") {
      updatePayload.disable = disable;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedLanguage = await Language.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!updatedLanguage) {
      return res.status(404).json({
        success: false,
        message: "Language not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully.",
      data: updatedLanguage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getLanguages,
  getLanguageById,
  createLanguage,
  updateLanguage,
};
