const DbInstance = require("../DB/db_connection");
const { DataTypes, QueryTypes } = require("sequelize");
const moment = require("moment");

const ReservationsModel = DbInstance.define(
    "reservations",
    {
        id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
        },
        reservation_images: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reservation_title: {
			type: DataTypes.STRING,
			allowNull: false,
            validate: {
				function(value) {
					if (value.toString().trim() <= 0)
						throw new Error(`Please enter a valid reservation title.`);
				},
			},
		},
        reservation_location: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        reservation_cost: {
			type: DataTypes.STRING,
			allowNull: false,
		},
        reservation_rating: {
			type: DataTypes.STRING,
			allowNull: false,
            validate: {
				function(value) {
					if (!(/^[1-5]$/.test(value.toString().trim()))) {
						throw new Error(`Reservation rating can only be either one of 1,2,3,4 or 5.`);
                    }
				},
			},
		},
        from_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
        to_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
        reservation_desc: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
        status: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		}
    }
);

ReservationsModel.validReservation = async (reservation) => {
    let validReservation = await ReservationsModel.findOne({where: reservation});
    return validReservation ? validReservation : null;
};

ReservationsModel.addReservation = async ({
    reservation_images, 
    reservation_title, 
    reservation_location,
    reservation_cost,
    reservation_rating,
    from_date = null,
    to_date = null,
    reservation_desc
}) => {
    if (
        await ReservationsModel.create({
            reservation_images, 
            reservation_title: reservation_title.toString().toLowerCase(), 
            reservation_location,
            reservation_cost,
            reservation_rating,
            from_date,
            to_date,
            reservation_desc
        })
    ) 
    {
        return true;
    }
    return null;
};

ReservationsModel.getReservations = async (start, limit, filter = null) => {
    // set filter
    let setTarget = start ? ` WHERE id < ${start} ` : ` `;
    let setLimit = limit ? ` LIMIT ${limit}` : ``;
    setTarget += (filter ? (start ? ` AND ` : ` WHERE `)+Object.keys(filter).map(e => `${e}=${filter[e]}`).join(' AND ')+` ` : ``);
    // run query
	return await DbInstance.query(
		`SELECT * FROM reservations${setTarget}ORDER BY id DESC${setLimit}`,
		{
			type: QueryTypes.SELECT,
		}
	);
};

ReservationsModel.searchReservations = async (location, from_date, to_date, limit, filter = null) => {
    // set filter
    let setFilter = filter ? ` AND ${Object.keys(filter).map(e => `${e}=${filter[e]}`).join(' AND ')} ` : ` `;
    // sql statement
    let stmt = `SELECT * FROM reservations WHERE (`;
    let stmtParams = {};
    if (location) {
        stmt += `reservation_location LIKE :loc OR reservation_title LIKE :loc`;
        stmtParams['loc'] = `%${location}%`;
    }
    if (from_date) {
        stmt += ` OR from_date LIKE :fdt`;
        stmtParams['fdt'] = `%${from_date}%`;
    }
    if (to_date) {
        stmt += ` OR to_date LIKE :tdt`;
        stmtParams['tdt'] = `%${to_date}%`;
    }
    stmt += `)`;
    return await DbInstance.query(
		`${stmt}${setFilter}ORDER BY id DESC LIMIT ${limit}`,
		{
            replacements: stmtParams,
			type: QueryTypes.SELECT,
		}
	);
};

ReservationsModel.updateReservationStatus = async (id) => {
    const validReservation = await ReservationsModel.validReservation({id});
    if (!validReservation) {
        throw new Error('Reservation not found.');
    }
    return await ReservationsModel.update(
        {status: !validReservation.status},
        {where: {id}}
    );
}

ReservationsModel.deleteReservation = async (id) => {
    const validId = await ReservationsModel.validReservation({id});
    if (!validId) {
        throw new Error('Reservation does not exists.');
    }
    return await ReservationsModel.destroy({where: {id}}) ? validId : null;
}

ReservationsModel.sync({force: false})
    .then(() => {})
    .catch(e => console.log(`reservations Model Error: `, e));

module.exports = ReservationsModel;