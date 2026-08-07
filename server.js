const { notFound, errors } = require("./middlewares/errors");
const { MAX_UPLOAD_BYTES } = require("./config/uploads");
const generateAdmin = require("./config/generateAdmin");
const connectDatabase = require("./config/database");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
var cors = require("cors");
const {
	startMetricsServer,
	apiResponseTimeHistogram,
} = require("./metrics/metrics");
const responseTime = require("response-time");

// Handle Uncaught exceptions
process.on("uncaughtException", (err) => {
	console.log(`ERROR: ${err.message}`);
	console.log("Shutting down due to Uncaught Exception");
	process.exit(1);
});

// Config Env Path
dotenv.config({ path: "config/.env" });

// Connect database
connectDatabase();

// Generate Admin account
generateAdmin();

// Create App
const app = express();

// Middleware
// const corsOptions = {
// 	origin: '*',
// 	allowedHeaders: ['Authorization', 'Content-Type']
// };

// app.use(cors(corsOptions));
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
});
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	responseTime((req, res, time) => {
		console.log("TIME IS:", time);
		if (req?.route?.path) {
			apiResponseTimeHistogram.observe(
				{
					method: req.method,
					route: req.route.path,
					status_code: res.statusCode,
				},
				time / 1000
			);
		}
	})
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
	fileUpload({
		createParentPath: true,
		limits: { fileSize: MAX_UPLOAD_BYTES },
	})
);

// Routes
readdirSync("routes").map((route) => {
	app.use("/api", require(`./routes/${route}`));
});

// Middleware
app.use(notFound);
app.use(errors);

// Start server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
	console.log(
		`Server started on port ${port} in ${process.env.NODE_ENV} mode.`
	);
});
startMetricsServer();
// Handle Unhandled Promise rejection.
process.on("unhandledRejection", (err) => {
	console.log(`ERROR: ${err.message}`);
	console.log("Shutting down the server due to Unhandled Promise rejection");
	server.close(() => {
		process.exit(1);
	});
});
