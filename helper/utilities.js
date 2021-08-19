const jwt = require("jsonwebtoken");

const getAuth = (data) => {
	try {
		return jwt.sign(data, process.env.JWT_ENCRYPTION, {
			expiresIn: Date.now() + 30 * 24 * 60 * 60 * 1000,
		});
	} catch (error) {
		console.log(error);
	}
};

const setLogin = async (res, jwtData) => {
	const jwt = await getAuth(jwtData);
	if (jwt) {
		res.cookie("SessionAuth", `${jwt}`, {
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			httpOnly: true,
		});
	}
};

const canFormatRoutes = [
    /^(\/)$/,
    /^(\/bookings)$/,
    /^(\/setting)$/,
    /^(\/users)$/,
];

const formatUrl = (reqUrl, newDst = null) => {
	let format = ``;
	const permit = canFormatRoutes.filter(e => e.test(reqUrl.split(/\?/)[0]));
	if (permit.length > 0) {
		if (!(/\?/.test(reqUrl))) {
			format = newDst ? `?dst=${newDst}` : '';
		} else {
			format = `?${reqUrl.split(/\?/)[1]}`;
			if (/dst\=[^&#]+/.test(format) && newDst) {
				format = format.replace(/dst\=[^&#]+/, `dst=${newDst}`);
			} else {
				format = newDst ? `${format}&dst=${newDst}` : format;
			}
		}
	}
	return encodeURI(format);
};

const valAuth = async (req, res, next) => {
	const { SessionAuth = null } = req.cookies;
	jwt.verify(SessionAuth, process.env.JWT_ENCRYPTION, async (err, data) => {
		if (err) {
			// console.log(err);
			let formattedUrl = formatUrl(req.originalUrl, req.originalUrl.split(/\?/)[0]);
			return logout(req, res, `/login${formattedUrl}`);
		}
		res.locals.user = data.user;
		next();
	});
};

const valAuthOptional = async (req, res, next) => {
	const { SessionAuth = null } = req.cookies;
	res.locals.user = null;
	if (SessionAuth) {
		jwt.verify(SessionAuth, process.env.JWT_ENCRYPTION, async (err, data) => {
			if (!err && data) {
				res.locals.user = data.user;
			}
			next();
		});
	} else {
		next();
	}
};

const valLoginActive = async (req, res, next, redirect = '/bookings') => {
	const { SessionAuth = null } = req.cookies;
	return SessionAuth ? rdr(req, res, redirect) : next();
}

const logout = (req, res, format = null) => {
    const formattedUrl = format ? format : `/login${formatUrl(req.originalUrl)}`;
	res.cookie("SessionAuth", false, { maxAge: new Date(0) });
	rdr(req, res, `${formattedUrl}`);
};

const rdr = (req, res, url) => {
	req.headers["x-requested-with"] === "XMLHttpRequest" ? res.json({force: url}) : res.redirect(url);
}

/**
 * function to calc date difference in hours
 * @param {String} date1
 * @param {String|null} date2
 */
const dateDiff = async (date1, date2 = null) => {
	let oldDate = new Date(date1).getTime();
	let currentDate = date2 ? new Date(date2).getTime() : new Date().getTime();
	let diff = (currentDate - oldDate) / 1000;
	diff = diff / 60;
	diff = diff / 60;
	return Math.abs(Math.round(diff));
};

/**
 * function to handle json response
 * @param {Object} param0
 * @returns {Object}
 */
const jsonRes = ({
	error = false,
	errorMsg = null,
	data = null,
	force = null,
}) => {
	return {
		error,
		errorMsg,
		data,
		force,
	};
};

const errHandler = (error, initStmt) => {
	let errMsg = initStmt;
	if (error.message) {
		errMsg = error.message;
	}
	if (error.errors) {
		let err = error.errors[0];
		errMsg = err.message;
		if (err.type === 'unique violation') {
			errMsg = `${err.path} '${err.value}' already exists.`;
		}
	}
	return errMsg;
}

const validateData = (data, regex) => {
	let dataIsArray = Array.isArray(data);
	let newData = [];
	data = dataIsArray ? data : [data];
	data.forEach((element) => {
		if (regex.test(element)) {
			newData.push(element);
		}
	});
	return dataIsArray
		? newData.length > 0
			? newData
			: false
		: newData.length > 0
		? newData[0]
		: false;
}

const getHours = (from_date, to_date, force = null) => {
	from_date = new Date(from_date).getTime();
	to_date = new Date(to_date).getTime();
	let hours = Math.floor(Math.abs(from_date - to_date) / 36e5);
	if (force) {
		let remainder = hours % force;
		if (remainder > 0) {
			hours += (force - remainder);
		}
	}
	return hours;
}

const calcCost = (from_date, to_date, cost, timing = 24) => {
	let hours = getHours(from_date, to_date, timing);
	return (hours/timing) * cost;
}

module.exports = {
	setLogin,
	valAuth,
	logout,
	dateDiff,
	jsonRes,
	formatUrl,
	rdr,
	valLoginActive,
	errHandler,
	validateData,
	valAuthOptional,
	getHours,
	calcCost,
};
