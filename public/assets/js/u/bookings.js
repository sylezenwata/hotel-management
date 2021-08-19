// general script
import "../auth";

// bookings style
import "../../css/u/bookings.css";

// scripts
const SET = require("../set");
const FORM = require("../form");
const { notifier, validateData, redirectFunc, formatDate, formatNumber } = require("../mods");

/**
 * new new booking
 */
const _form = new FORM();
const newBookingBtn = SET.$('#newBooking');
const closeNewBooking = SET.$('#closeNewBooking');
const newBookingForm = SET.$('#newBookingForm');
const submitBtns = newBookingForm.getElem('button[type=submit]', true);
const handleNewBookingtDisplay = () => {
    const newBookingModal = SET.$('#newBookingModal');
    if (newBookingModal.style.display === 'none' || getComputedStyle(newBookingModal).display === 'none') {
        SET.fixClass(['body'],[['no-overflow']],[true]);
        newBookingModal.style.display = 'block';
        return;
    }
    SET.fixClass(['body'],[['no-overflow']],[false]);
    newBookingModal.style.display = 'none';
    _form.reset('#newBookingForm',["input:not([type=hidden])", "select", "textarea"]);
    handleSaveBtn(null);
}
const handleNewBookingForm = function(e) {
    e.preventDefault();
    newBookingForm.disableForm();
    notifier('Processing booking...','default',null,'new_booking_noti');
    let newBookingData = _form.assembleFormData('#newBookingForm');
    SET.ajax({
        url: this.attr('action'),
        method: this.attr('method'),
        body: newBookingData,
        handler: (res, err) => {
            notifier(null,null,null,'new_booking_noti');
            newBookingForm.disableForm(false);
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                handleNewBookingtDisplay();
                fetchBookings();
                return notifier(data,'success');
            }
            notifier('An error occurred processing request.','error');
        },
    });
}
const handleSaveBtn = e => {
    if (!e) {
        return submitBtns.forEach(eachBtn => eachBtn.attr('disabled', true));
    }
    submitBtns.forEach(eachBtn => eachBtn.attr('disabled', false));
}
newBookingBtn.on('click', handleNewBookingtDisplay);
closeNewBooking.on('click', handleNewBookingtDisplay);
newBookingForm.on('change', handleSaveBtn);
newBookingForm.on("submit", handleNewBookingForm);

/**
 * fetch bookings
 */
const bookingsTable = SET.$('#bookingsList');
const bookingsTableBody = bookingsTable.getElem('tbody');
const bookingsLoader = (loadingInfo = 'Loading bookings, please wait...') => {
    if (!loadingInfo) {
        return SET.removeElem(bookingsTableBody.getElem('#loader'));
    }
    bookingsTable.getElem('tbody').appendElem(`<tr id="loader"><td colspan="15" style="text-align: center;">${loadingInfo}</td></td>`);
}
const fetchBookings = (start = null, limit = null, empty = true, cb = null, url = '/bookings/fetch') => {
    empty && bookingsTableBody.html();
    bookingsLoader();
    let params = [`e=1`];
    start && params.push(`s=${start}`);
    limit && params.push(`l=${limit}`);
    SET.ajax({
        method: 'GET',
        url: SET.formatUrlParam(`${url}`, params),
        handler: (res, err) => {
            bookingsLoader(null);
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                const {bookings, more} = data;
                if (bookings.length <= 0) {
                    if (!start) {
                        bookingsTableBody.html('<tr><td colspan="15" style="text-align: center;">No bookings was found in the repository</td></tr>');
                    }
                } else {
                    bookings.forEach((eachData) => {
                        addToBookingsList(eachData);
                    });
                    if (more) {
                        bookingsTableBody.appendElem(`<tr class="r-item"><td colspan="15" style="text-align: center;"><a href="javascript:void(0);" id="more" style="text-decoration: underline; font-size: 14px;">More Bookings</a></td></tr>`);
                        moreLoad(more);
                    }
                }
                cb && cb();
                return;
            }
            notifier('An error occurred processing request.','error');
        },
    });
}
const addToBookingsList = (data) => {
    let index = bookingsTableBody.getElem('.r-item') ? bookingsTableBody.getElem('.r-item', true).length + 1 : 1;
    const {
        reference_number,
        reservation_title,
        reservation_location,
        user_fullname,
        user_email,
        booking_from,
        booking_to,
        booking_cost,
        made_payment,
        is_checked_in,
        is_checked_out,
        createdAt,
        status,
    } = data;
    const bookingsRow = `<tr class="r-item ${JSON.parse(status) === 1 ? 'r-item__active' : 'r-item__inactive'}">
        <td>${index}.</td>
        <td>${reference_number}</td>
        <td class="text-cap">${reservation_title}</td>
        <td class="text-cap">${reservation_location}</td>
        <td>${formatNumber(booking_cost)}</td>
        <td class="text-cap">${user_fullname}</td>
        <td>${user_email}</td>
        <td>${formatDate(booking_from)}</td>
        <td>${formatDate(booking_to)}</td>
        <td>${made_payment == 1 ? 'Paid' : 'Not Paid'}</td>
        <td>${is_checked_in == 1 ? 'True' : 'False'}</td>
        <td>${is_checked_out == 1 ? 'True' : 'False'}</td>
        <td>${formatDate(createdAt)}</td>
        <td>
            <div class="m-t-5">
                <span class="status text-cap">${JSON.parse(status) === 1 ? 'active' : 'inactive'}</span>
            </div>
        </td>
        <td>
            <div class="flex align-c justify-c">
                <div style="padding: 2px;">
                    <button title="${made_payment == 1 ? 'Unconfirm payment' : 'Confirm payment'}" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${reference_number}" onclick="update('${reference_number}','made_payment','${made_payment == 1 ? '0' : '1'}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-wallet" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" />
                            <path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" />
                        </svg>
                    </button>
                </div>
                <div style="padding: 2px;">
                    <button title="${is_checked_in == 1 ? 'Unconfirm check in' : 'Check in'}" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${reference_number}" onclick="update('${reference_number}','is_checked_in','${is_checked_in == 1 ? '0' : '1'}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l5 5l10 -10" />
                        </svg>
                    </button>
                </div>
                <div style="padding: 2px;">
                    <button title="${is_checked_out == 1 ? 'Uncheck out' : 'Check out'}" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${reference_number}" onclick="update('${reference_number}','is_checked_out','${is_checked_out == 1 ? '0' : '1'}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 12l5 5l10 -10" />
                            <path d="M2 12l5 5m5 -5l5 -5" />
                        </svg>
                    </button>
                </div>
                <div style="padding: 2px;">
                    <button title="${status == 1 ? 'Disable' : 'Enable'}" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${reference_number}" onclick="update('${reference_number}','status','${status == 1 ? '0' : '1'}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="disable" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <line x1="3" y1="3" x2="21" y2="21" />
                            <path d="M10.584 10.587a2 2 0 0 0 2.828 2.83" />
                            <path d="M9.363 5.365a9.466 9.466 0 0 1 2.637 -.365c4 0 7.333 2.333 10 7c-.778 1.361 -1.612 2.524 -2.503 3.488m-2.14 1.861c-1.631 1.1 -3.415 1.651 -5.357 1.651c-4 0 -7.333 -2.333 -10 -7c1.369 -2.395 2.913 -4.175 4.632 -5.341" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" class="enable" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <circle cx="12" cy="12" r="2" />
                            <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
                        </svg>
                    </button>
                </div>
                <div style="padding: 2px;">
                    <button title="Delete" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${reference_number}" onclick="deleteBooking('${reference_number}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <line x1="4" y1="7" x2="20" y2="7" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        </svg>
                    </button>
                </div>
            </div>
        </td>
    </tr>`;
    bookingsTableBody.appendElem(bookingsRow);
    window.update = (reference_number,target,value) => {
        notifier('Processing booking updating...','default',null,'updateBookingNoti');
        SET.ajax({
            method: 'GET',
            url: `/bookings/update/${reference_number}/${target}/${value}`,
            handler: (res, err) => {
                notifier(null,null,null,'updateBookingNoti');
                if (err)
                    return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
                const { error, errorMsg, data, force } = res;
                if (force) 
                    return redirectFunc(force);
                if (error)
                    return notifier(`${errorMsg}`,'error');
                if (data) {
                    return fetchBookings();
                }
                notifier('An error occurred processing request.','error');
            },
        });
    }
    window.deleteBooking = (reference_number) => {
        if (confirm('Are you sure you want to cancel this booking, this action cannot be reversed?')) {
            notifier('Processing booking delete...','default',null,'delBookingNoti');
            SET.ajax({
                url: `/bookings/delete/${reference_number}`,
                method: 'DELETE',
                handler: (res, err) => {
                    notifier(null,null,null,'delBookingNoti');
                    if (err)
                        return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
                    const { error, errorMsg, data, force } = res;
                    if (force) 
                        return redirectFunc(force);
                    if (error)
                        return notifier(`${errorMsg}`,'error');
                    if (data) {
                        return fetchBookings();
                    }
                    notifier('An error occurred processing request.','error');
                },
            });
        }
    }
}
const moreLoad = (start) => {
    const moreBtn = bookingsTableBody.getElem('#more');
    moreBtn.on('click', () => {
        SET.removeElem(moreBtn.getParent('r-item'));
        fetchBookings(start,null,false);
    })
}
window.on('DOMContentLoaded', () => {
    fetchBookings();
});
/**
 * search bookings
 */
SET.$('form#searchBookings').on('submit', e => {
    e.preventDefault();
    const searchInput = e.currentTarget.getElem('input[name=q]');
    const searchValue = searchInput.value;
    if (searchValue.trim().length > 0) {
        fetchBookings(null,null,true,null,`/bookings/filter?q=${searchValue}`);
    }
});

