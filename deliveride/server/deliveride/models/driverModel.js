const mongoose = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const driverModel = new schema({
	username: { type: String },
	password: { type: String },
	profileBio: {
		name: String,
		address: String,
		phoneNo: String,
	},
	Requests: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'bookInfo',
		},
	],
	location: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'locationInfo',
	},
	socketId: String,
});

driverModel.plugin(passportLocalMongoose);

module.exports = mongoose.model('DriverInfo', driverModel);
