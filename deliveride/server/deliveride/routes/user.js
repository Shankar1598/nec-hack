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
					geo.location(`${req.user._id}`, data => {
						console.log('found driver' + data);
					});
					// console.log({ location: data, reply });
				}
			);
		});
	});

	res.json({ message: 'got id' });
});

//update user socket id
router.post('/updatesocket/', async (req, res) => {
	let userId = req.user._id;

	try {
		let foundUser = await User.findById(userId);
		foundUser.socketId = req.body.userSocketId;

		try {
			let updateUser = await foundUser.save();
			res.json({ message: 'updated socket id successfully' });
			console.log('socket id updated from update user route');
		} catch (e) {
			return res.json({ message: 'sorry the socket id could not be updated' });
		}
	} catch (e) {
		return res.json({ message: 'user could not be found' });
	}
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
	//establish a socket connection
	const io = req.app.io;

	// booking data
	const user_id = req.user._id;

	//find the user who's logged in .
	const foundUser = await User.findById(user_id)
		.populate('location')
		.exec();

	const data = {
		startTimestamp: req.body.date,
		endTimeStamp: 'pending from driver',
		startLocation: req.body.startLocation,
		endLocation: 'pending from driver',
	};

	// return console.log(data);
	//create the book model
	const book = new bookModel({
		bookInfo: {
			bookedUser: {
				id: user_id,
				username: req.user.username,
			},

			startTimestamp: data.startTimestamp,
			endTimeStamp: data.endTimeStamp,
			startLocation: data.startLocation,
			endLocation: data.endLocation,
			decision: false,
		},
	});

	//find the nearby drivers
	let nearByDrivers = geo.nearby(
		{ latitude: data.startLocation.lat, longitude: data.startLocation.long },
		10000,
		async function(err, locations) {
			if (err) console.error(err);
			else {
				console.log('nearby locations:', locations);

				// if there are no drivers found send the status that the request could not be processed
				if (locations.length == 0) {
					return res.json({
						message: 'sorry your request could not be processed there are no nearby drivers',
					});
				}

				//construct an array for the searching the ids of nearby drivers
				let nearByDriverIds = [];
				locations.map(elem => {
					nearByDriverIds.push(new mongoose.Types.ObjectId(elem));
				});

				//find the nearby driver detail from the constructed ids
				let drivers = await Driver.find({ _id: { $in: nearByDriverIds } });

				//find drivers and push requests to them
				for (let i = 0; i < drivers.length; i++) {
					drivers[i].Requests.push(book);
					try {
						await drivers[i].save();
						console.log('emitting to driver with socket id' + drivers[i].socketId);
						io.to(`${drivers[i].socketId}`).emit('new-booking', { bookingData: book });
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
			}
		}
	);
});


//book a delivery request
router.post('/book/deliver', async (req, res) => {
	//establish a socket connection
	const io = req.app.io;

	// booking data
	const user_id = req.user._id;

	//find the user who's logged in .
	const foundUser = await User.findById(user_id)
		.populate('location')
		.exec();

	const data = {
		startTimestamp: req.body.date,
		endTimeStamp: 'pending from driver',
		startLocation: req.body.startLocation,
		endLocation: 'pending from driver',
type:'deliver',
status:false


	};

	// return console.log(data);
	//create the book model
	const book = new bookModel({
		bookInfo: {
			bookedUser: {
				id: user_id,
				username: req.user.username,
			},

			startTimestamp: data.startTimestamp,
			endTimeStamp: data.endTimeStamp,
			startLocation: data.startLocation,
			endLocation: data.endLocation,
			decision: false,
			type:'deliver',
			status:false
		},
	});

	//find the nearby drivers
	let nearByDrivers = geo.nearby(
		{ latitude: data.startLocation.lat, longitude: data.startLocation.long },
		10000,
		async function(err, locations) {
			if (err) console.error(err);
			else {
				console.log('nearby locations:', locations);

				// if there are no drivers found send the status that the request could not be processed
				if (locations.length == 0) {
					return res.json({
						message: 'sorry your request could not be processed there are no nearby drivers',
					});
				}

				//construct an array for the searching the ids of nearby drivers
				let nearByDriverIds = [];
				locations.map(elem => {
					nearByDriverIds.push(new mongoose.Types.ObjectId(elem));
				});

				//find the nearby driver detail from the constructed ids
				let drivers = await Driver.find({ _id: { $in: nearByDriverIds } });

				//find drivers and push requests to them
				for (let i = 0; i < drivers.length; i++) {
					drivers[i].Requests.push(book);
					try {
						await drivers[i].save();
						console.log('emitting to driver with socket id' + drivers[i].socketId);
						io.to(`${drivers[i].socketId}`).emit('new-booking', { bookingData: book });
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
			}
		}
	);
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
