import mongoose from 'mongoose';
  
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('MongoDB connection string is missing in environment variables (MONGO_URI)');
    process.exit(1);
    }

    
    let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(mongoURI);
      console.log('✅ MongoDB connection established successfully');
      break; // Exit loop on successful connection
      } catch (error) {
      console.error(`❌ MongoDB connection failed. Retries left: ${retries - 1}`);
      console.error(`Error: ${error.message}`);
      retries -= 1;

      if (retries === 0) {
        console.error('MongoDB connection failed after multiple attempts. Exiting process.');
        process.exit(1);
        }

      // Wait before retrying (e.g., 5 seconds)
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  // Optional: Handle mongoose connection events more granularly
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });
  
  // Optional: Graceful shutdown on app termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
    });
    };
    
    export default connectDB;
    
    