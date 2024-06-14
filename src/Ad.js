const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: String,
  price: String,
  dateLocation: String,
  url: { type: String, unique: true }
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
