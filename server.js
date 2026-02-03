const dotenv = require("dotenv");
dotenv.config();
const app = require("./src/app");
const connectToDB = require("./src/db/db");

const PORT = process.env.PORT || 4555;

connectToDB();
app.listen(PORT, () => {
  console.log(`
################################################
🚀 Server listening on port: ${PORT}
🔗 Link: http://localhost:${PORT}
################################################
  `);
});
