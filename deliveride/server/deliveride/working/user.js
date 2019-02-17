const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
var geo = require('georedis');

//models
const User = require('../models/userModel');
const bookModel = require('../models/bookModel');
const Driver = require('../models/driverModel');
const Location = require('../models/locationModel');

//===USER ROUTES==

//get user and update location
router.get('/getuser', (req, res) => {
	console.log('working get');

	const io = req.app.io;
	// console.log('io object is ', io);
	io.on('connection', socket => {
		// console.log('socket obj : ', socket);
		socket.on('location', data => {
			console.log('location event triggered');
			geo.updateLocation(
				`${req.user._id}`,
				{ latitude: data.latitude, longitude: data.longitude },
				(err, reply) => {
					console.log({ location: data, reply });
				}
			);
		});
	});

	res.json({ message: 'got id' });
});

//user profile
router.post('/profile', async (req, res) => {
	const user = req.user;

	let geoFormat = {
		type: 'Point',
		coordinates: [req.body.lat, req.body.long],
	};

	let foundUser = await User.findById(user._id);

	let location = new Location({
		location: geoFormat,
		type: 'user',
		identity: req.user._id,
	});

	if (foundUser.location == undefined) {
		return res.send('undefined');
		let updatedLocation = await location.save();
	}

	foundUser.profileBio.name = req.body.name;
	foundUser.profileBio.address = req.body.address;
	foundUser.profileBio.phoneNo = req.body.phoneNo;
	foundUser.location = location;
	foundUser.identity = req.user._id;

	try {
		let updateUser = await foundUser.save();
		return res.json(updateUser);
	} catch (e) {
		return res.json({ error: 'cannot update profile' + e });
	}
});

//book a request
router.post('/book', async (req, res) => {
	//farmer booking data
	const user_id = req.user._id;

	//find the user who's logged in .
	const foundUser = await User.findById(user_id)
		.populate('location')
		.exec();

	const data = {
		date: req.body.date,
		machineryName: req.body.machinery,
		phoneNo: req.body.phoneNo,
		address: req.body.address,
		Acre: req.body.Acre,
	};

	//create the book model
	const book = new bookModel({
		bookInfo: {
			bookedUser: {
				id: user_id,
				username: req.user.username,
			},
			date: data.date,
			machineryName: data.machineryName,
			driverName: data.driverName,
			phoneNo: data.phoneNo,
			address: data.address,
			Acre: data.Acre,
			decision: false,
		},
	});

	//find the nearby drivers
	let nearByDrivers = await Location.find({
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [
						foundUser.location.location.coordinates[0],
						foundUser.location.location.coordinates[1],
					],
				},
				$maxDistance: 10000,
				$minDistance: 0,
			},
		},
		type: 'driver',
	});

	// if there are no drivers found send the status that the request could not be processed
	if (nearByDrivers.length == 0) {
		return res.json({
			message: 'sorry your request could not be processed there are no nearby drivers',
		});
	}

	//construct an array for the searching the ids of nearby drivers
	let nearByDriverIds = [];
	nearByDrivers.map(elem => {
		nearByDriverIds.push(new mongoose.Types.ObjectId(elem.identity));
	});

	//nearby drivers extracted from ids
	let drivers = await Driver.find({ _id: { $in: nearByDriverIds } });

	//find drivers and push requests to them
	for (let i = 0; i < drivers.length; i++) {
		drivers[i].Requests.push(book);
		try {
			await drivers[i].save();
		} catch (error) {
			return res.json({ message: 'your request could not be completed' });
		}
	}

	//push the request to the user
	foundUser.bookInfo.push(book);

	//save the results for the user
	try {
		await foundUser.save();
	} catch (error) {
		return res.json({ message: 'sorry your request could not be processed' });
	}

	//finally save the request to the db of book model
	try {
		await book.save();
	} catch (error) {
		res.json({ message: 'sorry your request could not be processed' });
	}

	return res.json({
		message: 'successfully booked and request sent to nearby drivers',
	});
});

//get all requests created by user
router.get('/requests', async (req, res) => {
	const requests = await User.findById(req.user._id)
		.populate({
			path: 'bookInfo',
			populate: {
				path: 'bookInfo.bookedUser.id bookInfo.acceptedDriver.id',
				select: 'id',
			},
		})
		.exec();
	res.json(requests);
});

//get data of specific id
router.get('/:id/:infotype', async (req, res) => {
	const info_id = req.params.id;
	const infotype = req.params.infotype;

	const searchUser = async () => {
		try {
			let foundUser = await User.findById(info_id);
			return res.json(foundUser);
		} catch (error) {
			return res.json({ error: 'failed to fetch user' });
		}
	};

	const searchDriver = async () => {
		try {
			let foundDriver = await Driver.findById(info_id);
			return res.json(foundDriver);
		} catch (error) {
			return res.json({ error: 'failed to fetch driver details' });
		}
	};

	switch (infotype) {
		case 'user':
			searchUser();
			break;
		case 'driver':
			searchDriver();
			break;
		default:
			res.json({ error: 'invalid parameters' });
	}
});

//find the user point
router.get('/getLocation', async (req, res) => {
	let foundUser = await User.findOne({ username: 'UR' })
		.populate('location')
		.exec();
	// res.send(foundUser.location.location.coordinates);

	let nearByDrivers = await Location.find({
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [
						foundUser.location.location.coordinates[0],
						foundUser.location.location.coordinates[1],
					],
				},
				$maxDistance: 10000,
				$minDistance: 100,
			},
		},
	});

	res.send(nearByDrivers);
});

module.exports = router;
