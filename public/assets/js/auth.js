// css
import "../css/animate.css";
import "../css/base.css";
import "../css/form.css";
import "../css/main.css";

// modules
const {
	valDeviceType,
	dropDownView,
	eventPropagator,
    navBarEffect,
    redirectFunc,
} = require("./mods");

// scripts
const SET = require("./set");

// val device type
valDeviceType();

// handle scroll effect on navbar
navBarEffect();

/**
 * function handle seen notification
 */
const seenNotiEvent = () => {
    const handleSeenNoti = (e) => {
        const notiBtn = e.currentTarget;
        const parentWrap = notiBtn.getParent("noti__item");
        const notiId = parentWrap.attr("data-ref");
        // set seen impression
        SET.fixClass([parentWrap], [["seen"]], [true]);
        SET.ajax({
            url: `/l/update/notification?ref_id=${notiId}`,
            method: "GET",
            timeOut: 30,
            headers: {
                "csrf-token": SET.$("meta[name=csrf-token]").attr("content"),
                "Content-Type": false,
            },
            handler(res, err) {
                if (err) return notifier(`${err.code}: ${err.msg}`, "error");
                const { error, errorMsg, data, force } = res;
                if (force) return redirectFunc(force);
                if (error) {
                    // unset seen impression
                    SET.fixClass([parentWrap], [["seen"]], [false]);
                    return notifier(`${errorMsg}`, "error");
                }
                if (data) {
                    return;
                }
                // unset seen impression
                SET.fixClass([parentWrap], [["seen"]], [false]);
                notifier("An error occurred processing request.", "error");
            }
        });
    };
    const seenNotiBtns = SET.$(".nav-bar__noti .noti__seen-btn", true);
    seenNotiBtns.forEach((eachBtn) => {
        eachBtn.off("click", handleSeenNoti);
    });
    seenNotiBtns.forEach((eachBtn) => {
        eachBtn.on("click", handleSeenNoti);
    });
}

/**
 * function handle delete notification
 */
const deleteNotiEvent = () => {
    const handleDelNoti = (e) => {
        const notiBtn = e.currentTarget;
        const parentWrap = notiBtn.getParent("noti__item");
        const notiId = parentWrap.attr("data-ref");
        // set seen impression
        SET.removeElem(parentWrap);
        SET.ajax({
            url: `/l/update/delNotification?ref_id=${notiId}`,
            method: "GET",
            timeOut: 30,
            headers: {
                "csrf-token": SET.$("meta[name=csrf-token]").attr("content"),
                "Content-Type": false,
            },
            handler(res, err) {
                if (err) return notifier(`${err.code}: ${err.msg}`, "error");
                const { error, errorMsg, data, force } = res;
                if (force) return redirectFunc(force);
                if (error) return notifier(`${errorMsg}`, "error");
                if (data) {
                    return;
                }
                notifier("An error occurred processing request.", "error");
            },
        });
    };
    const delNotiBtns = SET.$(".nav-bar__noti .noti__del-btn", true);
    delNotiBtns.forEach((eachBtn) => {
        eachBtn.off("click", handleDelNoti);
    });
    delNotiBtns.forEach((eachBtn) => {
        eachBtn.on("click", handleDelNoti);
    });
}

/**
 * functo to handle more notification load
 */
const loadMoreNotiEvent = () => {
    const handleMoreNoti = (e) => {
        const moreBtn = e.currentTarget;
        const parentWrap = moreBtn.getParent("noti__item");
        const lastNotiId = parentWrap.attr("data-ref-last");
        // set load impression
        moreBtn.html('...');
        moreBtn.attr("disabled", true);
        SET.ajax({
            url: `/l/fetch/notification?last_ref_id=${lastNotiId}`,
            method: "GET",
            timeOut: 30,
            headers: {
                "csrf-token": SET.$("meta[name=csrf-token]").attr("content"),
                "Content-Type": false,
            },
            handler(res, err) {
                // unset impression
                moreBtn.html('more');
                moreBtn.attr("disabled", false);
                if (err) return notifier(`${err.code}: ${err.msg}`, "error");
                const { error, errorMsg, data, force } = res;
                if (force) return redirectFunc(force);
                if (error) return notifier(`${errorMsg}`, "error");
                if (data) {
                    // remove more button
                    SET.removeElem(parentWrap);
                    const { notifications, last, more } = data;
                    if (notifications.length > 0) {
                        notifications.forEach((eachNoti) => {
                            let { id, title, info, seen, createdAt } = eachNoti;
                            SET.$(".nav-bar__noti").appendElem(
                                `<li class="noti__item${
                                    seen === "1" ? " seen" : ""
                                }" data-ref="${id}">
                                <div class="p-lr-10 p-tb-5 f-12">
                                    <div class="flex align-c" style="padding-bottom: 5px;">
                                        <div class="noti__item-title f-12 f-w-6 text-cap">${title}</div>
                                        <button class="noti__seen-btn icon stroke" title="Mark as seen">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                <circle cx="12" cy="12" r="2"></circle>
                                                <path d="M12 19c-4 0 -7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7c-.42 .736 -.858 1.414 -1.311 2.033"></path>
                                                <path d="M15 19l2 2l4 -4"></path>
                                            </svg>
                                        </button>
                                        <button class="noti__del-btn icon stroke" title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                <line x1="4" y1="7" x2="20" y2="7"></line>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                                                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <p class="text-break">${info}</p>
                                    <div class="f-10 text-mute text-r m-t-5">${createdAt}</div>
                                </div>
                            </li>`
                            );
                        });
                        more &&
                            SET.$(".nav-bar__noti").appendElem(
                                `<li class="noti__item flex justify-c p-5" data-ref-last="${last}" style="background-color: var(--light-bg-color);"><button id="more__noti" class="btn primary text-cap">More</button></li>`
                            );
                        // activate see notification
                        seenNotiEvent();
                        // activate delete notification
                        deleteNotiEvent();
                        // activate more notification
                        loadMoreNotiEvent();
                    }
                } else {
                    notifier("An error occurred processing request.", "error");
                }
            },
        });
    };
    const moreNotiBtns = SET.$(".nav-bar__noti #more__noti");
    if (moreNotiBtns) {
        moreNotiBtns.off("click", handleMoreNoti);
        moreNotiBtns.on("click", handleMoreNoti);
    }
}
// activate see notification
seenNotiEvent();
// activate delete notification
deleteNotiEvent();
// activate more notification
loadMoreNotiEvent();
/**
 * handle manipulate sidebar view
 */
const sideBarView = () => {
    const sideBar = SET.$("#sideBar");
	if (sideBar.classList.contains("active")) {
		SET.removeElem("#sideBarOverlay");
		SET.fixClass([sideBar], [['active']], [false]);
		SET.fixClass(['body'],[['no-overflow']],[false]);
		return;
	}
	document.body.appendElem('<div id="sideBarOverlay" class="overlay"></div>');
	SET.fixClass([sideBar], [['active']], [true]);
    SET.fixClass(['body'],[['no-overflow']],[true]);
	SET.$("#sideBarOverlay").on("click", sideBarView, {once: true});
}
SET.$(".nav-bar__ctrl .toggle-menu").on("click", sideBarView);
// handle dropdown
// SET.$("[data-dropdown=true]", true).forEach((eachDropDown) => {
// 	eachDropDown.on("click", (e) => {
// 		eventPropagator(e);
// 		// watch for noti-indicator
// 		if (e.currentTarget.classList.contains("noti-indicator")) {
// 			SET.fixClass([e.currentTarget], [["noti-indicator"]], [false]);
// 		}
// 		if (
// 			SET.$('.drop-down[aria-hidden="false"]') &&
// 			!e.currentTarget.getSibling(null, '.drop-down[aria-hidden="false"]')
// 		) {
// 			dropDownView(e);
// 		}
// 		dropDownView(
// 			e,
// 			e.currentTarget.getSibling(null, ".drop-down[aria-hidden]")
// 		);
// 	});
// });

window.dropDown = function(e) {
    eventPropagator(e);
    // watch for noti-indicator
    if (e.currentTarget.classList.contains("noti-indicator")) {
        SET.fixClass([e.currentTarget], [["noti-indicator"]], [false]);
    }
    if (
        SET.$('.drop-down[aria-hidden="false"]') &&
        !e.currentTarget.getSibling(null, '.drop-down[aria-hidden="false"]')
    ) {
        dropDownView(e);
    }
    dropDownView(
        e,
        e.currentTarget.getSibling(null, ".drop-down[aria-hidden]")
    );
};
