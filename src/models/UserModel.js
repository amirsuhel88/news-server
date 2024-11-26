import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "user name is required"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    lowecase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "password is required"],
    minlength: [5, "password must be at least 5 characters"],
  },
});

const User = mongoose.model("User", userSchema);
export default User;
