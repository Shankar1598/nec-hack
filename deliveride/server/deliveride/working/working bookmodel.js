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
		date: String,
		machineryName: String,
		phoneNo: String,
		address: String,
		Acre: String,
		decision: Boolean,
		acceptedDriver: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverInfo' },
			username: String,
		},
	},
});

module.exports = mongoose.model('bookInfo', bookModel);
