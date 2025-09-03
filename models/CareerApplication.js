const mongoose = require("mongoose");

const CareerApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  experience: { type: String, required: true }, // e.g. "0-1 years"
  currentCTC: { type: String },
  expectedCTC: { type: String },
  noticePeriod: { type: String },
  currentLocation: { type: String },
  designation: { type: String },
  details: { type: String }, // job responsibilities, portfolio, etc.
  resumePath: { type: String }, // saved file path
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CareerApplication", CareerApplicationSchema);
