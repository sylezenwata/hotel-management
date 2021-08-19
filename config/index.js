const path = require("path");
const express = require("express");
const DBInstance = require("../DB/db_connection");

// middlewares
// const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
// const cors = require("cors");

// utils
const { jsonRes } = require("../helper/utilities");

/**
 * app config
 * @param {*} app
 */
module.exports.appConfig = (app) => {
	// view
	app.set("view engine", "ejs");
	//compression
	const compress = (req, res) => {
		if (req.headers["x-no-compression"]) return false;
		return compression.filter(req, res);
	};
	// disable express
	app.disable("x-powered-by");
	// middleware exec
	// app.use(cors());
	// app.use(helmet());
	app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(compression({filter: compress, threshold: 0}));
    // static files
	app.use(express.static(path.join(__dirname, '..', "public"), {maxAge: '31536000', etag: false}));
	// cors handler
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Credentials", true);
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept, X-No-Compression");
		if (req.method === "OPTIONS") {
			res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
			return res
				.status(200)
				.json({
					message: "Allowed request methods are 'POST, GET, PUT, DELETE'.",
				});
		}
		next();
	});
};

/**
 * function to handle any other error
 * @param {*} app
 */
module.exports.errorHandler = (app) => {
	app.use((req, res, next) => {
		const err = new Error("Link has been replaced or does not exit.");
		err.status = 404;
		next(err);
	});
	app.use(
		(error, req, res, next) => {
			res.status(error.status || 500).json(jsonRes({error: true, errorMsg: error.message}));
		}
	);
};

/**
 * database config
 * @param {*} app
 */
module.exports.dbConnection = (app) => {
	DBInstance.authenticate()
		.then(() => {
			console.log("Database connected.");
			// listen to port
			app.listen(process.env.PORT, () =>
				console.log("Server running on port " + process.env.PORT)
			);
		})
		.catch((err) => console.log("Database error: " + err));
};
