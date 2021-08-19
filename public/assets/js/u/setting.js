import "../auth";

// css
import "../../css/u/setting.css";

// scrpts
const SET = require("../set");
const FORM = require("../form");
const { notifier, redirectFunc } = require("../mods");

// FORM instance
const _form = new FORM();

/**
 * change password form
 */
(function(){
    const changePasswordBtn = SET.$('#changePassword');
    const closeChangePassword = SET.$('#closeChangePassword');
    const changePasswordForm = SET.$("#changePasswordForm");
    const submitBtns =  changePasswordForm.getElem("button[type='submit']", true);
    const handleChangePasswordDisplay = () => {
        const changePasswordModal = SET.$('#changePasswordModal');
        if (changePasswordModal.style.display === 'none' || getComputedStyle(changePasswordModal).display === 'none') {
            SET.fixClass(['body'],[['no-overflow']],[true]);
            changePasswordModal.style.display = 'block';
            return;
        }
        SET.fixClass(['body'],[['no-overflow']],[false]);
        changePasswordModal.style.display = 'none';
    }
    const handleChangePasswordForm = function(e, btn) {
        e.preventDefault();
        changePasswordForm.disableForm();
        notifier('Processing update...','default',null,'change_password_noti');
        let editAccountData = _form.assembleFormData("#changePasswordForm");
        SET.ajax({
            url: this.attr('action'),
            method: this.attr('method'),
            body: editAccountData,
            timeout: 30,
            handler: (res, err) => {
                notifier(null,null,null,'change_password_noti');
                changePasswordForm.disableForm(false);
                if (err)
                    return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
                const { error, errorMsg, data, force } = res;
                if (force) return redirectFunc(force);
                if (error) return notifier(`${errorMsg}`,'error');
                if (data) {
                    handleChangeBtn(null);
                    handleChangePasswordDisplay();
                    _form.reset(changePasswordForm, ['input:not([type=hidden])']);
                    return notifier(data,'success');
                }
                notifier('An error occurred processing request.','error');
            },
        });
    }
    const handleChangeBtn = e => {
        if (!e) {
            return submitBtns.forEach(eachBtn => eachBtn.attr('disabled', true));
        }
        submitBtns.forEach(eachBtn => eachBtn.attr('disabled', false));
    }
    changePasswordBtn.on('click', handleChangePasswordDisplay);
    closeChangePassword.on('click', handleChangePasswordDisplay);
    changePasswordForm.on('change', handleChangeBtn);
    changePasswordForm.on("submit", handleChangePasswordForm);
})();
/**
 * edit account
 */
(function(){
    const accountBtn = SET.$('#account');
    const closeAccount = SET.$('#closeAccount');
    const accountForm = SET.$("#accountForm");
    const submitBtns =  accountForm.getElem("button[type='submit']", true);
    const handleAccountDisplay = () => {
        const accountModal = SET.$('#accountModal');
        if (accountModal.style.display === 'none' || getComputedStyle(accountModal).display === 'none') {
            SET.fixClass(['body'],[['no-overflow']],[true]);
            accountModal.style.display = 'block';
            return;
        }
        SET.fixClass(['body'],[['no-overflow']],[false]);
        accountModal.style.display = 'none';
    }
    const handleAccountForm = function(e, btn) {
        e.preventDefault();
        accountForm.disableForm();
        notifier('Processing update...','default',null,'edit_account_noti');
        let editAccountData = _form.assembleFormData("#accountForm");
        SET.ajax({
            url: this.attr('action'),
            method: this.attr('method'),
            body: editAccountData,
            timeout: 30,
            handler: (res, err) => {
                notifier(null,null,null,'edit_account_noti');
                accountForm.disableForm(false);
                if (err)
                    return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
                const { error, errorMsg, data, force } = res;
                if (force) return redirectFunc(force);
                if (error) return notifier(`${errorMsg}`,'error');
                if (data) {
                    handleChangeBtn(null);
                    handleAccountDisplay();
                    return notifier(data,'success',10,null,() => redirectFunc());
                }
                notifier('An error occurred processing request.','error');
            },
        });
    }
    const handleChangeBtn = e => {
        if (!e) {
            return submitBtns.forEach(eachBtn => eachBtn.attr('disabled', true));
        }
        submitBtns.forEach(eachBtn => eachBtn.attr('disabled', false));
    }
    accountBtn.on('click', handleAccountDisplay);
    closeAccount.on('click', handleAccountDisplay);
    accountForm.on('change', handleChangeBtn);
    accountForm.on("submit", handleAccountForm);
})();