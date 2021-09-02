const express = require("express");
const Route = express.Router();

const {UsersModel, valUserCallBack} = require("../model/users.model");

const { setLogin, logout, valAuth, formatUrl, rdr, valLoginActive, jsonRes, errHandler, validateData, valAuthOptional, calcCost } = require("../helper/utilities");

const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const CronJob = require("cron").CronJob;

const nodeMailer = require("nodemailer");
const ReservationsModel = require("../model/reservation.model");
const UserBookingsModel = require("../model/user.bookings.model");


// ===> Cron Dealings <===

/**
 * cron to check if uncompleted booking exists before starting base cron
 */
// const CheckIfUncompletedBookingExists = new CronJob(
//     `*/${process.env.CRON_INTERVAL} * * * *`, 
//     async function() {
//         let hasUncompletedBooking = await UserEventsModel.getUserEvents(null, 1, {status: true, event_completed: false});
//         if (hasUncompletedBooking.length > 0) {
//             processUmcompletedBookings();
//         }
//         console.log('Ran cron');
//     }, 
//     null, 
//     false, 
//     'Africa/Lagos',
// );
// CheckIfUncompletedBookingExists.start();

// async function processUmcompletedBookings() {
//     console.log('Processing cron job');
//     // get uncompleted bookings
//     let uncompletedBooking = await UserEventsModel.getUserEvents(null, null, {status: true, event_completed: false});
//     // loop
//     [...uncompletedBooking].forEach(async (eachBooking) => {
//         let isDueForNotification = (new Date(eachBooking.event_date).getTime() - new Date().getTime()) <= (5 * 60 * 60 * 1000);
//         if (isDueForNotification) {
//             let { id, event_name, event_date, event_location, event_desc, user, user_notified } = eachBooking;
//             let { first_name, email } = await UsersModel.validUser({id: user});
//             if (user_notified == 1 && (new Date(eachBooking.event_date).getTime() - new Date().getTime()) <= 0) {
//                 UserEventsModel.update(
//                     {
//                         event_completed: true,
//                     },
//                     {
//                         where: {id: id}
//                     }
//                 );
//             } else {
//                 let message = {
//                     from: "<noreply.notifier@novotel.com>",
//                     to: email,
//                     replyTo: 'noreply.notifier@novotel.com',
//                     text: `Hello ${first_name},\nYour bookingd event is almost due.\n\nEvent name: ${event_name}\nEvent Location: ${event_location}\nEvent date: ${event_date}\nEvent description: ${event_desc}\n\nThanks.`,
//                 };
//                 if (mailer(message)) {
//                     UserEventsModel.update(
//                         {
//                             user_notified: true,
//                             event_completed: (new Date(eachBooking.event_date).getTime() - new Date().getTime()) <= 0 ? true : false
//                         },
//                         {
//                             where: {id: id}
//                         }
//                     );
//                 }
//             }
//         }
//     });
// }

async function mailer(message) {
    try {
		// define transporter
		const transporter = nodeMailer.createTransport({
			pool: true,
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: false,
			auth: {
				user: process.env.MAIL_USERNAME,
				pass: process.env.MAIL_PASSWORD
			},
			tls: {
				// do not fail on invalid certs
				rejectUnauthorized: false
			}
		});
        // send mail
        await transporter.sendMail(message);
	} catch (error) {
		console.log(error);
	}
}



// ===> Route Dealings <===

// resource upload path
const resourceUploadPath = path.join(__dirname, '..', '/public/assets/uploads/reservations');

/**
 * upload handlers
 */
const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)/)) {
            return cb(new Error('Only jpeg or jpg or png file type is valid.'));
        }
        cb(null, `${resourceUploadPath}`);
    },
    filename(req, file, cb) {
        cb(null,`${crypto.createHash('md5').update(`${Date.now()}`).digest('hex')}.${file.mimetype.split('/')[1]}`);
    },
});
const upload = multer({storage}).array("reservation_images", 5);

/**
 * landing page route
 */
Route.get('/', valAuthOptional, async (req, res) => {
    let userData = null;
    if (res.locals.user) {
        userData = await UsersModel.validUser({id: res.locals.user});
    }
    res.render('home.ejs', {path: '/', userData});
});

/**
 * Login route
 */
Route.use('/login', valLoginActive, async (req, res) => {
    const urlParams = formatUrl(req.originalUrl);
    if (req.method === 'POST') {
        let notification = {msg: 'Login failed, please try again.', type: 'error'};
        try {
            const {dst = '/myBooking'} = req.query;
            const {email = null, password = null} = req.body;
            const valData = await UsersModel.verifyLogin(email, password);
            if (valData) {
                if (valData.status === true) {
                    await setLogin(res, {user: valData.id});
                    return rdr(req, res, decodeURI(dst));
                }
                notification = {msg: 'Your account has been disabled for violation our terms. Contact our support team for more details.', type: 'error'}
            } else {
                notification = {msg: 'Incorrect login credentials.', type: 'error'}
            }
        } catch (error) {
            let errMsg = errHandler(error, 'Login failed, please try again.');
            notification = {msg: errMsg, type: 'error'}
        }
        return res.render(
            'login.ejs', 
            {
                notification,
                formData: req.body,
                urlParams
            }
        );
    }
    res.render('login.ejs', {urlParams});
});

/**
 * signup route
 */
Route.use('/signup', valLoginActive, async (req, res) => {
    const urlParams = formatUrl(req.originalUrl);
    if (req.method === 'POST') {
        let notification = {msg: 'Signup failed, please try again.', type: 'error'};
        try {
            const {dst = '/myBooking'} = req.query;
            let {
                first_name = null, 
                last_name = null, 
                dob = null, 
                gender = null, 
                email = null, 
                password = null
            } = req.body;
            // trim
            first_name = first_name.trim();
            last_name = last_name.trim();
            dob = dob.trim();
            gender = gender.trim();
            email = email.trim();
            // add new user
            const addNewUser = await UsersModel.addUser({first_name, last_name, dob, gender, email, password});
            if (addNewUser) {
                await setLogin(res, {user: addNewUser.id});
                return rdr(req, res, decodeURI(dst));
            }
        } catch (error) {
            let errMsg = errHandler(error, 'Signup failed, please try again.');
            notification = {msg: errMsg, type: 'error'}
        }
        return res.render(
            'signup.ejs', 
            {
                notification,
                formData: req.body,
                urlParams
            }
        );
    }
    res.render('signup.ejs', {urlParams});
});

/**
 *  setting route
 */
Route.get('/setting', valAuth, valUserCallBack, async (req, res) => {
    res.render('setting.ejs', {path: '/setting', userData: res.locals.user});
});

/**
 * route to edit account
 */
Route.post('/s/account', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { first_name = null, last_name = null, email = null, dob = null, gender = null } = req.body;
        if (!(first_name) || !(last_name) || !(email) || !(dob) || !(gender)) {
            throw new Error("All fields are required.");
        }
        const editAccount = await UsersModel.update(
            {
                first_name, 
                last_name, 
                dob, 
                gender, 
                email
            },
            {
                where: {id: res.locals.user.id}
            }
        );
        if (!editAccount) {
            throw new Error('Account update failed, try again.');
        }
        res.json(jsonRes({data: 'Your account data has been updated.'}))
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to change password
 */
Route.post('/s/password', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { current_password = null, new_password = null } = req.body;
        if (!(current_password) || !(new_password)) {
            throw new Error('All fields are required.');
        }
        if (!(await UsersModel.verifyPassword(current_password, res.locals.user.password))) {
            throw new Error('Current password is incorrect.');
        }
        if (current_password === new_password) {
            throw new Error('New password must be different from current password.')
        }
        const changePassword = await UsersModel.update(
            {password: new_password},
            {where: {id: res.locals.user.id}}
        );
        if (!changePassword) {
            throw new Error('Password change failed, try again');
        }
        res.json(jsonRes({data: 'Your password has been changed.'}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 *  setting route
 */
Route.get('/users', valAuth, valUserCallBack, async (req, res) => {
    res.render('users.ejs', {path: '/users', userData: res.locals.user});
});

/**
 * route to fetch users
 */
Route.get('/users/fetch', valAuth, valUserCallBack, async (req, res) => {
    try {
        let {s = null, l = 50} = req.query;
        if (s && !(validateData(s, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        if (!(validateData(l, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        // get users
        let users = await UsersModel.getUsers(s, (l + 1));
        let more = null;
        if (users.length > l) {
            more = users[users.length - 2].id;
            users.pop();
        }
        res.json(jsonRes({data: {users, more}}));
    } catch (error) {
        let errMsg = errHandler(error,'Users cannot be retrieved at this time, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to search users
 */
Route.get('/users/search', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { q = null, l = 50 } = req.query;
        if (!q) {
            throw new Error('No search query passed in request.')
        }
        // search
        const users = await UsersModel.searchUsers(q,l);
        res.json(jsonRes({data: {users, more: null}}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to enable or disable a user
 */
Route.put('/users/status/:id', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { id } = req.params;
        if (parseInt(id) === res.locals.user.id) {
            throw new Error('Admin account status cannot be altered.');
        }
        const update = await UsersModel.updateUserStatus(id);
        if (!update) {
            throw new Error('User update failed, try again.');
        }
        res.json(jsonRes({data: 'User updated.'}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 *  reservation route
 */
Route.get('/reservations', valAuth, valUserCallBack, async (req, res) => {
    res.render('reservations.ejs', {path: '/reservations', userData: res.locals.user});
});

/**
 * route to fetch reservations
 */
Route.get('/reservations/fetch', valAuthOptional, async (req, res) => {
    try {
        let {s = null, l = 50,  e = null} = req.query;
        if (s && !(validateData(s, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        if (!(validateData(l, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        // define user filter
        let isUser = true;
        if (res.locals.user) {
            isUser = res.locals.user.rank !== 'admin';
        }
        (isUser || (e && JSON.parse(e) === 1)) && (l = 20);
        const filter = isUser ? {status: true} : (e && JSON.parse(e) === 1 ? {status: true} : null );
        // get reservations
        let reservations = await ReservationsModel.getReservations(s, (l + 1), filter);
        let more = null;
        if (reservations.length > l) {
            more = reservations[reservations.length - 2].id;
            reservations.pop();
        }
        res.json(jsonRes({data: {reservations, more}}));
    } catch (error) {
        let errMsg = errHandler(error,'Users cannot be retrieved at this time, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to filter reservations
 */
Route.get('/reservations/filter', valAuthOptional, async (req, res) => {
    try {
        let { location = null, from_date = null, to_date = null, l = 50, e = null } = req.query;
        if (!location && !from_date && !to_date) {
            throw new Error('You have not entered any search keyword.')
        }
        // define user filter
        // define user filter
        let isUser = true;
        if (res.locals.user) {
            isUser = res.locals.user.rank !== 'admin';
        }
        (isUser || (e && JSON.parse(e) === 1)) && (l = 20);
        const filter = isUser ? {status: true} : (e && JSON.parse(e) === 1 ? {status: true} : null );
        // search
        const reservations = await ReservationsModel.searchReservations(location,from_date,to_date,l,filter);
        res.json(jsonRes({data: {reservations, more: null}}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to enable or disable a user
 */
Route.put('/reservations/status/:id', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { id } = req.params;
        const update = await ReservationsModel.updateReservationStatus(id);
        if (!update) {
            throw new Error('Reservation update failed, try again.');
        }
        res.json(jsonRes({data: 'Reservation updated.'}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to add reservation
 */
Route.post('/reservations/new', valAuth, valUserCallBack, upload, async (req, res) => {
    try {
        if (!req.files || req.files.length <= 0) {
            throw new Error('Reservation image(s) are required.');
        }
        if (req.fileValidationError) {
            throw new Error(req.fileValidationError);
        }
        let reservation_images = [...req.files].map(eachImage => eachImage.filename).join(',');
        let { 
            reservation_title = null, 
            reservation_location = null, 
            reservation_cost = null, 
            reservation_rating = null, 
            from_date = null, 
            to_date = null,
            reservation_desc = null
        } = req.body;
        if (
            !(reservation_images.toString().trim().length > 0) 
            || 
            !reservation_title 
            || 
            !reservation_location 
            || 
            !reservation_cost
            ||
            !reservation_rating
            ||
            !reservation_desc
        ) {
            throw new Error('Please fill all required fields.');
        }
        let reservationData = {
            reservation_images, 
            reservation_title, 
            reservation_location, 
            reservation_cost, 
            reservation_rating,
            reservation_desc
        }
        from_date && (reservationData['from_date'] = from_date);
        to_date && (reservationData['to_date'] = to_date);
        // store in db
        if (!await ReservationsModel.addReservation(reservationData)) 
        {
            throw new Error('Reservation cannot be created at this time, try again later.');
        }
        res.json(jsonRes({data: 'New reservation has been created.'}));
    } catch (error) {
        let errMsg = errHandler(error,'Reservation cannot be created at this time, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * user booking route
 */
Route.get('/myBooking', valAuth, valUserCallBack, async (req, res) => {
    res.render('my_booking.ejs', {path: '/myBooking', userData: res.locals.user});
});

/**
 * user booking route
 */
Route.get('/bookings', valAuth, valUserCallBack, async (req, res) => {
    res.render('bookings.ejs', {path: '/bookings', userData: res.locals.user});
});

/**
 * booking route
 */
Route.post('/bookings/new', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { 
            from_date = null,
            reservation_cost = null,
            reservation_cost_new = null,
            reservation_id = null,
            to_date = null,
            user = null,
            user_fullname = null,
            user_email = null,
            a = null,
        } = req.body;
        if (!from_date || !reservation_id || !to_date) {
            throw new Error('Missing parameter in request, refresh and try again.');
        }
        // val reservation_id
        const reservation = await ReservationsModel.validReservation({id: reservation_id});
        if (!reservation) {
            throw new Error('This reservation is no longer available, refresh and try again.');
        }
        // vali isUser
        const isUser = res.locals.user.rank !== 'admin';
        if (isUser || (a && (1 === parseInt(a)) && (res.locals.user.rank === 'admin'))) {
            user = res.locals.user.id;
            user_fullname = `${res.locals.user.first_name} ${res.locals.user.last_name}`;
            user_email = res.locals.user.email;
        }
        // booking cost
        let booking_cost = calcCost(from_date,to_date,reservation.reservation_cost);
        // add booking
        const addBooking = await UserBookingsModel.addBooking({
            reservation_id,
            user,
            user_fullname,
            user_email,
            booking_from: from_date,
            booking_to: to_date,
            booking_cost,
            reservation_images: reservation.reservation_images,
            reservation_title: reservation.reservation_title,
            reservation_location: reservation.reservation_location,
        });
        if (!addBooking) {
            throw new Error('Booking cannot be processed at this time, try again later.');
        }
        res.json(jsonRes({data: 'You have successfully booked a reservation. Payment will be required before checking in.'}));
    } catch (error) {
        console.log(error);
        let errMsg = errHandler(error,'Booking cannot be created at this time, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to fetch bookings
 */
Route.get('/bookings/fetch', valAuth, valUserCallBack, async (req, res) => {
    try {
        let {s = null, l = 50,  e = null} = req.query;
        if (s && !(validateData(s, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        if (!(validateData(l, /^([\d]+)$/))) {
            throw new Error('Invalid filter parameter, refresh and try again.')
        }
        // define user filter
        const isAdmin = res.locals.user.rank === 'admin';
        let filter = isAdmin && (e && JSON.parse(e) === 1) ? null : {status: true, user: res.locals.user.id};
        // get bookings
        let bookings = await UserBookingsModel.getBookings(s, (l + 1), filter);
        let more = null;
        if (bookings.length > l) {
            more = bookings[bookings.length - 2].id;
            bookings.pop();
        }
        res.json(jsonRes({data: {bookings, more}}));
    } catch (error) {
        let errMsg = errHandler(error,'Users cannot be retrieved at this time, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to filter bookings
 */
Route.get('/bookings/filter', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { q = null, l = 50, e = null } = req.query;
        if (!q) {
            throw new Error('You have not entered any search keyword.')
        }
        // define user filter
        const isUser = res.locals.user.rank !== 'admin';
        (isUser || (e && JSON.parse(e) === 1)) && (l = 20);
        const filter = isUser ? {status: true} : (e && JSON.parse(e) === 1 ? {status: true} : null );
        // search
        const bookings = await UserBookingsModel.searchBookings(q,l,filter);
        res.json(jsonRes({data: {bookings, more: null}}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to update bookings
 */
Route.get('/bookings/update/:reference_number/:target/:value', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { target = null, reference_number = null, value = null } = req.params;
        if (!target || !reference_number || !value) {
            throw new Error('Missing parameter in request, try again.');
        }
        // update
        if (!(await UserBookingsModel.updateBooking(reference_number, target, value))) {
            throw new Error('Booking update request failed, try again later.');
        }
        res.json(jsonRes({data: 'Booking updated.'}));
    } catch (error) {
        let errMsg = errHandler(error,'Unable to process request, try again.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * route to cancel booking
 */
Route.delete('/bookings/delete/:reference_number', valAuth, valUserCallBack, async (req, res) => {
    try {
        let { reference_number } = req.params;
        const del = await UserBookingsModel.deleteBooking(reference_number);
        if (!del) {
            throw new Error('Booking cancel request failed, try again later.');
        }
        res.json(jsonRes({data: 'Booking cancelled.'}));
    } catch (error) {
        let errMsg = errHandler(error,'An error occurred cancelling booking, try again later.');
        res.json(jsonRes({error: true, errorMsg: errMsg}));
    }
});

/**
 * logout route
 */
Route.get('/logout', (req, res) => {
    return logout(req, res);
});

module.exports = Route;