require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.CONNECTION_STRING, { dbName: process.env.DB_NAME });

  // optional: clear old users
  // await User.deleteMany({});

  const hashedPassword = await bcrypt.hash('Calsoft_M@6050', 12);

  await User.create({
    email: 'swanand.shinge@calsoftinc.com',
    password: hashedPassword,
    twoFactorEnabled: false,  // not enabled yet
    twoFactorSecret: null
  });

  console.log('✅ User seeded: user@example.com / user123');
  mongoose.connection.close();
}

seed().catch(console.error);
