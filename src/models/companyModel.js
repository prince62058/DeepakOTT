// CJS version (require/module.exports)
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String },
    icon: { type: String },
    favIcon: { type: String },
    loader: { type: String },
    privacyPolicy: { type: String },
    termsCondition: { type: String },
    aboutUs: { type: String },
    homeBanner: [{ type: String }],
    gst: { type: String },
    phoneNumber: { type: Number },
    email: { type: String },
    address: { type: String },
    xUrl: { type: String },
    instaUrl: { type: String },
    facebookUrl: { type: String },
    linkedineUrl: { type: String },
    referralEarning: { type: Number, default: 0 },
    totalWatchFreeTime:{ type:Number, default:10} // in minutes
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

const createDefaultCompany = async () => {
  const companyData = {
    name: "Deepak OTT",
    icon: "default-icon.png",
    favIcon: "default-favicon.png",
    loader: "default-loader.gif",
    privacyPolicy: `
    Last Updated: [Date]

    This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform to scan bulbs, earn rewards, and participate in prize programs.

    1. User Roles:
    Our platform has two types of users:
    - User: Individuals who scan bulbs for rewards.
    - Shop Owner: Business owners who register and scan bulbs on behalf of customers.

    2. Data We Collect:
    We may collect the following data:
    - Name, phone number, email (for registration).
    - Location (for prize distribution and analytics).
    - Bulb scan history (to track rewards and validate claims).
    - Device info (for app performance & security).

    3. Users and Listeners:
    - Users and Shop Owners can scan bulbs using the app.
    - Each scan may generate coins or rewards based on system rules.
    - Admin has the right to assign prizes to Users and Shop Owners.
    - Shop Owners receive coins for every valid scan done when assigned by Admin.
  `,
    termsCondition: `
    1. Eligibility You must be 13 years or older (or as per your country’s law) to use this service. By registering, you confirm that the information you provide is accurate. 
    2. Account & Security You are responsible for maintaining the confidentiality of your account details. Any unauthorized activity under your account is your responsibility, so keep your login safe. We may suspend or terminate accounts for violation of these terms. 
    3. Subscription & Payments Plans include Free, Monthly, Yearly, Watch & Earn, and Pay Per Movie. Payment must be completed through supported methods (UPI, Credit/Debit Cards, Wallets). Auto-renewals will occur unless you cancel your plan before the renewal date. No refunds are issued once a plan is activated, except as per our Refund Policy. 
    4. Content Usage All movies, shows, and content are licensed to [Your App Name]. Content is for personal, non-commercial use only. Downloaded/offline content is temporary and subject to restrictions. Sharing, recording, or redistributing content is strictly prohibited. 
    5. Referral & Rewards Referral rewards are given only when invited users sign up and purchase a paid plan. Misuse of referral codes (fake accounts, spam invites) may result in account suspension. 
    6. Watch & Earn Program Users under this plan may receive rewards (cashback, credits, coupons). Rewards are subject to rules set by the admin and may change anytime. Fraudulent activity will result in cancellation of rewards and account ban. 
    7. User Conduct You agree not to: Use the app for illegal purposes. Attempt to hack, copy, or distribute app content. Upload harmful material (viruses, offensive content). 
    8. Termination We reserve the right to suspend or terminate your account if you violate these terms. Outstanding balances (if any) remain payable even after termination. 
    9. Liability Disclaimer We do not guarantee uninterrupted service (e.g., downtime, API errors). Content availability depends on licensing agreements and may change without notice. 
    10. Changes to Terms We may update these Terms at any time. Continued use of the app after updates means you accept the new terms. 
    11. Governing Law These Terms are governed by the laws of [Your Country]. Any disputes shall be handled by courts in [Your City/State]. 
    12. Contact Us For questions or support: 📧 Email: support@[yourapp].com 📞 Helpline: +91-XXXXXXXXXX
    `,
    aboutUs: `
🖋 About Us  
Syncbel ek innovative platform hai jo smart bulb tracking aur reward system ke zariye lighting industry mein ek nayi roshni laa raha hai. Humne is app ko isliye design kiya hai taaki users aur shop owners dono bulbs ke QR ya barcodes scan karke coins kama sakein, rewards jeet sakein, aur defective products ko aasaani se replace kar sakein.

 Our Mission  
Hamara mission hai ki:  
- Product authenticity ko ensure karein,  
- Bulb replacement process ko easy banayein,  
- Har stakeholder ko scan karne ke liye reward dekar inspire karein.  

👥 Who Can Use This App?  
- Users: Apne ghar ke bulbs scan karke rewards aur prize jeet sakte hain.  
- Shop Owners: Har bulb scan par coins kamaate hain, jise future mein reward points mein convert kiya ja sakta hai.  

🎁 Rewards & Replacements  
- Har scan par aapko milte hain reward coins.  
- Kabhi kabhi Admin aapko assign karta hai special prizes.  
- Agar koi bulb defective nikle, toh uska replacement process fast aur simple hai.
`,
    homeBanner: [
      "https://leadkart.in-maa-1.linodeobjects.com/ATTACH_IMAGE/IMAGE/1755514376382_header.png",
      "https://leadkart.in-maa-1.linodeobjects.com/ATTACH_IMAGE/IMAGE/1755514376382_header.png",
    ],
    gst: "22ABCDE1234F1Z5",
    phoneNumber: 7808426662,
    email: "default@example.com",
    address: "123 Default Lane, City, Country",
    xUrl: "https://x.com/default",
    instaUrl: "https://instagram.com/default",
    facebookUrl: "https://facebook.com/default",
    linkedineUrl: "https://linkedin.com/company/default",
    referralEarning: 100,
  };

  const existingCompany = await Company.findOne();

  if (!existingCompany) {
    await Company.create(companyData);
    console.log("Default Company created successfully");
  } else {
    console.log("Default company already exists");
  }
};

module.exports = { Company, createDefaultCompany };
