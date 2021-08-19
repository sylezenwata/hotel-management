const DbInstance = require("../DB/db_connection");
const { DataTypes, QueryTypes } = require("sequelize");
const moment = require("moment");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet('ABCDEFGHIJKLMNPQRSTUVWXYZ123456789', 8);

const UserBookingsModel = DbInstance.define(
    "user_bookings",
    {
        id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
        },
        reservation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reservation_images: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reservation_title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        reservation_location: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        user: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        user_fullname: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        user_email: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isEmail: {
					args: true,
					msg: "Please enter a valid email to proceed.",
				},
			},
		},
        booking_from: {
			type: DataTypes.DATE,
			allowNull: false,
		},
        booking_to: {
			type: DataTypes.DATE,
			allowNull: false,
		},
        booking_cost: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        formatted_booking_from: {
            type: DataTypes.STRING,
        },
        formatted_booking_to: {
            type: DataTypes.STRING,
        },
        reference_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        made_payment: {
			type: DataTypes.BOOLEAN,
            defaultValue: false,
		},
        is_checked_in: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_checked_out: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_temporary: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        status: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		}
    },
    {
        hooks: {
            afterValidate: async (accountInstance) => {
                try {
                    let { booking_from, booking_to } = accountInstance;
                    accountInstance.formatted_booking_from = moment(booking_from).format('llll');
                    accountInstance.formatted_booking_to = moment(booking_to).format('llll');
                } catch (error) {
                    console.log(`Format date:`, error);
                    throw error;
                }
            }
        }
    }
);

UserBookingsModel.validBooking = async (booking) => {
    let validBooking = await UserBookingsModel.findOne({where: booking});
    return validBooking ? validBooking : null;
};

UserBookingsModel.addBooking = async ({
    reservation_id,
    user,
    user_fullname,
    user_email,
    booking_from,
    booking_to,
    booking_cost,
    reservation_images,
    reservation_title,
    reservation_location,
}) => {
    if (
        await UserBookingsModel.create({
            reservation_id,
            user,
            user_fullname: user_fullname.toString().toLowerCase(),
            user_email: user_email.toString().toLowerCase(),
            booking_from,
            booking_to,
            booking_cost,
            reservation_images,
            reservation_title,
            reservation_location,
        })
    ) 
    {
        // update reference_number
        let justCreatedBooking = await UserBookingsModel.validBooking({
            reservation_id,
            user,
            user_fullname: user_fullname.toString().toLowerCase(),
            user_email: user_email.toString().toLowerCase(),
            booking_from,
            booking_to,
            booking_cost,
            reservation_images,
            reservation_title,
            reservation_location,
        });
        const { id } = justCreatedBooking;
        const reference_number = nanoid()+`${id}`;
        await UserBookingsModel.update(
            { reference_number },
            { where: { id } }
        );
        return reference_number;
    }
    return null;
};

UserBookingsModel.getBookings = async (start, limit, filter = null) => {
    // set filter
    let setTarget = start ? ` WHERE id < ${start} ` : ` `;
    let setLimit = limit ? ` LIMIT ${limit}` : ``;
    setTarget += (filter ? (start ? ` AND ` : ` WHERE `)+Object.keys(filter).map(e => `${e}=${filter[e]}`).join(' AND ')+` ` : ``);
    // run query
	return await DbInstance.query(
		`SELECT * FROM user_bookings${setTarget}ORDER BY id DESC${setLimit}`,
		{
			type: QueryTypes.SELECT,
		}
	);
};

UserBookingsModel.searchBookings = async (query, limit, filter = null) => {
    // set filter
    let setFilter = filter ? ` AND ${Object.keys(filter).map(e => `${e}=${filter[e]}`).join(' AND ')} ` : ` `;
    return await DbInstance.query(
		`SELECT * FROM user_bookings WHERE (reference_number LIKE :qry OR reservation_location LIKE :qry OR booking_from LIKE :qry OR booking_to LIKE :qry OR formatted_booking_from LIKE :qry OR formatted_booking_to LIKE :qry)${setFilter}ORDER BY id DESC LIMIT ${limit}`,
		{
            replacements: {qry: `%${query}%`},
			type: QueryTypes.SELECT,
		}
	);
};

UserBookingsModel.updateBooking = async (reference_number, target, value) => {
    const validBooking = await UserBookingsModel.validBooking({reference_number});
    if (!validBooking) {
        throw new Error('Booking not found.');
    }
    let setTarget = {};
    setTarget[target] = value;
    return await UserBookingsModel.update(
        setTarget,
        {where: {reference_number}}
    );
}

UserBookingsModel.deleteBooking = async (reference_number) => {
    const validReferenceNumber = await UserBookingsModel.validBooking({reference_number});
    if (!validReferenceNumber) {
        throw new Error('Booking does not exists.');
    }
    return await UserBookingsModel.destroy({where: {reference_number}}) ? validReferenceNumber : null;
}

UserBookingsModel.sync({force: false})
    .then(() => {})
    .catch(e => console.log(`user_bookings Model Error: `, e));

module.exports = UserBookingsModel;