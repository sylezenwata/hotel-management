(function (G, F) {
	"object" == typeof exports && "object" == typeof module
		? (module.exports = F())
		: "function" == typeof define && define.amd
		? define([], F)
		: "object" == typeof exports
		? (exports.SET = F())
		: (G.SET = F());
})(window, function () {
	"use strict";
	/**
	 * Functions to be bounded to Element constructor
	 */
	const E = {
		/**
		 * function to append element
		 * @param {String} node
		 */
		appendElem(node) {
			this.insertAdjacentElement(
				"beforeend",
				Set.prototype.elemManip.call(Set, node)
			);
		},
		/**
		 * function to prepend element
		 * @param {String} node
		 */
		prependElem(node) {
			this.insertAdjacentElement(
				"afterbegin",
				Set.prototype.elemManip.call(Set, node)
			);
		},
		/**
		 * function to get parent element
		 * @param parentClass
		 * @returns {Node}
		 */
		getParent(parentClass = null) {
			let parent = this.parentElement;
			if (!parentClass) return parent;
			if (!Set.prototype.$.call(Set,"." + parentClass))
				throw new Error(
					`There is no element with this "${parentClass}" class name.`
				);
			while (!parent.classList.contains(parentClass)) {
				parent = parent.parentElement;
			}
			return parent;
		},
		/**
		 * function to get sibling
		 * @param type {String} | 'next' or 'prev'
		 * @returns {Element}
		 */
		getSibling(type = null, siblingSelector = null) {
			if (type === "next" || type === null) {
				if (siblingSelector)
					return this.getParent().getElem(
						this.classList.value
							.split(" ")
							.map((e) => `.${e}`)
							.join()
							.replace(/,/g, "") +
							" + " +
							siblingSelector
					);
				return this.nextElementSibling;
			}
			if (type === "prev") return this.previousElementSibling;
		},
		/**
		 * function to disable form
		 * @return {boolean}
		 */
		disableForm(...args) {
			if (this.nodeName.toLowerCase() !== "form") {
				throw new Error("This function only works on a form.");
			}
			const formElements = this.elements;
			if (formElements.length < 1) return false;
			// loop through formElements
			[...formElements].forEach((eachElement) => {
				eachElement.disabled = !(
					arguments.length > 0 && arguments[0] === false
				);
			});
		},
		/**
		 * function to set or get attribute value
		 * @param {string} attr element's attr
		 * @param {*} attrValue if passed, the function performs a setAttribute, otherwise getAttribute
		 */
		attr(attr, attrValue = null) {
			if (attrValue) {
				return this.setAttribute(attr, attrValue);
			}
			if (attrValue === false) {
				return this.removeAttribute(attr);
			}
			return this.getAttribute(attr);
		},
		html(data = null) {
			if (data)
				return this.innerHTML = data;
			return this.innerHTML = '';
		}
	};
	/**
	 * Functions to be bouded to EventTarget Constructor
	 */
	const ET = {
		/**
		 * function to bind query select to element
		 * @param selector
		 * @param all
		 * @return {NodeList|Element[]|*[]|NodeListOf<*>|NodeListOf<Element>|*}
		 */
		getElem(selector, all = false) {
			if (selector === window) return selector;
			if (selector instanceof Element) return all ? [selector] : selector;
			if (selector instanceof NodeList) return all ? [selector] : selector;
			return all
				? [...this.querySelectorAll(selector)]
				: this.querySelectorAll(selector)[0];
		},
		/**
		 * function for adding event listener to an element
		 * @param {string} event
		 * @param {*} handler
		 * @param {object} options
		 * @returns {void}
		 */
		on(event, handler, options = null) {
			return options
				? this.addEventListener(event, handler, options)
				: this.addEventListener(event, handler);
		},
		/**
		 * function for removing event listener on an element
		 * @param {string} event
		 * @param {*} handler
		 * @param {object} options
		 * @returns {void}
		 */
		off(event, handler, options = null) {
			return options
				? this.removeEventListener(event, handler, options)
				: this.removeEventListener(event, handler);
		},
	};
	/**
	 * Set constructor
	 * @constructor
	 */
	class Set {
		constructor() {
			[...Object.keys(E)].forEach((key) => {
				Element.prototype[key] = E[key];
			});
			[...Object.keys(ET)].forEach((key) => {
				EventTarget.prototype[key] = ET[key];
			});
		}
		/**
		 * function to query select
		 * @param {*} selector
		 * @param {boolean} all
		 * @returns {Element[]|NodeListOf<*>}
		 */
		$(selector, all = false) {
			const target =
				arguments.length > 2 && arguments[2] !== undefined
					? arguments[2]
					: document;
			return target.getElem(selector, all);
		}
		/**
		 * function to add/remove class -
		 * this function will loop through the selectorArray, then using its index to loop through
		 * classArray and actionArray
		 * @param selectorArray
		 * @param classArray | contains array of classes for each selectorArray
		 * @param actionArray | true (to add class) or false (to remove class) for each selectorArray
		 * @returns {boolean|void}
		 */
		fixClass(selectorArray, classArray, actionArray) {
			for (let _i = 0; _i < selectorArray.length; _i++) {
				let target = this.$(selectorArray[_i]);
				if (target !== undefined) {
					for (let i = 0; i < classArray[_i].length; i++) {
						actionArray[_i]
							? target.classList.add(classArray[_i][i])
							: target.classList.remove(classArray[_i][i]);
					}
				}
			}
		}
		/**
		 * function to write style to an element
		 * @param selectorArray
		 * @param propertyArray
		 * @param valueArray
		 */
		fixStyle(selectorArray, propertyArray, valueArray) {
			for (let _i = 0; _i < selectorArray.length; _i++) {
				const target = this.$(selectorArray[_i]);
				if (target !== undefined) {
					for (let i = 0; i < valueArray[_i].length; i++) {
						if (target.style.hasOwnProperty(propertyArray[_i][i]))
							target.style[propertyArray[_i][i]] = valueArray[_i][i];
					}
				}
			}
		}
		/**
		 * function to calc device width
		 * @returns {number}
		 */
		checkDeviceWidth() {
			return (
				window.innerWidth ||
				document.documentElement.clientWidth ||
				document.body.clientWidth
			);
		}
		/**
		 * function to check device (ie. whether desktop/tablet/mobile)
		 * @returns {string}
		 */
		deviceType() {
			const userAgent = navigator.userAgent || navigator.vendor;
			if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
				return "tablet";
			}
			if (
				/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
					userAgent
				)
			) {
				return "mobile";
			}
			return "desktop";
		}
		/**
		 * function to check for browser type
		 */
		browserType() {
			if (
				(navigator.userAgent.indexOf("Opera") ||
					navigator.userAgent.indexOf("OPR")) !== -1
			) {
				return "Opera";
			} else if (navigator.userAgent.indexOf("Chrome") !== -1) {
				return "Chrome";
			} else if (navigator.userAgent.indexOf("Safari") !== -1) {
				return "Safari";
			} else if (navigator.userAgent.indexOf("Firefox") !== -1) {
				return "Firefox";
			} else if (
				navigator.userAgent.indexOf("MSIE") !== -1 ||
				!!document.documentMode === true
			) {
				//IF IE > 10
				return "IE";
			} else {
				return "unknown";
			}
		}
		/**
		 * function to create tag
		 * @param numberArray
		 * @param typeArray
		 * @returns {[]}
		 */
		createTag(numberArray, typeArray) {
			let _i = 0,
				tagsArray = [];
			for (; _i < numberArray.length; _i++) {
				let i = 0,
					tags = [];
				for (; i < numberArray[_i]; i++) {
					tags.push(document.createElement(typeArray[_i]));
				}
				tagsArray.push(tags);
			}
			return tagsArray;
		}
		/**
		 * function to add attribute to element
		 * @param {array} tagsArray
		 * @param {array} valuesArray
		 * @param {array} typesArray
		 */
		addAttr(tagsArray, valuesArray, typesArray) {
			for (let _i = 0; _i < tagsArray.length; _i++) {
				for (let i = 0; i < tagsArray[_i].length; i++) {
					tagsArray[_i][i].setAttribute(
						`${typesArray[_i][i]}`,
						valuesArray[_i][i]
					);
				}
			}
		}
		/**
		 * function to manipulate String Element into Node Element
		 * @param {String} node
		 * @returns {Node}
		 */
		elemManip(node) {
			// match and get first element and it properties (class, attributes)
			let elem = node
				.match(/<[^>]*>/g)[0]
				.replace(/</, "")
				.replace(/>/, "");
			// get tag name
			let elemTag = elem.split(" ")[0];
			elem = elem.match(/\s+[a-zA-Z0-9-]+="[a-zA-Z0-9-_:\(\)\/\s;]+"/g);
			if (elem) {
				elem = elem.map((e) => e.trim());
			}
			// update passed node by removing first tag
			node = node.replace(/<[^>]*>/, "").replace(/<\/[^>]*>$/, "");
			// create tag
			let [newNode] = this.prototype.createTag([1], [elemTag])[0];
			// set properties to newNode
			if (elem) {
				elem.forEach((e) => {
					let [name, value] = e.replace(/\"/g, "").split("=");
					newNode.attr(name, value);
				});
			}
			// set node in newNode
			newNode.innerHTML = node;
			return newNode;
		}
		/**
		 * function to remove element
		 * @param targetElement
		 * @param index | for a case where there are numerous target
		 */
		removeElem(targetElement, index = 0) {
			const target = this.$(targetElement, true)[index];
			if (target) target.remove();
		}
		/**
		 * function to set a cookie
		 * @param cName
		 * @param cValue
		 * @param expDays
		 * @param path
		 */
		sCookie(cName, cValue, expDays = 30, path = "/") {
			const cDate = new Date();
			cDate.setTime(
				cDate.getTime() + (expDays ? expDays : 0) * 24 * 60 * 60 * 1000
			);
			const cVal = escape(cValue) + "; expires=" + cDate.toUTCString();
			document.cookie = cName + "=" + cVal + "; path=" + path;
		}
		/**
		 * function to get a cookie
		 * @param cName
		 * @returns {string}
		 */
		gCookie(cName) {
			let decodedC, splitC, eachCname, eachCvalue;
			decodedC = decodeURIComponent(document.cookie);
			splitC = decodedC.split(";");
			for (let i = 0; i < splitC.length; i++) {
				eachCname = splitC[i].substr(0, splitC[i].indexOf("="));
				eachCvalue = splitC[i].substr(splitC[i].indexOf("=") + 1);
				eachCname = eachCname.replace(/^\s+|\s+$/g, "");
				if (eachCname === cName) return unescape(eachCvalue);
			}
		}
		/**
		 * function to update a cookie
		 * @param cName
		 * @param cValue
		 */
		uCookie(cName, cValue) {
			if (this.gCookie(cName)) document.cookie = cName + "=" + cValue;
		}
		/**
		 * function to perform ajax request
		 * @param {Object} - {
		 * 	url,
		 * 	method,
		 * 	timeOut,
		 * 	cache = false,
		 * 	body = null,
		 * 	handler = null,
		 * 	withCredentials = true,
		 * 	responseType = 'json',
		 * 	headers = {'X-Requested-With': 'XMLHttpRequest','Content-Type': 'application/json; charset=UTF-8'}
		 * }
		 * @returns Object|function
		 */
		ajax({
			url,
			method,
			timeOut,
			cache = false,
			body = null,
			handler = null,
			withCredentials = true,
			responseType = "json",
			headers = null,
		}) {
			// defining XMLHttpRequest
			// const xhr = new XMLHttpRequest() || new ActiveXObject("Microsoft.XMLHTTP");
			const xhr = new XMLHttpRequest();
			// validate withCredentials
			withCredentials && (xhr.withCredentials = true);
			// open req
			xhr.open(
				method,
				cache
					? url
					: url +
							(/\?/.test(url) ? "&" : "?") +
							"_" +
							Math.floor(Math.random() * 10e11)
			);
			// set req header
			// NB: eachHeader obj key and value will be used to set header
			if (headers) {
				headers = Object.assign(
					{
						"X-Requested-With": "XMLHttpRequest",
						"Content-Type": "application/json; charset=UTF-8",
						"Accept": "application/json; charset=UTF-8"
					},
					headers
				);
			} else {
				headers = {
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/json; charset=UTF-8",
					"Accept": "application/json; charset=UTF-8"
				}
			}
			let headersKeys = Object.keys(headers);
			for (let eachKey of headersKeys) {
				if (!headers[eachKey]) {
					continue;
				}
				xhr.setRequestHeader(eachKey, headers[eachKey]);
			}
			// set response type
			responseType && (xhr.responseType = responseType);
			// set timeout
			timeOut && (xhr.timeout = timeOut * 1000);
			// exec send
			try {
				xhr.send(
					body
						? headers["Content-Type"] === "application/json; charset=UTF-8"
							? JSON.stringify(body)
							: body
						: null
				);
			} catch (error) {
				console.error(error);
				if (handler)
					return handler(null, {
						code: error.status,
						msg: error.statusText,
					});
			}
			// capture when loaded
			xhr.onload = () => {
				// request status
				const { status, statusText, response } = xhr;
				if (status !== 200 || status < 200 || status > 200)
					console.error(`${status}: ${statusText}`);
				// handler
				if (handler)
					if (status !== 200 || status < 200 || status > 200)
						handler(response, {
							code: status,
							msg: statusText,
						});
					else handler(response, null);
				else return response;
			};
			// capture error
			xhr.onerror = (error) => {
				console.error(error);
				if (handler)
					return handler(null, {
						msg: "Request was not sent, this is a technical error.",
					});
			};
		}
		/**
		 * function to val if an item exists in an array
		 * @param {string} value
		 * @param {array} array
		 * @return {boolean|number}
		 */
		existsInArray(value, array) {
			let result = false;
			if (Array.isArray(array) && array.length > 0) {
				for (let i = 0; i < array.length; i++) {
					if (value === array[i]) {
						result = i;
						break;
					}
				}
			}
			return result;
		}
		/**
		 * function to val if an item(key and value) exists in an object
		 * @param {array} targetArray
		 * @param {array} valueArray
		 * @param {object} obj
		 * @return boolean
		 */
		existsInObj(targetArray, valueArray, obj) {
			let result = 0;
			if ("object" === typeof obj) {
				for (let _i = 0; _i < targetArray.length; _i++) {
					let objKeys = Object.keys(obj);
					for (let i = 0; i < objKeys.length; i++) {
						if (
							objKeys[i] === targetArray[_i] &&
							valueArray[_i] === obj[targetArray[_i]]
						) {
							result += 1;
						}
					}
				}
			}
			return result === targetArray.length;
		}
		/**
		 * function to get index of an obj in an array
		 * @param {string} target
		 * @param {array} arrayOfObj
		 * @return number|null
		 */
		indexOfObj(target, value, arrayOfObj) {
			if (Array.isArray(arrayOfObj) && arrayOfObj.length > 0) {
				for (let i = 0; i < arrayOfObj.length; i++) {
					if (this.existsInObj([target], [value], arrayOfObj[i])) return i;
				}
			}
			return null;
		}
		/**
		 * 
		 * @param {String} url Url to format
		 * @param {Array} params Url parameters to be bounded to main url
		 * @returns {String}
		 */
		formatUrlParam(url,params) {
			return /\?/.test(url) ? `${url}&${params.join('&')}` : `${url}?${params.join('&')}`;
		}
	}
	// instantiate Set and export as SET
	return new Set();
});
