const userModel = require("../models/userModels")

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

    existingUser = await userModel.findOne({ referralCode: code }); // check karna hai --nahi hame yaha true or false bhejege
  } while (existingUser);

  return code;
};



module.exports = {referralCode};