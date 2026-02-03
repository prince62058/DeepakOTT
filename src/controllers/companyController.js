const { Company } = require("../models/companyModel");

// get company
const getCompany = async (req, res) => {
  try {
    const companyDetails = await Company.findOne();
    res.status(200).json({
      success: true,
      message: "Company details fetched successfully",
      data: companyDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update company
const updateCompany = async (req, res) => {
  const { companyId } = req.query;
  const {
    name,
    privacyPolicy,
    termsCondition,
    aboutUs,
    gst,
    phoneNumber,
    email,
    address,
    xUrl,
    instaUrl,
    facebookUrl,
    linkedineUrl,
    referralEarning,
    index,
  } = req.body;

  const updatedData = {
    name,
    privacyPolicy,
    termsCondition,
    aboutUs,
    gst,
    phoneNumber,
    email,
    address,
    xUrl,
    instaUrl,
    facebookUrl,
    linkedineUrl,
    referralEarning,
    index,
  };

  try {
    const company = await Company.findOne();
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found." });
    }

    const icon = req.files?.icon?.[0]?.location || company?.icon;
    const favIcon = req.files?.favIcon?.[0]?.location || company?.favIcon;
    const loader = req.files?.loader?.[0]?.location || company?.loader;

    if (icon && icon !== company?.icon) {
     // deleteFileFromObjectStorage(company?.icon);
      updatedData.icon = icon;
    }

    if (favIcon && favIcon !== company?.favIcon) {
    //  deleteFileFromObjectStorage(company?.favIcon);
      updatedData.favIcon = favIcon;
    }

    if (loader && loader !== company?.loader) {
     // deleteFileFromObjectStorage(company?.loader);
      updatedData.loader = loader;
    }

    const data = await Company.findByIdAndUpdate(companyId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Company Data Updated Successfully",
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
  getCompany,
  updateCompany,
};
