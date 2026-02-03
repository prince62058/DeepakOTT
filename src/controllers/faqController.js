const Faq = require("../models/faqModel");


// create Faq
const createFAQ = async (req, res) => {
  const { question, answer } = req.body;
  try {
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "All Fields are required !",
      });
    }

    const data = await Faq.create({ question, answer });

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all faq
const getAllFAQ = async (req, res) => {
  const { page = 1, limit = 10, sort = -1, search, disable } = req.query;
  const skip = (Number(page) - 1) * limit;

  const orFilters = [
    { question: new RegExp(search, "i") },
    { answer: new RegExp(search, "i") },
  ];

  const filter = {
    ...(disable && { disable }),
    ...(search && { $or: orFilters }),
  };

  try {
    const data = await Faq.find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit);
    const total = await Faq.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "All FAQ Fetched Successfully.",
      data: data,
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

// get faq by id
const getFAQById = async (req, res) => {
  const { faqId } = req.query;
  try {
    if (!faqId) {
      return res.status(400).json({
        success: false,
        message: "faqId is required !",
      });
    }

    const faq = await Faq.findById(faqId);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "INVALID CREDENTIAL",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ Fetched Successfully.",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete faq
const deleteFaq = async (req, res) => {
  const { faqId } = req.query;
  try {
    if (!faqId) {
      return res.status(400).json({
        success: false,
        message: "faqId is required !",
      });
    }

    const faqData = await Faq.findById(faqId);

    if (!faqData) {
      return res.status(404).json({
        success: false,
        message: "FAQ Not Found !",
      });
    }

    const data = await Faq.findByIdAndDelete(faqId);

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// update faq
const updateFAQ = async (req, res) => {
  const { faqId, question, answer } = req.body;
  try {
    if (!faqId) {
      return res.status(400).json({
        success: false,
        message: "faqId is required !",
      });
    }

    const data = await Faq.findById(faqId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Faq not found !",
      });
    }
    data.question = question ? question : data.question;
    data.answer = answer ? answer : data.answer;
    await data.save();

    return res.status(201).json({
      success: true,
      message: "FAQ updated successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createFAQ,
  getFAQById,
  getAllFAQ,
  updateFAQ,
  deleteFaq,
};
