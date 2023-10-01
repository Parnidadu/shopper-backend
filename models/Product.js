const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  tags: [String],
  availableStock: Number,
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
