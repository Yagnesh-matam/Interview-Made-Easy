const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Points directly to the local database process on your machine
        const localURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interviewPrep";
        
        console.log("Bypassing internet network blocks...");
        console.log("Attempting connection to Local MongoDB Instance...");
        
        const conn = await mongoose.connect(localURI);
        console.log(`Connected successfully to Local Database! Host: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Local Connection Error: ${error.message}`);
        console.log("\n💡 Tip: If you don't have MongoDB installed locally yet, just download the free 'MongoDB Community Server' for Windows, run the installer, and restart this terminal.");
        process.exit(1); 
    }
};

module.exports = connectDB;