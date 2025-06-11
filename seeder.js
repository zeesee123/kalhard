require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.CONNECTION_STRING, { dbName: 'calhard' });

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await User.deleteMany({}); // optional: clear old users

  await User.create({
    email: 'admin@site.com',
    password: hashedPassword,
  });

  console.log('✅ Admin seeded: admin@site.com / admin123');
  mongoose.connection.close();
}

seed().catch(console.error);