// general script
import "../auth";

// users style
import "../../css/u/users.css";

// scripts
const SET = require("../set");
const { notifier, validateData, redirectFunc, formatDate } = require("../mods");

/**
 * fetch users
 */
const usersTable = SET.$('#usersList');
const usersTableBody = usersTable.getElem('tbody');
const usersLoader = (loadingInfo = 'Loading users, please wait...') => {
    if (!loadingInfo) {
        return SET.removeElem(usersTableBody.getElem('#loader'));
    }
    usersTable.getElem('tbody').appendElem(`<tr id="loader"><td colspan="11" style="text-align: center;">${loadingInfo}</td></td>`);
}
const fetchUsers = (start = null, limit = null, empty = true, cb = null, url = '/users/fetch') => {
    empty && usersTableBody.html();
    usersLoader();
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
            usersLoader(null);
            if (err)
                return notifier(`${err.code ? err.code+': ' : ''}${err.msg}`,'error');
            const { error, errorMsg, data, force } = res;
            if (force) 
                return redirectFunc(force);
            if (error)
                return notifier(`${errorMsg}`,'error');
            if (data) {
                const {users, more} = data;
                if (users.length <= 0) {
                    if (!start) {
                        usersTableBody.html('<tr><td colspan="11" style="text-align: center;">No users was found in the repository</td></tr>');
                    }
                } else {
                    users.forEach((eachData) => {
                        addToUsersList(eachData);
                    });
                    if (more) {
                        usersTableBody.appendElem(`<tr class="r-item"><td colspan="11" style="text-align: center;"><a href="javascript:void(0);" id="more" style="text-decoration: underline; font-size: 14px;">More Users</a></td></tr>`);
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
const addToUsersList = (data) => {
    let index = usersTableBody.getElem('.r-item') ? usersTableBody.getElem('.r-item', true).length + 1 : 1;
    const {id,first_name,last_name,email,dob,gender,createdAt,status,rank} = data;
    const usersRow = `<tr class="r-item ${JSON.parse(status) === 1 ? 'r-item__active' : 'r-item__inactive'}">
        <td>${index}.</td>
        <td class="text-cap">${first_name}</td>
        <td class="text-cap">${last_name}</td>
        <td>${email}</td>
        <td>${dob}</td>
        <td class="text-cap">${gender}</td>
        <td>${formatDate(createdAt)}</td>
        <td>
            <div class="m-t-5">
                <span class="status text-cap">${JSON.parse(status) === 1 ? 'active' : 'inactive'}</span>
            </div>
        </td>
        <td>
            <div class="flex flex-wrap align-c justify-c">
                <div style="padding: 2px;">
                    <button title="${rank === 'user' ? (JSON.parse(status) === 1 ? 'Disable' : 'Enable') : ''}" class="btn icon stroke text-cap" style="font-size: 12px; padding: 2px 4px;" data-status="${id}" onclick="statusEvent(event);"${rank === 'admin' ? ' disabled' : ''}>
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
    usersTableBody.appendElem(usersRow);
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
        url: `/users/status/${ID}`,
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
    const moreBtn = usersTableBody.getElem('#more');
    moreBtn.on('click', () => {
        SET.removeElem(moreBtn.getParent('r-item'));
        fetchUsers(start,null,false);
    })
}
window.on('DOMContentLoaded', () => {
    fetchUsers();
});
/**
 * search users
 */
SET.$('form#searchUsers').on('submit', e => {
    e.preventDefault();
    const searchInput = e.currentTarget.getElem('input[name=q]');
    const searchValue = searchInput.value;
    if (searchValue.trim().length > 0) {
        fetchUsers(null,null,true,null,`/users/search?q=${searchValue}`);
    }
});