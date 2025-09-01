// models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },      // unique filename on server
  originalName: { type: String, required: true },  // original uploaded name
  folder: { type: String, required: true },        // images, pdfs, docs, others
  path: { type: String, required: true },          // full local path
  url: { type: String, required: true },           // public URL for frontend
  mimetype: { type: String, required: true },      // file MIME type
  size: { type: Number, required: true },          // file size in bytes
  type: { type: String, required: true },          // image, pdf, doc, etc.
}, { timestamps: true });                           // automatically adds createdAt & updatedAt

module.exports = mongoose.models.Media || mongoose.model('Media', mediaSchema);
