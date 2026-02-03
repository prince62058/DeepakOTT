require("dotenv").config();
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// AWS S3 Client Setup (v3)
const s3Client = new S3Client({
  region: "in-maa-1",
  endpoint: "https://in-maa-1.linodeobjects.com",
  forcePathStyle: true,
  credentials: {
   accessKeyId: 'ONX5GHG5U5421621M63F' , 
   secretAccessKey: "PRIwOYk72vYugYNfbqTI3pZkU36zNY0rEtxcIuzn",
  },
});

// Multer Storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: "leadkart",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      let folderPath = "";

      if (file.mimetype.startsWith("image")) folderPath = "OTT/IMAGE/";
      else if (file.mimetype.startsWith("video")) folderPath = "OTT/VIDEO/";
      else if (file.mimetype.startsWith("application/pdf")) folderPath = "OTT/PDF/";
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
        Bucket: "leadkart",
        Key: key,
      })
    );

    console.log(`File deleted successfully: ${key}`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
}


module.exports = { s3Client, upload, deleteFileFromObjectStorage };
