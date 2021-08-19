/**
 * @author Sylvester Ezenwata [twitter: @sylezenwata]
 * Copyright 2021
 * ==> This project was distributed for only the purpose of research. <==
 * Details on LIcense can be found in the LICENSE file
 */
require("dotenv").config();
const express = require("express");
const app = express();
const {appConfig, errorHandler, dbConnection} = require("./config");
const clientRoutes = require("./routes/client");

/**
 * @description Main app configuration usage and 
 * midlleware setting.
 */
appConfig(app);
/**
 * Routes
 */
app.use(clientRoutes);
/**
 * error handler
 */
errorHandler(app);
/**
 * connection
 * DB & Port
 */
dbConnection(app);
