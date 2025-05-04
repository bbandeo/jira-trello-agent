// check-mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

const checkMongoDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jira-trello-agent';
  
  console.log(`Connecting to MongoDB at: ${dbUri}`);
  
  try {
    await mongoose.connect(dbUri);
    console.log('✅ MongoDB connected successfully');
    
    // Check collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\nDatabase collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
};

checkMongoDB();