const SET = require("./set");
(function (G, F) {
	"object" == typeof exports && "object" == typeof module
		? (module.exports = F())
		: "function" == typeof define && define.amd
		? define([], F)
		: "object" == typeof exports
		? (exports.FORM = F())
		: (G.FORM = F());
})(window, function () {
	"use strict";
	/**
	 * constructor to handle form action
	 * ie. validation, performance
	 * @constructor
	 */
	class Form {
		constructor() {
			/**
			 * Initial basic data
			 */
			this.config = {
				formDataFieldsType: ["input", "select", "textarea"],
				formRequiredSelector: "form[data-validate='true']",
				fieldsRequiredSelector: "[jsrequired='true']",
				// regex of elements to be validated
				regex: {
					email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					phone: /^([0])([7]|[8]|[9])([\d]){9}$/,
					password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,20}$/,
				}
			}
			/**
			 * object to store required fields when page loads
			 * it stores data of each form with form's id as key and array of required field's jsname
			 */
			this.requiredFields = {}
			/**
			 * basic runtime functions
			 */
			this.readRequiredField();
			this.observeFieldsWithPlaceholder();
			this.observeFieldsToSwitch();
			this.observeFormSubmit();
		}
		/**
		 * function store required fields when page loads
		 */
		readRequiredField() {
			// get all forms
			const forms = SET.$(this.config.formRequiredSelector, true);
			forms.forEach((eachForm) => {
				// get each form id from id attribute
				const formId = eachForm.attr("id");
				// get all required fields from form
				const fields = eachForm.getElem(this.config.fieldsRequiredSelector, true);
				// define array with key of form id to store each of the form's required data
				this.requiredFields[formId] = {
					validated: false,
					fields: [],
				};
				// loop and store each form field jsname in form array
				fields.forEach((eachField) => {
					this.requiredFields[formId].fields.push(eachField.attr("jsname"));
				});
			});
		}
		/**
		 * function to validate form
		 * @param formId
		 */
		validateForm(formId) {
			// array to store found errors
			let errors = [];
			// get form fields
			const formFields = SET.$(`#${formId} ${this.config.fieldsRequiredSelector}`,true);
			// loop form fields
			formFields.forEach((eachField) => {
				const eachFieldName = eachField.attr("jsname");
				const eachFieldValue = /^(span|div)$/.test(eachField.nodeName.toLowerCase()) ? eachField.innerText : eachField.value;
				// if each field jsname attr in requiredFields
				if (
					this.requiredFields[formId].fields.filter((e) => e === eachFieldName)
				) {
					// validate with field jsname regex
					const parentWrap = eachField.getParent("input-wrap");
					if (!this.config.regex[eachFieldName].test(eachFieldValue.trim())) {
						if (parentWrap.attr("data-error") === "false") {
							parentWrap.attr("data-error", "true");
							parentWrap.appendElem(
									this.createFormError(
										"Invalid " +
											eachField.attr("jsvalidate").split("+").join(" or ")
									)
								);
						}
						errors.push(eachFieldName);
					} else {
						parentWrap.attr("data-error", "false");
						// check if eachField parent has error element before removing error element
						if (parentWrap.getElem(".form-input-error"))
							SET.removeElem(
								eachField.getParent('input-wrap').getElem('.form-input-error')
							);
					}
				}
			});
			// returns true if no error found in form else false
			return errors.length === 0;
		}
		/**
		 * function to show form field error
		 * @param errorInfo
		 */
		createFormError(errorInfo) {
			return `<span class="form-input-error"><svg class="form-input-error-icon" focusable="false" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg><span>${errorInfo}</span></span>`;
		}
		/**
		 * function to validate form before submission
		 */
		observeFormSubmit() {
			const forms = SET.$("form", true);
			forms.forEach((eachForm) => {
				eachForm.on("submit", (e) => {
					let formId = eachForm.attr("id");
					if (this.requiredFields[formId]) {
						if (this.validateForm(formId)) {
							this.requiredFields[formId].validated = true;
						} else {
							// prevent form from submitting
							e.preventDefault();
							this.requiredFields[formId].validated = false;
						}
					}
				});
			});
		}
		/**
		 * function to handle form elements with placeholder
		 * This function with update element's parent (ie. div.input-wrapper) 'data-content' attr
		 * with true if element has value, otherwise false
		 */
		observeFieldsWithPlaceholder() {
			const fields = SET.$("[jsplaceholder]", true);
			const setHasValue = (eachField) => {
				const parentWrapper = eachField.getParent("input-wrap");
				const fieldValue = "div" === eachField.nodeName.toLowerCase() ? eachField.innerText : eachField.value;
				if (fieldValue.trim() !== "")
					parentWrapper.attr("data-content", "true");
				else 
					parentWrapper.attr("data-content", "false");
			}
			fields.forEach((field) => {
				setHasValue(field);
				field.on("blur", () => {
					setHasValue(field);
				});
			});
		}
		/**
		 * function to observe fields with jstypeswitch attr
		 */
		observeFieldsToSwitch() {
			const fields = SET.$("[jstypeswitch]", true);
			fields.forEach((eachField) => {
				const switchBtn = eachField.getParent("input-wrap").getElem(".switch-action");
				if (switchBtn) {
					switchBtn.on("click", () => {
						// get current field type
						const currentType = eachField.type;
						// change field type and update jstypeswitch attr
						eachField.type = eachField.attr("jstypeswitch");
						eachField.attr("jstypeswitch", currentType);
					});
				}
			});
		}
		/**
		 * function to assemble form data
		 * @param formSelector
		 * @param format 'json','url','formData'
		 * @param {Array} fieldsType
		 */
		assembleFormData(
			formSelector,
			format = "",
			fieldsType = this.config.formDataFieldsType
		) {
			// define fields to extract data from
			let stringFieldsType = fieldsType.join();
			// var to store data based on format (either json or url params)
			let data = format === "formData" ? new FormData() : format === "url" ? "" : {};
			// get and loop form data fields
			const dataFields = SET.$(formSelector).getElem(stringFieldsType, true);
			dataFields.forEach((eachField, eachFieldIndex) => {
				const fieldValue = SET.existsInArray(eachField.nodeName.toLowerCase, ["div","span",]) ? eachField.innerText : eachField.value;
				const fieldName = eachField.attr("name");
				if (format === "formData") {
					if (eachField.type === 'file') {
						for (let i = 0; i < eachField.files.length; i++) {
							const eF = eachField.files[i];
							data.append(fieldName, eF);
						}
					} else {
						data.append(fieldName, fieldValue);
					}
				}
				else if (format === "url")
					data += eachFieldIndex > 0 ? "&" + fieldName + "=" + fieldValue : fieldName + "=" + fieldValue;
				else 
					data[fieldName] = fieldValue;
			});
			// return data
			return data;
		}
		reset(formSelector, desiredFields = null) {
			// define fields to extract data from
			let stringFieldsType = desiredFields ? desiredFields.join() : this.config.formDataFieldsType.join();
			// get and loop form data fields
			const dataFields = SET.$(formSelector).getElem(stringFieldsType, true);
			dataFields.forEach(eachField => {
				// empty field
				eachField.value = '';
				eachField.getParent('input-wrap').attr('data-content', 'false');
			});
		}
	}
	// return form constructor
	return Form;
});
