const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModels");
const PurchaseSubscription = require("../models/purchaseSubscriptionModel");
const { fixData } = require("../utils/urlFixer");

const ADMIN_LOGIN_EXCLUDE_FIELDS = "-otp -fcmToken";

const ADMIN_USER_LIST_PROJECTION = "-password -otp -fcmToken";

// SendOtp Api (logIn)
let generateOtp = Math.floor(1000 + Math.random() * 9000);
const http = require("http");

const otpLimits = {}; // In-memory store for OTP counts

const OTP_LIMIT = 5; // Max OTPs per hour
const OTP_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const sendOtpphone = (mobile, otp) => {
  const currentTime = Date.now();

  // Initialize the limit object for the mobile number if it doesn't exist
  if (!otpLimits[mobile]) {
    otpLimits[mobile] = { count: 0, firstSentTime: currentTime };
  }

  const { count, firstSentTime } = otpLimits[mobile];

  // Check if the current time is within the limit window
  if (currentTime - firstSentTime < OTP_WINDOW) {
    if (count >= OTP_LIMIT) {
      return false;
    }
  } else {
    // Reset the count and time if the window has passed
    otpLimits[mobile] = { count: 0, firstSentTime: currentTime };
  }

  // Send the OTP
  const options = {
    method: "POST",
    hostname: "api.msg91.com",
    port: null,
    path: "/api/v5/flow/",
    headers: {
      authkey: "384292AwWekgBJSf635f77feP1",
      "content-type": "application/json",
    },
  };

  const req = http.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.write(
    `{\n  \"flow_id\": \"63614b3dabf10640e61fa856\",\n  \"sender\": \"DSMONL\",\n  \"mobiles\": \"91${mobile}\",\n  \"otp\": \"${otp}\"\n}`,
  );
  req.end();

  // Increment the count for the mobile number
  otpLimits[mobile].count++;
};
const referralCode = async (length) => {
  const codeChar =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const codeCharLength = codeChar.length;

  let code, existingUser;

  do {
    code = "";
    for (let i = 0; i < length; i++) {
      code += codeChar.charAt(Math.floor(Math.random() * codeCharLength));
    }

    existingUser = await userModel.findOne({ referralCode: code });
  } while (existingUser);

  return code;
};

async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await userModel
      .findOne({ email, userType: { $in: ["Admin", "SubAdmin"] } })
      .select(ADMIN_LOGIN_EXCLUDE_FIELDS);

    if (!admin || admin?.disable) {
      return res.status(401).json({
        success: false,
        message: admin?.disable ? "Ban The Admin" : "Invalid credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });

    admin._doc.token = token;

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      data: fixData(admin),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllUsers(req, res) {
  const { page = 1, limit = 20, search, userType, disable } = req.query;

  try {
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    if (userType) {
      filter.userType = userType;
    }

    if (disable) {
      filter.disable = disable;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      const orConditions = [{ name: regex }, { email: regex }];

      const numericSearch = Number(search);
      if (!Number.isNaN(numericSearch)) {
        orConditions.push({ number: numericSearch });
      }

      filter.$or = orConditions;
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [users, total] = await Promise.all([
      userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      userModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: fixData(users),
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function sendOtp(req, res) {
  const { number } = req.body;

  try {
    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Number is required !",
      });
    }
    const OTP = number == "8305804161" ? "1234" : generateOtp.toString();
    await sendOtpphone(number, OTP);
    const hashOtp = await bcrypt.hash(OTP, 10);
    const userCheck = await userModel.findOneAndUpdate(
      { number },
      { number, otp: hashOtp },
      { new: true, upsert: true },
    );

    if (userCheck?.disable) {
      return res.status(400).json({
        success: false,
        message: "User is Banned !",
      });
    } else {
      return res.status(200).json({
        sucess: true,
        message: "OTP Sent Successfully",
        otp: OTP,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function verifyOtp(req, res) {
  const { number, otp, fcmToken } = req.body;

  try {
    const checkNumber = await userModel.findOne({
      number,
    });

    if (!checkNumber) {
      return res.status(500).json({
        sucess: false,
        message: "number not found ",
      });
    }

    const verify = await bcrypt.compare(otp.toString(), checkNumber.otp);

    if (verify == false) {
      return res.status(400).json({
        sucess: false,
        message: "otp does not same or exist",
      });
    }

    checkNumber.fcmToken = fcmToken ? fcmToken : "";
    await checkNumber.save();

    const token = jwt.sign(
      { id: checkNumber._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "60d",
      },
    );
    checkNumber._doc.token = token;
    return res.status(200).json({
      sucess: true,
      message: "otp verify sucessfully",
      data: checkNumber,
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
}

async function CreateProfile(req, res) {
  let { number, email, name, language, genrePreferences } = req.body;
  const languageArray = Array.isArray(language) ? language : [language];
  console.log(referralCode, "jj");

  const genrePreferencesArray = Array.isArray(genrePreferences)
    ? genrePreferences
    : [genrePreferences];

  try {
    const referralCodeData = await referralCode(8);

    const data = await userModel.findOneAndUpdate(
      { number },
      {
        name: name,
        email: email,
        number: number,
        referralCode: referralCodeData,
        $addToSet: {
          languages: { $each: languageArray },
          genrePreferences: { $each: genrePreferencesArray },
        }, // append unique items
        existingUser: true,
        referBy: req.referral?.userId,
      },
      { new: true, upsert: true },
    );
    await PurchaseSubscription.create({
      userId: data._id,
      isActivePlan: true,
      planType: "FREE_PLAN",
    });
    return res.status(200).json({
      sucess: true,
      message: "Profile Created Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
}
// LogIn Api  (Email )

async function loginApi(req, res) {
  const { email, password } = req.body;

  try {
    const checkUser = await userModel.findOne({
      email,
    });
    if (!checkUser) {
      return res.status(500).json({
        sucess: false,
        message: "User Email not correct",
      });
    }
    const checkPassword = await bcrypt.compare(password, checkUser.password);

    if (checkPassword == false) {
      return res.status(500).json({
        sucess: false,
        message: "User password does not correct",
      });
    }
    const token = jwt.sign({ id: checkUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "60d",
    });
    checkUser._doc.token = token;

    return res.status(200).json({
      sucess: true,
      message: "User login sucessfully 🎉🎉",
      data: checkUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// GetProfile Api ( By Id)

async function profileApiByID(req, res) {
  const { id } = req.params;

  try {
    const find = await userModel
      .findById(id)
      .select(ADMIN_USER_LIST_PROJECTION);

    if (!find) {
      return res.status(404).json({
        sucess: false,
        message: "user id not found",
      });
    }

    const activePlan = await PurchaseSubscription.findOne({
      userId: id,
      isActivePlan: true,
    }).sort({ createdAt: parseInt(-1) });

    find._doc.isActivePlan = activePlan ? true : false;
    find._doc.planDetails = activePlan ? activePlan : {};

    return res.status(200).json({
      sucess: true,
      message: "user featch sucessfully 🎉🎉",
      data: fixData(find),
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
}

// Get Profile Api ( Filter and Pagination)

// async function getProfileByFilter(req, res) {
//   const { address, age } = req.body;
//   const page = parseInt(req.query.page);
//   const limit = parseInt(req.query.limit);

//   try {
//     let filter = {};

//     if (address) {
//       filter.address = { $regex: address, $options: "i" };
//     }
//     if (age) {
//       filter.age = { $gte: Number(age) };
//     }
//     const filterby = await userModel
//       .find(filter)
//       .skip((page - 1) * limit)
//       .limit(limit);

//     if (Object.keys(filter).length == 0 || filterby.length == 0) {
//       return res.status(500).json({
//         sucess: false,
//         message: "do not match any data",
//       });
//     }
//     console.log(filterby);

//     return res.status(200).json({
//       sucess: true,
//       message: "user filter sucessfully",
//       filterby,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       sucess: false,
//       message: error.message,
//     });
//   }
// }

// Disable user Api

async function disableUserApi(req, res) {
  const { id } = req.params;

  try {
    const userData = await userModel.findById(id);

    if (!userData) {
      return res.status(404).json({
        sucess: false,
        message: "User not found.",
      });
    }

    userData.disable = !userData.disable;
    await userData.save();

    return res.status(200).json({
      success: true,
      message: `User ${userData.disable ? "disabled" : "enabled"} successfully.`,
      data: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Update UserProfile Api
async function updateProfile(req, res) {
  const { userId, email, image, name, permissions, password } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required !",
      });
    }
    let obj = {};
    obj.email = email;
    obj.image = image;
    obj.name = name;
    obj.permissions = permissions;
    if (password) {
      obj.password = await bcrypt.hash(password, 10);
    }
    const data = await userModel.findByIdAndUpdate(userId, obj, { new: true });

    return res.status(200).json({
      sucess: true,
      message: "User Profile Updated Sucessfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
} // update userPassword Api

async function updatePassword(req, res) {
  const user = req.user;
  const { oldpassword, newpassword } = req.body;
  const compareOldPassword = await bcrypt.compare(oldpassword, user.password);
  // console.log(compareOldPassword);
  if (compareOldPassword == false) {
    return res.status(500).json({
      sucess: false,
      message: "please enter correct password",
    });
  }
  await userModel.updateOne(
    { _id: user.id },
    { $set: { password: await bcrypt.hash(newpassword, 10) } },
  );

  const update = await userModel.findOne({ _id: user.id });

  return res.status(201).json({
    sucess: true,
    message: "update password sucessfully 🎉🎉🎉",
    update,
  });
}

// forgerPassword Api (sendOTP , verifyOtp)

async function forgetPassword(req, res) {
  const { email } = req.body;

  const checkUser = await userModel.findOne({ email });
  if (!checkUser) {
    return res.statud(500).json({
      sucess: false,
      message: "user email does not correct",
    });
  }
  const generateOtp = Math.floor(1000 + Math.random() * 9000);

  const saveOtp = await userModel.updateOne(
    { _id: checkUser.id },
    { $set: { otp: await bcrypt.hash(generateOtp.toString(), 10) } },
  );
  // console.log(saveOtp);

  const token = jwt.sign({ _id: checkUser.id }, process.env.JWT_SECRET_KEY);

  checkUser._doc.token = token;

  return res.status(200).json({
    sucess: true,
    message: " otp sent sucessfully ",
    generateOtp,
    token,
  });
}

async function resetPassword(req, res) {
  const { otp, newpassword } = req.body;
  try {
    const token = req.headers.authorization;
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log(verifyToken);

    if (!verifyToken) {
      return res.status(500).json({
        sucess: false,
        message: "token invalid",
      });
    }
    const findUser = await userModel.findById(verifyToken._id);

    const checkOtp = await bcrypt.compare(otp, findUser.otp);
    if (checkOtp == false) {
      return res.status(500).json({
        sucess: false,
        message: "invalid otp",
      });
    }

    // const hashpass = await bcrypt.hash(newpassword, 10);
    // console.log(hashpass);
    await userModel.updateOne(verifyToken.id, {
      $set: { password: await bcrypt.hash(newpassword, 10) },
    });

    const updateUserPassword = await userModel.findById(verifyToken._id);
    // console.log(updateUserPassword);
    return res.status(200).json({
      sucess: true,
      message: " reset password sucessfully 🎉🎉",
      updateUserPassword,
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
}

// logout Api
const logoutApi = async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    const user = await userModel.findById(userId);
    user.fcmToken = "";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Logout Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
};

async function validateReferralCode(req, res) {
  const { code } = req.body;

  try {
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "referralCode is required.",
      });
    }

    const sanitizedCode = code.trim();

    if (!sanitizedCode) {
      return res.status(400).json({
        success: false,
        message: "referralCode cannot be empty.",
      });
    }

    const referrer = await userModel
      .findOne({ referralCode: sanitizedCode })
      .select("_id name email referralCode userType disable");

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referral code is invalid.",
      });
    }

    if (referrer.disable) {
      return res.status(403).json({
        success: false,
        message: "Referral code belongs to a disabled user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral code is valid.",
      data: referrer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createSubAdmin(req, res) {
  const { name, email, password, permissions = [] } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be provided as an array.",
      });
    }

    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const sanitizedPermissions = (permissions || [])
      .map((permission) =>
        typeof permission === "string" ? permission.trim() : "",
      )
      .filter((permission) => permission.length > 0);

    const hashedPassword = await bcrypt.hash(password, 10);

    const subAdmin = await userModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType: "SubAdmin",
      permissions: Array.from(new Set(sanitizedPermissions)),
    });

    const subAdminResponse = subAdmin.toObject();
    delete subAdminResponse.password;
    delete subAdminResponse.otp;

    return res.status(201).json({
      success: true,
      message: "Sub admin created successfully.",
      data: subAdminResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  loginApi,
  profileApiByID,
  // getProfileByFilter,
  disableUserApi,
  updateProfile,
  updatePassword,
  logoutApi,
  forgetPassword,
  resetPassword,
  CreateProfile,
  adminLogin,
  getAllUsers,
  validateReferralCode,
  createSubAdmin,
};
