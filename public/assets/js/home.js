import "../css/animate.css";
import "../css/base.css";
import "../css/form.css";
import "../css/main.css";
import "../css/home.css";
import "../css/res.css";

const SET = require("./set");
const FORM = require("./form");
const { notifier, tabSwitch, formatNumber, calcCost, redirectFunc } = require("./mods");

const _form = new FORM();

/**
 * search reservation
 */
SET.$('form#reservationFilterForm').on('submit', e => {
    e.preventDefault();
    let formData = _form.assembleFormData('#reservationFilterForm');
    let params = Object.keys(formData);
    if (params.filter(e => formData[e].trim().length <= 0).length >= params.length) {
        return notifier('You have not entered any search keyword.', 'error');
    }
    let url = SET.formatUrlParam('/reservations/filter', params.map(e => `${e}=${formData[e]}`));
    fetchRservation(null,null,true,null,url);
});

/**
 * fetch reservations
 */
const reservationCon = SET.$('#reservationContainer');
const reservationLoader = (loadingInfo = 'Loading reservations, please wait...') => {
    if (!loadingInfo) {
        return SET.removeElem(reservationCon.getParent().getElem('#reservationLoader'));
    }
    reservationCon.getParent().appendElem(`<div id="reservationLoader" class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c"><div class="f-14">${loadingInfo}</div></div>`);
}
function fetchRservation(start = null, limit = null, empty = true, cb = null, url = '/reservations/fetch') {
    empty && reservationCon.html();
    empty && SET.removeElem(reservationCon.getParent().getElem('#moreReservation'))
    reservationLoader();
    let params = [`e=1`];
    start && params.push(`s=${start}`);
    limit && params.push(`l=${limit}`);
    SET.ajax({
        method: 'GET',
        url: SET.formatUrlParam(`${url}`, params),
        headers: {
            'Content-Type': false
        },
        handler: (res, err) => {
            reservationLoader(null);
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                const {reservations, more} = data;
                if (reservations.length <= 0) {
                    if (!start) {
                        reservationCon.html('<div class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c w-100"><div class="f-14">No reservation found</div></div>');
                    }
                } else {
                    reservations.forEach((eachData) => {
                        addToReservationList(eachData);
                    });
                    if (more) {
                        reservationCon.getParent().appendElem(`<div id="moreReservation" class="m-t-20 p-tb-20 p-lr-10 flex flex-col align-c"><button class="btn" style="color: var(--text-color);">More reservations</button></div>`);
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
const addToReservationList = (data) => {
    let {
        id,
        reservation_images,
        reservation_title,
        reservation_location,
        reservation_cost,
        reservation_rating
    } = data;
    reservation_images = reservation_images.split(",")[0];
    reservation_cost = formatNumber(reservation_cost);
    reservation_rating = parseInt(reservation_rating);
    reservation_rating = (Array(reservation_rating).fill('<span>&starf;</span>').join(''))+(Array(5 - reservation_rating).fill('<span>&star;</span>').join(''));
    let reservationItem = `<div class="res-item__wrap">
        <button class="res-item" onclick='viewReservation(${JSON.stringify(data)})'>
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
                    <div class="cost f-18 f-w-6 text-color">${reservation_cost}</div>
                    <div class="rating">
                        ${reservation_rating}
                    </div>
                </div>
            </div>
        </button>
    </div>`;
    reservationCon.appendElem(reservationItem);
}
const moreLoad = (start) => {
    const moreBtn = reservationCon.getParent().getElem('#moreReservation button');
    moreBtn.on('click', () => {
        SET.removeElem(moreBtn.getParent());
        fetchReservation(start,null,false);
    })
}
window.on('DOMContentLoaded', () => {
    fetchRservation();
});

window.viewReservation = function(data) {
    let {
        id,
        reservation_images,
        reservation_title,
        reservation_location,
        reservation_cost,
        reservation_rating,
        reservation_desc,
    } = data;
    reservation_images = reservation_images.split(",");
    reservation_rating = parseInt(reservation_rating);
    reservation_rating = (Array(reservation_rating).fill('<span>&starf;</span>').join(''))+(Array(5 - reservation_rating).fill('<span>&star;</span>').join(''));
    reservation_desc = JSON.parse(reservation_desc);
    let temp = `<div id="reservationDetailsModal" class="modal dark" data-displayed="true">
        <form id="reservationDetailsForm" action="/bookings/new" method="POST">
            <div class="modal-content b-rad-5 b-s-high">
                <div class="modal-head flex justify-b">
                    <h1 class="flex flex-col justify-c f-14 text-cap">Reservation details</h1>
                    <div class="flex align-c">
                        <div class="btn-wrap" style="margin: 0 10px 0 0;">
                            <button type="submit" class="btn primary flex align-c head__foot__btn">
                                <span class="p-lr-5">Book</span>
                            </button>
                        </div>
                        <button type="button" id="closeReservationDetails" onclick="closeModal(event)" class="icon stroke" title="Close" style="width: 25px; height: 25px; background-color: transparent; border: none">
                            <svg xmlns="http://www.w3.org/2000/svg" style="stroke-width: 2.0;" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="modal-body custom-scroll">
                    <div class="modal-body__content">
                        <div class="flex">
                            <div class="img-layout">
                                <div class="img-layout__slide" style="background-image: url('/assets/uploads/reservations/${reservation_images[0]}');"></div>
                                <div class="img-layout__images flex align-c m-t-5">`;
        reservation_images.forEach((image, iIndex) => {
            temp += `<button type="button" onclick="switchImage('/assets/uploads/reservations/${image}')">
                <img src="/assets/uploads/reservations/${image}" alt="img${iIndex}">
            </button>`;
        })
        temp +=                 `</div>
                            </div>
                            <div class="txt-layout">
                                <div class="head">
                                    <h1 class="title text-cap">${reservation_title}</h1>
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
                                        <div class="cost f-18 f-w-6 text-color">${formatNumber(reservation_cost)}</div>
                                        <div class="rating">
                                            ${reservation_rating}
                                        </div>
                                    </div>
                                </div>
                                <div class="body">
                                    <div id="detailsTab" class="position-r tab-wrap">
                                        <div class="tab-list f-w-5 f-14 hidden-scroll" style="border-radius: 5px 5px 0 0;">`;
        Object.keys(reservation_desc).forEach((eachKey, kIndex) => {
            temp += `<div role="button" class="tab-list__item text-cap" data-tab-toggle="${kIndex === 0 ? 'true' : 'false'}" data-tab-ref="${kIndex}">${eachKey}</div>`;
        });
        temp +=                        `</div>
                                        <div role="tablist" class="tab-content" style="border-radius: 0;">`;
        Object.keys(reservation_desc).forEach((eachKey, kIndex) => {
            temp += `<div role="tab" data-tab-active="${kIndex === 0 ? 'true' : 'false'}" data-ref="${kIndex}" class="tab-content__item">
                        <div class="flex flex-wrap">`;
                            reservation_desc[eachKey].forEach(eachProp => {
                                temp += `<div class="detail-item p-10">${eachProp}</div>`;
                            });
                temp += `</div>
                    </div>`;
        });
        temp +=                         `</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="data-layout">
                            <input type="hidden" name="a" value="1">
                            <input type="hidden" name="reservation_id" value="${id}">
                            <input type="hidden" name="reservation_cost" value="${reservation_cost}">
                            <input type="hidden" name="reservation_cost_new" value="${reservation_cost}">
                            <div class="f-14 m-t-10 text-c">Select booking date<span class="f-12 m-l-5">(NB: Daily timing is aproximated to 24hours)</span></div>
                            <div class="input-group-wrap">
                                <div class="input-wrap">
                                    <div class="form-input__wrap flex align-c">
                                        <label class="form-input__label">
                                            <span>From</span>
                                            <input type="datetime-local" class="form-input" name="from_date" required/>
                                        </label>
                                    </div>
                                </div>
                                <div class="input-wrap">
                                    <div class="form-input__wrap flex align-c">
                                        <label class="form-input__label">
                                            <span>To</span>
                                            <input type="datetime-local" class="form-input" name="to_date" required/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-foot flex justify-e align-c">
                    <div class="btn-wrap" style="margin: 0;">
                        <button type="submit" class="btn primary flex align-c">
                            <span class="p-lr-5">Book</span>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>`;
    SET.$('body > .content').appendElem(temp);
    SET.fixClass(['body'],[['no-overflow']],[true]);
    tabSwitch('#detailsTab');
    window.switchImage = function(src) {
        SET.$('#reservationDetailsModal .img-layout .img-layout__slide').style.setProperty('background-image', `url('${src}')`);
    }
    let form = SET.$('#reservationDetailsForm');
    form.on('change', e => {
        let cost = form.getElem("input[name='reservation_cost']").value;
        let from_date = form.getElem("input[name='from_date']").value;
        let to_date = form.getElem("input[name='to_date']").value;
        if (from_date.trim().length > 0 && to_date.trim().length > 0) {
            let newCost = calcCost(from_date,to_date,cost);
            form.getElem("input[name='reservation_cost_new']").value = newCost;
            form.getElem(".cost").html(`${formatNumber(newCost)}`);
        }
    });
    form.on('submit', e => {
        e.preventDefault();
        if (confirm('Are you sure you want to book this reservation?')) {
            form.disableForm();
            notifier('Processing booking, please wait...','default',null,'booking_noti');
            let formData = _form.assembleFormData('#reservationDetailsForm');
            SET.ajax({
                method: form.attr('method'),
                url: form.attr('action'),
                body: formData,
                timeout: 60,
                handler: (res, err) => {
                    notifier(null,null,null,'booking_noti');
                    form.disableForm(false);
                    if (err)
                        return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
                    const { error, errorMsg, data, force } = res;
                    if (force) return redirectFunc(force);
                    if (error) return notifier(`${errorMsg}`,'error');
                    if (data) {
                        SET.removeElem('#reservationDetailsModal');
                        SET.fixClass(['body'],[['no-overflow']],[false]);
                        return notifier(data,'success',10,null,() => redirectFunc('/myBooking'));
                    }
                    notifier('An error occurred processing request.','error');
                },
            });
        }
    });
}

window.closeModal = function(e) {
    SET.removeElem(e.currentTarget.getParent('modal'));
    SET.fixClass(['body'],[['no-overflow']],[false]);
}