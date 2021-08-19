const { Sequelize } = require("sequelize");

const DBInstance = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		dialect: process.env.DB_DIALECT,
		port: process.env.DB_PORT,
		// operatorsAliases: false,
		logging: false,
	}
);

module.exports = DBInstance;