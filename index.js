import connectToDB from "./dbConnect.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000; // Default port if not in .env

connectToDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!!", err);
    process.exit(1);
  });
