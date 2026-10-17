require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/db');

const products = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with 30-hour battery life and active noise cancellation.',
    price: 299.99,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches and N-key rollover.',
    price: 149.99,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
    category: 'Electronics',
  },
  {
    name: 'Ultra-Wide 4K Monitor',
    description: '34-inch curved ultra-wide monitor with 144Hz refresh rate and HDR support.',
    price: 799.99,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    category: 'Electronics',
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'Lumbar support, adjustable armrests, and breathable mesh back for all-day comfort.',
    price: 449.99,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400',
    category: 'Furniture',
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof portable speaker with 360° sound and 20-hour playtime.',
    price: 89.99,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    category: 'Electronics',
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Track heart rate, sleep, GPS, and 50+ workout modes with 7-day battery.',
    price: 199.99,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: 'Wearables',
  },
  {
    name: 'Leather Messenger Bag',
    description: 'Handcrafted genuine leather bag with dedicated laptop compartment up to 15 inches.',
    price: 129.99,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    category: 'Accessories',
  },
  {
    name: 'USB-C Docking Station',
    description: '12-in-1 hub with dual 4K HDMI, USB 3.0, SD card, and 100W PD charging.',
    price: 79.99,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    category: 'Electronics',
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Qi-certified 15W fast wireless charger compatible with all Qi-enabled devices.',
    price: 39.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1586953208270-b11038f5c35c?w=400',
    category: 'Electronics',
  },
  {
    name: 'Premium Laptop Stand',
    description: 'Adjustable aluminum stand with cable management for laptops up to 17 inches.',
    price: 59.99,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1593642634524-b40b5baae6bb?w=400',
    category: 'Accessories',
  },
  {
    name: 'Gaming Mouse',
    description: 'High-precision gaming mouse with adjustable DPI, RGB lighting, and programmable buttons.',
    price: 59.99,
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
    category: 'Electronics',
  },
  {
    name: 'Wireless Earbuds',
    description: 'Compact wireless earbuds with clear audio, touch controls, and a portable charging case.',
    price: 79.99,
    stock: 32,
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400',
    category: 'Electronics',
  },
  {
    name: 'Smartphone',
    description: 'Modern smartphone with a vibrant display, high-resolution camera, and all-day battery.',
    price: 699.99,
    stock: 14,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    category: 'Electronics',
  },
  {
    name: 'Tablet',
    description: 'Lightweight tablet for browsing, reading, streaming, and everyday productivity.',
    price: 399.99,
    stock: 11,
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    category: 'Electronics',
  },
  {
    name: 'Laptop Backpack',
    description: 'Durable backpack with padded laptop storage, multiple compartments, and comfortable straps.',
    price: 69.99,
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Accessories',
  },
  {
    name: 'Desk Lamp',
    description: 'Minimal LED desk lamp with adjustable brightness and a flexible neck for focused lighting.',
    price: 34.99,
    stock: 26,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'Furniture',
  },
  {
    name: 'Minimalist Wall Clock',
    description: 'Modern wall clock with a clean design suitable for offices, bedrooms, and living rooms.',
    price: 29.99,
    stock: 19,
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400',
    category: 'Home & Living',
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'Reusable ceramic mug with a comfortable handle for coffee, tea, and other hot drinks.',
    price: 14.99,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    category: 'Home & Living',
  },
  {
    name: 'Insulated Water Bottle',
    description: 'Reusable stainless steel water bottle designed to keep drinks at the desired temperature.',
    price: 24.99,
    stock: 38,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    category: 'Accessories',
  },
  {
    name: 'Travel Suitcase',
    description: 'Hard-shell carry-on suitcase with smooth-rolling wheels and organized interior compartments.',
    price: 119.99,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400',
    category: 'Accessories',
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight athletic shoes with cushioned soles for walking, jogging, and everyday wear.',
    price: 89.99,
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Fashion',
  },
  {
    name: 'Classic Wristwatch',
    description: 'Elegant everyday wristwatch with a minimalist dial and a comfortable adjustable strap.',
    price: 149.99,
    stock: 13,
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
    category: 'Wearables',
  },
  {
    name: 'Polarized Sunglasses',
    description: 'Contemporary sunglasses with polarized lenses and a lightweight frame.',
    price: 44.99,
    stock: 31,
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
    category: 'Fashion',
  },
  {
    name: 'Leather Wallet',
    description: 'Slim everyday wallet with card slots and a dedicated compartment for cash.',
    price: 39.99,
    stock: 27,
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    category: 'Accessories',
  },
  {
    name: 'Scented Candle',
    description: 'Decorative scented candle for creating a relaxing atmosphere at home.',
    price: 19.99,
    stock: 36,
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400',
    category: 'Home & Living',
  },
  {
    name: 'Decorative Indoor Plant',
    description: 'Decorative potted indoor plant that adds a natural touch to desks and living spaces.',
    price: 22.99,
    stock: 17,
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    category: 'Home & Living',
  },
  {
    name: 'Yoga Mat',
    description: 'Comfortable exercise mat with a textured surface for yoga, stretching, and home workouts.',
    price: 32.99,
    stock: 21,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    category: 'Fitness',
  },
  {
    name: 'Adjustable Dumbbell',
    description: 'Space-saving strength-training equipment for home fitness routines.',
    price: 89.99,
    stock: 9,
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400',
    category: 'Fitness',
  },
  {
    name: 'Bluetooth Turntable',
    description: 'Stylish record player for enjoying vinyl records with a classic listening experience.',
    price: 179.99,
    stock: 7,
    imageUrl: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400',
    category: 'Electronics',
  },
  {
    name: 'Portable Power Bank',
    description: 'Compact portable battery for charging compatible phones and other USB devices on the go.',
    price: 49.99,
    stock: 33,
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    category: 'Electronics',
  },
];

const seedProducts = async () => {
  await connectDB();

  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  Products already exist (${count} found). Skipping seed.`);
      return;
    }

    await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${products.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedProducts();
