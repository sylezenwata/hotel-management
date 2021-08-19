const SET = require("./set");

/**
 * function to val device type and add 'not-mobile' class
 * to html tag if it's not 'desktop'
 */
export function valDeviceType() {
	SET.deviceType() === "desktop" &&
		SET.fixClass(["html"], [["not-mobile"]], [[true]]);
}
/**
 * function to handle scroll effect on nav bar
 */
export function navBarEffect() {
	// let clientHeight = document.body.getBoundingClientRect().height;
	window.on("scroll", () => {
		if (window.pageYOffset > 0) {
			SET.fixClass(["#navBar"], [["scrolled"]], [true]);
		} else {
			SET.fixClass(["#navBar"], [["scrolled"]], [false]);
		}
		// if (window.pageYOffset > 70) {
		// 	if (document.body.getBoundingClientRect().height + window.pageYOffset < clientHeight) {
		// 		SET.fixClass(["#navBar","#navBar"], [["nav-on-s"],["nav-off-s"]], [!0, !1]);
		// 	} else {
		// 		SET.fixClass(["#navBar","#navBar"], [["nav-off-s"], ["nav-on-s"]], [!0, !1]);
		// 	}
		// } else {
		// 	SET.fixClass(["#navBar"], [["nav-on-s","nav-off-s"]], [!1]);
		// }
		// clientHeight = document.body.getBoundingClientRect().height + window.pageYOffset;
	});
}
/**
 * function to create notifications to be prepended in elements
 * @param {object} data
 * @param {string} type
 * @return {*}
 */
export function createInnerNoti(data, type = "error") {
	let { title = null, message = null } = data;
	title = title ? title + ":&nbsp;" : "";
	message = message ? message : "";
	return `<div class="inner-notification m-b-10"><div class="inner-notification__content ${type}"><p><b>${title}</b>${message}</p></div></div>`;
}
/**
 * function to handle ajax request response
 * @param {String|Node} form Form selector
 * @param {Object} res Ajax request response
 * @param {Object} err Ajax request error for failed call
 * @param {Function} optionalCallBack
 * @returns {*}
 */
export function ajaxHandler(form, res, err, optionalCallBack = null) {
	form = SET.$(form);
	// validate request error
	if (err)
		return form.getElem(".form-body").prependElem(
			createInnerNoti({
				title: err.code,
				message: err.msg,
			})
		);
	// destructure response
	const { error, errorMsg, data, force } = res;
	if (force) return redirectFunc(force);
	if (error)
		return form.getElem(".form-body").prependElem(
			createInnerNoti({
				message: errorMsg,
			})
		);
	if (data) {
		if ("object" === typeof data) {
			let { msg, redirect } = data;
			form
				.getElem(".form-body")
				.prependElem(createInnerNoti({ message: msg }, "success"));
			redirectFunc(redirect);
		} else {
			form
				.getElem(".form-body")
				.prependElem(createInnerNoti({ message: data }, "success"));
		}
		// clear form pass through optionalCallBack
		optionalCallBack && optionalCallBack();
	} else {
		form.getElem(".form-body").prependElem(
			createInnerNoti({
				message: "An error occurred processing request.",
			})
		);
	}
}
/**
 * function run a function on window event
 * @param {String} event
 * @param {Function} func
 */
export function winClick(event, func, off = false) {
	if (off) {
		return window.off(event, func);
	}
	window.on(event, func, { once: true });
}
/**
 * function to validate data
 * @param {*|Array} data Data to validate
 * @param {Regex} regex
 * @returns {*|Array|Boolean}
 */
export function validateData(data, regex) {
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
/**
 * function to read file
 * @param {*} file 
 * @param {Function} callBack callback function to run after reading file, it accepts reader as a parameter
 */
export function fileReader(file, callBack) {
	let reader = new FileReader();
	reader.onloadend = () => {
		callBack(reader);
	};
	reader.readAsDataURL(file);
}
/**
 * function to stop event propagation
 * @param {Object} e
 */
export function eventPropagator(e) {
	e.stopPropagation();
}
/**
 * function to handle drop down view
 * @param {Object} e
 * @returns {*}
 */
export function dropDownView(e, drpDwn) {
	if (!drpDwn) {
		drpDwn = SET.$('.drop-down[aria-hidden="false"]');
		drpDwn.off("click", eventPropagator);
		winClick("click", dropDownView, true);
		drpDwn.attr("aria-hidden", "true");
		return;
	}
	drpDwn.attr("aria-hidden", `${!JSON.parse(drpDwn.attr("aria-hidden"))}`);
	drpDwn.on("click", eventPropagator);
	winClick("click", dropDownView);
}

/**
 * function to perform selection copy
 * @param {String} selector
 * @param {String|null} successInfo
 */
export function copier(selector, successInfo = null) {
	let elementToCopy = SET.$(selector);
	window.getSelection().removeAllRanges();
	elementToCopy.select();
	elementToCopy.setSelectionRange(0, 99999);
	try {
		const copy = document.execCommand("copy");
		if (copy && successInfo) {
			notifier(successInfo);
		}
	} catch (err) {
		notifier("Operation failed, try copying directly.","error");
		elementToCopy.attr("readonly", false);
	}
	window.getSelection().removeAllRanges();
}

/**
 * function to handle dynamic notification
 * @param {String|null} info 
 * @param {String|null} type 
 * @param {Number|null} timeOut 
 * @param {String|Number|null} uniqueId 
 * @param {Function|null} timeOutCallBack 
 * @returns 
 */
export function notifier(info, type = 'default', timeOut = 10, uniqueId = null, timeOutCallBack = null) {
	// function to remove notification
	function removeNotification(ref) {
		SET.removeElem(SET.$(`body .content .notification-wrap .notification[data-ref="${ref}"`).getParent('notification-wrap'));
	}
	// this will be used to remove an untimed function
	if (!info) {
		return removeNotification(uniqueId);
	}
	// remove old notification before a new one
	if (SET.$('body .content .notification-wrap')) {
		removeNotification(SET.$(`body .content .notification-wrap .notification`).attr('data-ref'));
	}
	// set unique identity for each displayed notification
	let ref = uniqueId ? uniqueId : `${Math.floor(Math.random() * 10e11)}1`;
	SET.$('body .content').appendElem(`
		<div class="notification-wrap">
			<div class="notification" data-ref="${ref}">
				<div class="notification-content ${type}">
					<p class="main-content">${info}</p>
					${timeOut ? (timeOutCallBack ? '<span class="close">&#8635;</span>' : '<span class="close">&times;</span>' ) : ''}
				</div>
			</div>
		</div>
	`);
	// time notification
	let timeFunction = null;
	if (timeOut) {
		timeFunction = setTimeout(() => {
			removeNotification(ref);
			timeOutCallBack && timeOutCallBack();
		}, timeOut * 1000);
		// activate close click event
		SET.$(`.notification[data-ref="${ref}"] span.close`).on('click', () => {
			removeNotification(ref);
			timeOutCallBack && timeOutCallBack();
			timeFunction && clearTimeout(timeFunction);
		});
	}
}
// export function notifier(info, type = 'default', timeOut = 10, uniqueId = null, timeOutCallBack) {
// 	function removeNotification(reference) {
// 		if (SET.$("body .content .notification-wrap .notification", true).length > 1) {
// 			return SET.removeElem(`.notification[data-ref="${reference}"`)
// 		}
// 		SET.removeElem('body .content .notification-wrap');
// 	}
// 	// this will be used to remove an untimed function
// 	if (!info) {
// 		return removeNotification(uniqueId);
// 	}
// 	let ref = uniqueId ? uniqueId : `${Math.floor(Math.random() * 10e11)}1`;
// 	if (SET.$("body .content .notification-wrap")) {
// 		ref = uniqueId ? uniqueId : `${Math.floor(Math.random() * 10e11)}${SET.$('.notification-wrap .notification', true).length + 1}`;
// 		SET.$('.notification-wrap').appendElem(`
// 			<div class="notification" data-ref="${ref}">
// 				<div class="notification-content ${type}">
// 					<p class="main-content">${info}</p>
// 					${timeOut ? '<span class="close">&times;</span>' : ''}
// 				</div>
// 			</div>
// 		`);
// 	} else {
// 		SET.$('body .content').appendElem(`
// 			<div class="notification-wrap">
// 				<div class="notification" data-ref="${ref}">
// 					<div class="notification-content ${type}">
// 						<p class="main-content">${info}</p>
// 						${timeOut ? '<span class="close">&times;</span>' : ''}
// 					</div>
// 				</div>
// 			</div>
// 		`);
// 	}
// 	let timeFunction = null;
// 	if (timeOut) {
// 		// time notification
// 		timeFunction = setTimeout(() => {
// 			removeNotification(ref);
// 			timeOutCallBack && timeOutCallBack();
// 		}, timeOut * 1000);
// 		// activate close click event
// 		SET.$(`.notification[data-ref="${ref}"] span.close`).on('click', () => {
// 			removeNotification(ref);
// 			timeOutCallBack && timeOutCallBack();
// 			timeFunction && clearTimeout(timeFunction);
// 		});
// 	}
// }
/**
 * function to handle tab switch
 * @param {String} uniqueTabWrapSelector 
 */
export function tabSwitch(uniqueTabWrapSelector) {
	const tabWrap = SET.$(uniqueTabWrapSelector);
	const tabsToggle = tabWrap.getElem('.tab-list [data-tab-toggle]', true);
	const tabs = tabWrap.getElem('.tab-content [data-tab-active]', true);
	// function to handle switch
	const handleTabDisplay = (tabToggle,tabToggleIndex) => {
		// get active tab ref
		let activeTabRef = tabsToggle[[...tabWrap.getElem('.tab-list [data-tab-toggle]', true)].findIndex( e => (e.attr('data-tab-toggle') === 'true'))].attr('data-tab-ref') || [...tabWrap.getElem('.tab-list [data-tab-toggle]', true)].findIndex( e => (e.attr('data-tab-toggle') === 'true'));
		// function to disable all tabs
		const handleDisableTabs = () => {
			tabsToggle.forEach((e,i) => {
				let tabRef = e.attr('data-tab-ref') ? parseInt(e.attr('data-tab-ref')) : i;
				let tab = [...tabs].filter(e => parseInt(e.attr('data-ref')) === tabRef)[0] || tabs[tabRef];
				e.attr('data-tab-toggle', 'false');
				tab.attr('data-tab-active', 'false');
				SET.fixClass([tab],[['left','right']],[false])
			})
		}
		// function to enable a tab
		const handleEnableTab = () => {
			let tabRef = tabToggle.attr('data-tab-ref') ? parseInt(tabToggle.attr('data-tab-ref')) : tabToggleIndex;
			let tab = [...tabs].filter(e => parseInt(e.attr('data-ref')) === tabRef)[0] || tabs[tabRef];
			let animeDir = parseInt(activeTabRef) < tabRef ? 'left' : 'right';
			tabToggle.attr('data-tab-toggle', 'true');
			tab.attr('data-tab-active', 'true');
			SET.fixClass([tab],[[animeDir]],[true]);
		}
		// activate switch
		if (!JSON.parse(tabToggle.attr('data-tab-toggle'))) {
			handleDisableTabs();
			handleEnableTab();
		}
	}
	tabsToggle.forEach((eachTabToggle,eachTabToggleIndex) => {
		eachTabToggle.on('click', (e) => {
			handleTabDisplay(e.currentTarget,eachTabToggleIndex);
		});
	});
}
/**
 * function to handle redirect or reload
 * @param {Sring} url 
 * @returns 
 */
export function redirectFunc(url = null) {
	if (url) {
		return window.location.href = url;
	}
	window.location.reload();
}

export function formatDate(date) {
	date = new Date(date);
	return `${date.getFullYear()}-${date.getUTCMonth()+1 > 9 ? date.getUTCMonth()+1 : '0'+(date.getUTCMonth()+1)}-${date.getDate() > 9 ? date.getDate() : '0'+date.getDate()}`
}

/**
 * function to format number and currecy
 * @param {number} number 
 * @param {string} currency 
 * @returns 
 */
export function formatNumber(number, currency = '₦') {
	number = parseInt(number);
	var p = (number).toFixed(2).split(".");
	p = p[0].split("").reverse().reduce(
		(acc, num, i, orig) => {
		return num === "_" ? acc : num + (i && !(i % 3) ? "," : "") + acc
		}, "") //+ "." + p[1]
	return currency ? currency + ' ' + p : p;
}

export function getHours(from_date, to_date, force = null) {
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

export function calcCost(from_date, to_date, cost, timing = 24) {
	let hours = getHours(from_date, to_date, timing);
	return (hours/timing) * cost;
}