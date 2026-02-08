const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  try {
    await migrateURLs();
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
});

// Old and new bucket configurations
const OLD_LINODE_PATTERNS = [
  "in-maa-1.linodeobjects.com/leadkart",
  "leadkart.in-maa-1.linodeobjects.com",
  "in-maa-1.linodeobjects.com",
];

const NEW_DIGITALOCEAN_BUCKET = "satyakabir-bucket.sgp1.digitaloceanspaces.com";

/**
 * Fix a single URL by replacing old Linode patterns with new DigitalOcean URL
 */
function migrateURL(url) {
  if (!url || typeof url !== "string") return url;

  let fixedUrl = url;

  // Handle all old Linode patterns
  for (const pattern of OLD_LINODE_PATTERNS) {
    if (fixedUrl.includes(pattern)) {
      // Extract the file path after the bucket name
      const regex = new RegExp(
        `https?://${pattern.replace(/\./g, "\\.")}/(.*)`,
        "i",
      );
      const match = fixedUrl.match(regex);

      if (match && match[1]) {
        // Reconstruct with new DigitalOcean bucket
        fixedUrl = `https://${NEW_DIGITALOCEAN_BUCKET}/${match[1]}`;
        console.log(`  📝 Migrated: ${url.substring(0, 60)}...`);
        console.log(`     ➜ ${fixedUrl.substring(0, 60)}...`);
        return fixedUrl;
      }
    }
  }

  return fixedUrl;
}

/**
 * Recursively migrate URLs in an object
 */
function migrateObjectURLs(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const newObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (
      typeof value === "string" &&
      (value.includes("linodeobjects") || value.includes("leadkart"))
    ) {
      newObj[key] = migrateURL(value);
    } else if (typeof value === "object" && value !== null) {
      newObj[key] = migrateObjectURLs(value);
    } else {
      newObj[key] = value;
    }
  }

  return newObj;
}

/**
 * Main migration function
 */
async function migrateURLs() {
  console.log("\n🔄 Starting URL migration from Linode to DigitalOcean...\n");

  // Get all collections
  const collections = await mongoose.connection.db.listCollections().toArray();

  let totalUpdated = 0;

  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    console.log(`\n📂 Processing collection: ${collectionName}`);

    const collection = mongoose.connection.db.collection(collectionName);
    const documents = await collection.find({}).toArray();

    if (documents.length === 0) {
      console.log(`  ℹ️  No documents found`);
      continue;
    }

    let updatedInCollection = 0;

    for (const doc of documents) {
      const originalDoc = JSON.stringify(doc);
      const migratedDoc = migrateObjectURLs(doc);
      const migratedDocStr = JSON.stringify(migratedDoc);

      // Check if anything changed
      if (originalDoc !== migratedDocStr) {
        // Remove _id from the update to avoid immutable field error
        const { _id, ...updateFields } = migratedDoc;

        await collection.updateOne({ _id: doc._id }, { $set: updateFields });
        updatedInCollection++;
      }
    }

    if (updatedInCollection > 0) {
      console.log(`  ✅ Updated ${updatedInCollection} document(s)`);
      totalUpdated += updatedInCollection;
    } else {
      console.log(`  ℹ️  No URLs to migrate`);
    }
  }

  console.log(
    `\n📊 Summary: Updated ${totalUpdated} document(s) across all collections`,
  );
}
