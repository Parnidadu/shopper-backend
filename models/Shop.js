const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: String,
  bio: String,
  address: String,
  latitude: Number,
  longitude: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
