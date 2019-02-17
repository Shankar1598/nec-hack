const mongoose = require('mongoose');
const schema = mongoose.Schema;

const bookModel = new schema({
	bookInfo: {
		bookedUser: {
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'UserInfo',
			},
			username: String,
		},
		startTimestamp: String,
		endTimeStamp: String,
		startLocation: { lat: String, long: String },
		endLocation: { lat: String, long: String },
		decision: Boolean,
		phoneNo: String,
		acceptedDriver: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverInfo' },
			username: String,
		},
		rideCompleted: false,
	},
});

module.exports = mongoose.model('bookInfo', bookModel);
