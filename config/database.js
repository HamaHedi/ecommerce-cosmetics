const mongoose = require("mongoose");

const connectDatabase = async () => {
	console.log(`MONGO URI:${process.env.MONGO_URI}`);
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(
			`MongoDB Database Connected with Host: ${conn.connection.host}`
		);
	} catch (error) {
		console.log("ERROR:", error);
		console.log("Connection Error => ", error.message);
		process.exit(1);
	}
};

module.exports = connectDatabase;
