import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:ITPMproject%40..2026@cluster0.8o9mmpy.mongodb.net/sshcs?retryWrites=true&w=majority&appName=Cluster0');

    console.log(`✅ MongoDB Connected successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    console.log('   Make sure MongoDB is running and MONGODB_URI is correct');
    process.exit(1);
  }
};

export default connectDB;
