require("dotenv").config();
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// AWS S3 Client Setup (v3)
const s3Client = new S3Client({
  region: "sgp1",
  endpoint: "https://sgp1.digitaloceanspaces.com",
  forcePathStyle: false, // DigitalOcean Spaces supports virtual-hosted style
  credentials: {
    accessKeyId: process.env.LINODE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_SECRET_KEY,
  },
});

// Multer Storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: "satyakabir-bucket",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      let folderPath = "";

      if (file.mimetype.startsWith("image")) folderPath = "OTT/IMAGE/";
      else if (file.mimetype.startsWith("video")) folderPath = "OTT/VIDEO/";
      else if (file.mimetype.startsWith("application/pdf"))
        folderPath = "OTT/PDF/";
      else folderPath = "OTT/OTHERS/";

      const key = `${folderPath}${Date.now()}_${file.originalname}`;
      cb(null, key);
    },
  }),
});

// Delete function
async function deleteFileFromObjectStorage(url) {
  try {
    const urlObject = new URL(url);
    const key = urlObject.pathname.substring(1);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: "satyakabir-bucket",
        Key: key,
      }),
    );

    console.log(`File deleted successfully: ${key}`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
}

module.exports = { s3Client, upload, deleteFileFromObjectStorage };
