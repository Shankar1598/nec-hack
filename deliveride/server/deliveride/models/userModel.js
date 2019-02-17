const mongoose = require('mongoose');
const schema = mongoose.Schema;
const bookModel = require('./bookModel');
const passportLocalMongoose = require('passport-local-mongoose');

const userModel = new schema({
	username: { type: String, required: true },
	password: { type: String },
	profileBio: {
		name: String,
		address: String,
		phoneNo: String,
	},
	bookInfo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'bookInfo' }],
	location: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'locationInfo',
	},
	socketId: String,
});
userModel.plugin(passportLocalMongoose);

module.exports = mongoose.model('UserInfo', userModel);
