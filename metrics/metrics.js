const express = require("express");
const client = require("prom-client");
var cors = require("cors");

const app = express();
app.use(cors());
const apiResponseTimeHistogram = new client.Histogram({
	name: "rest_response_time_duration_seconds",
	help: "REST API RESPONSE TIME IN SECONDS",
	labelNames: ["method", "route", "status_code"],
});
const databaseResponseTimeHistogram = new client.Histogram({
	name: "db_response_time_duration_seconds",
	help: "DATABASE RESPONSE TIME IN SECONDS",
	labelNames: ["operation", "success"],
});

function startMetricsServer() {
	const collectDefaultMetrics = client.collectDefaultMetrics;
	collectDefaultMetrics();
	app.get("/metrics", async (req, res) => {
		res.set("Content-Type", client.register.contentType);
		return res.send(await client.register.metrics());
	});
	app.listen(9102, () => {
		console.log("Metrics Server Started");
	});
}

module.exports = {
	startMetricsServer,
	apiResponseTimeHistogram,
	databaseResponseTimeHistogram,
};
