// general script
import "../auth";

// reservations style
import "../../css/u/reservations.css";

// scripts
const SET = require("../set");
const FORM = require("../form");
const { notifier, validateData, redirectFunc, formatDate } = require("../mods");

/**
 * new new reservation
 */
const _form = new FORM();
const newReservationBtn = SET.$('#newReservation');
const closeNewReservation = SET.$('#closeNewReservation');
const newReservationForm = SET.$('#newReservationForm');
const reservationImagesFileInput = newReservationForm.getElem('input[name=reservation_images]');
const submitBtns = newReservationForm.getElem('button[type=submit]', true);
const handleFileSelect = (e) => {
    if (!e.target.files || !e.target.files[0]) {
        return;
    }
    // val images file type
    if (([...e.target.files].filter(e => /^(image\/(jpeg|jpg|png))$/.test(e.type))).length !== e.target.files.length) {
        reservationImagesFileInput.value = null;
        return notifier('Only image file type is valid.','error');
    }
}
const handleNewReservationtDisplay = () => {
    const newReservationModal = SET.$('#newReservationModal');
    if (newReservationModal.style.display === 'none' || getComputedStyle(newReservationModal).display === 'none') {
        SET.fixClass(['body'],[['no-overflow']],[true]);
        newReservationModal.style.display = 'block';
        return;
    }
    SET.fixClass(['body'],[['no-overflow']],[false]);
    newReservationModal.style.display = 'none';
    _form.reset('#newReservationForm');
    handleSaveBtn(null);
}
const handleNewReservationForm = function(e) {
    e.preventDefault();
    newReservationForm.disableForm();
    notifier('Processing reservation upload...','default',null,'new_reservation_noti');
    let newReservationData = _form.assembleFormData('#newReservationForm','formData');
    SET.ajax({
        url: this.attr('action'),
        method: this.attr('method'),
        body: newReservationData,
        headers: {
            'Content-Type': false
        },
        handler: (res, err) => {
            notifier(null,null,null,'new_reservation_noti');
            newReservationForm.disableForm(false);
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                handleSaveBtn(null);
                _form.reset('#newReservationForm');
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
reservationImagesFileInput.on('change', handleFileSelect);
newReservationBtn.on('click', handleNewReservationtDisplay);
closeNewReservation.on('click', handleNewReservationtDisplay);
newReservationForm.on('change', handleSaveBtn);
newReservationForm.on("submit", handleNewReservationForm);

/**
 * fetch reservations
 */
const reservationsTable = SET.$('#reservationsList');
const reservationsTableBody = reservationsTable.getElem('tbody');
const reservationsLoader = (loadingInfo = 'Loading reservations, please wait...') => {
    if (!loadingInfo) {
        return SET.removeElem(reservationsTableBody.getElem('#loader'));
    }
    reservationsTable.getElem('tbody').appendElem(`<tr id="loader"><td colspan="12" style="text-align: center;">${loadingInfo}</td></td>`);
}
const fetchReservations = (start = null, limit = null, empty = true, cb = null, url = '/reservations/fetch') => {
    empty && reservationsTableBody.html();
    reservationsLoader();
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
            reservationsLoader(null);
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
                        reservationsTableBody.html('<tr><td colspan="12" style="text-align: center;">No reservations was found in the repository</td></tr>');
                    }
                } else {
                    reservations.forEach((eachData) => {
                        addToReservationsList(eachData);
                    });
                    if (more) {
                        reservationsTableBody.appendElem(`<tr class="r-item"><td colspan="12" style="text-align: center;"><a href="javascript:void(0);" id="more" style="text-decoration: underline; font-size: 14px;">More Reservations</a></td></tr>`);
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
const addToReservationsList = (data) => {
    let index = reservationsTableBody.getElem('.r-item') ? reservationsTableBody.getElem('.r-item', true).length + 1 : 1;
    const {
        id,
        reservation_title,
        reservation_images,
        reservation_location,
        reservation_cost,
        reservation_rating,
        reservation_desc,
        from_date,
        to_date,
        createdAt,
        status
    } = data;
    const reservationsRow = `<tr class="r-item ${JSON.parse(status) === 1 ? 'r-item__active' : 'r-item__inactive'}">
        <td>${index}.</td>
        <td>${id}</td>
        <td class="text-cap">${reservation_title}</td>
        <td>${reservation_location}</td>
        <td>${reservation_cost}</td>
        <td class="text-cap">${reservation_rating}</td>
        <td class="text-cap">${formatDate(from_date)}</td>
        <td class="text-cap">${formatDate(to_date)}</td>
        <td class="text-cap">${reservation_desc}</td>
        <td>${formatDate(createdAt)}</td>
        <td>
            <div class="m-t-5">
                <span class="status text-cap">${JSON.parse(status) === 1 ? 'active' : 'inactive'}</span>
            </div>
        </td>
        <td>
            <div class="flex flex-wrap align-c justify-c">
                <div style="padding: 2px;">
                    <button class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${id}" onclick="statusEvent(event);">
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
            </div>
        </td>
    </tr>`;
    reservationsTableBody.appendElem(reservationsRow);
}
window.statusEvent = (e) => {
    const el = e.currentTarget;
    const ID = el.attr('data-status');
    const parentElem = el.getParent('r-item');
    const isActive = parentElem.classList.contains('r-item__active');
    // impression
    if (isActive) {
        SET.fixClass([parentElem,parentElem],[['r-item__active'],['r-item__inactive']], [false,true]);
        parentElem.getElem('td span.status').html('inactive');
        el.attr('title', 'Enable');
    } else {
        SET.fixClass([parentElem,parentElem],[['r-item__active'],['r-item__inactive']], [true,false]);
        parentElem.getElem('td span.status').html('active');
        el.attr('title', 'Disable');
    }
    SET.ajax({
        method: 'PUT',
        url: `/reservations/status/${ID}`,
        headers: {
            'Content-Type': false
        },
        handler: (res, err) => {
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                return;
            }
            notifier('An error occurred processing request.','error');
        },
    })
}
const moreLoad = (start) => {
    const moreBtn = reservationsTableBody.getElem('#more');
    moreBtn.on('click', () => {
        SET.removeElem(moreBtn.getParent('r-item'));
        fetchReservations(start,null,false);
    })
}
window.on('DOMContentLoaded', () => {
    fetchReservations();
});
/**
 * search reservations
 */
SET.$('form#searchReservations').on('submit', e => {
    e.preventDefault();
    const searchInput = e.currentTarget.getElem('input[name=location]');
    const searchValue = searchInput.value;
    if (searchValue.trim().length > 0) {
        fetchReservations(null,null,true,null,`/reservations/filter?location=${searchValue}`);
    }
});

window.resetDescTemp = function(e) {
    let temp = {
        'general': [
            'Air Conditioned',
            'Refrigerator',
            'Microwave',
            'Hair Dryer'
        ],
        'activities': [
            'Swimming Pool',
            'Garden',
            'Microwave',
            'Pool Outdoor'
        ],
        'Internet': [
            'Free Wi-Fi',
            '4G Speed',
        ],
        'Services': [
            'Luggage Storage',
            'Self Laundry',
        ],
    };
    e.currentTarget.getParent('input-wrap').getElem('textarea[name=reservation_desc]').value = JSON.stringify(temp);
}