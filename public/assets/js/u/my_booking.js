import "../auth";

import "../../css/u/my_booking.css";

const SET = require("../set");
const FORM = require("../form");
const { notifier, formatNumber } = require("../mods");

/**
 * search resource
 */
SET.$('form#bookingFilterForm').on('submit', e => {
    e.preventDefault();
    const filterInput = e.currentTarget.getElem('input[name=q]');
    const filterValue = filterInput.value;
    if (filterValue.trim().length > 0) {
        fetchBookings(null,null,true,null,`/bookings/filter?q=${filterValue}`);
    }
});

/**
 * fetch bookings
 */
const bookingCon = SET.$('#bookingContainer');
const bookingLoader = (loadingInfo = 'Loading bookings, please wait...') => {
    if (!loadingInfo) {
        return SET.removeElem(bookingCon.getParent().getElem('#bookingLoader'));
    }
    bookingCon.getParent().appendElem(`<div id="bookingLoader" class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c"><div class="f-14">${loadingInfo}</div></div>`);
}
function fetchBookings(start = null, limit = null, empty = true, cb = null, url = '/bookings/fetch') {
    empty && bookingCon.html();
    empty && SET.removeElem(bookingCon.getParent().getElem('#moreBooking'))
    bookingLoader();
    let params = [];
    start && params.push(`s=${start}`);
    limit && params.push(`l=${limit}`);
    SET.ajax({
        method: 'GET',
        url: SET.formatUrlParam(`${url}`, params),
        headers: {
            'Content-Type': false
        },
        handler: (res, err) => {
            bookingLoader(null);
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
                        bookingCon.html('<div class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c w-100"><div class="f-14">No booking found</div></div>');
                    }
                } else {
                    bookings.forEach((eachData) => {
                        addToBookingList(eachData);
                    });
                    if (more) {
                        bookingCon.getParent().appendElem(`<div id="moreBooking" class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c"><button class="btn" style="color: var(--text-color);">More bookings</button></div>`);
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
function addToBookingList(data) {
    let {
        reservation_images,
        reservation_title,
        reservation_location,
        booking_cost,
        reference_number,
        formatted_booking_from,
        formatted_booking_to,
        is_checked_in,
        is_checked_out,
        made_payment,
    } = data;
    reservation_images = reservation_images.split(",")[0];
    is_checked_in = is_checked_in == 1 ? true : false;
    is_checked_out = is_checked_out == 1 ? true : false;
    let statusInfo = 'Pending';
    let statusColor = 'default';
    if (is_checked_in && !is_checked_out) {
        statusInfo = 'Checked-In';
    }
    if (is_checked_in && is_checked_out) {
        statusInfo = 'Checked-Out';
        statusColor = 'success';
    }
    let resourceItem = `<div class="res-item__wrap">
        <div class="res-item position-r" style="height: auto; cursor: unset;">
            <div class="res-item__head">
                <div class="bg-img" style="background-image: url('/assets/uploads/reservations/${reservation_images}');"></div>
            </div>
            <div class="res-item__body">
                <div class="title text-cap">${reservation_title}</div>
                <div class="m-t-10 flex align-c">
                    <span class="icon stroke" style="padding: 0; height: 20px; width: 20px; margin-right: 5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <circle cx="12" cy="11" r="3"></circle>
                            <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
                        </svg>
                    </span>
                    <span class="location">${reservation_location}</span>
                </div>
                <div class="flex align-c justify-b m-t-10">
                    <div class="cost f-18 f-w-6 text-color">${formatNumber(booking_cost)}</div>
                </div>
                <details class="m-t-5">
                    <summary class="text-c p-5" style="cursor: pointer;">Show more details</summary>
                    <div style="padding: 0;">
                        <div class="input-wrap" style="margin-top: 5px;">
                            <div class="form-input__wrap flex align-c">
                                <label class="form-input__label">
                                    <span class="f-12">Reference Number</span>
                                    <input type="text" style="padding: 5px; font-size: 12px; height: unset; border-radius: 0;" class="form-input" name="reference_number" value="${reference_number}" readonly/>
                                </label>
                            </div>
                        </div>
                        <div class="input-wrap" style="margin-top: 5px;">
                            <div class="form-input__wrap flex align-c">
                                <label class="form-input__label">
                                    <span class="f-12">From</span>
                                    <input type="text" style="padding: 5px; font-size: 12px; height: unset; border-radius: 0;" class="form-input" name="reference_number" value="${formatted_booking_from}" readonly/>
                                </label>
                            </div>
                        </div>
                        <div class="input-wrap" style="margin-top: 5px;">
                            <div class="form-input__wrap flex align-c">
                                <label class="form-input__label">
                                    <span class="f-12">To</span>
                                    <input type="text" style="padding: 5px; font-size: 12px; height: unset; border-radius: 0;" class="form-input" name="reference_number" value="${formatted_booking_to}" readonly/>
                                </label>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
            <div class="p-10 flex align-c justify-b" style="border-top: 1px solid var(--border-color);">
                <div class="status ${statusColor}" style="border-radius: 0;">${statusInfo}</div>
                <button class="btn error f-12" onclick="cancelBooking('${reference_number}')" style="padding: 5px 10px;"${is_checked_in ? 'disabled' : ''}>Cancel</button>
            </div>
        </div>
    </div>`;
    bookingCon.appendElem(resourceItem);
    window.cancelBooking = function(reference_number) {
        if (confirm('Are you sure you want to cancel this booking, this action cannot be reversed?')) {
            notifier('Processing request, please wait...','default',null,'delBookingNoti');
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
function moreLoad(start) {
    const moreBtn = bookingCon.getParent().getElem('#moreBooking button');
    moreBtn.on('click', () => {
        SET.removeElem(moreBtn.getParent());
        fetchBookings(start,null,false);
    });
}
// load bookings when page loads
window.on('DOMContentLoaded', () => {
    fetchBookings();
});
