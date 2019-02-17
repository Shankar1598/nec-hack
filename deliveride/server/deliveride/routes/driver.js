const express = require('express');
const router = express.Router();
const passport = require('passport');
var geo = require('georedis');
//models
const User = require('../models/userModel');
const bookModel = require('../models/bookModel');
const Driver = require('../models/driverModel');
const Location = require('../models/locationModel');

router.get('/', (req, res) => {
	res.send('ok');
});

//update driver socket id

//update user socket id
router.post('/updatesocket', async (req, res) => {
	let driverId = req.user._id;

	try {
		let foundDriver = await Driver.findById(driverId);
		foundDriver.socketId = req.body.driverSocketId;
		try {
			let updateDriver = await foundDriver.save();
			res.json({ message: 'socket id updated successfully' });
			console.log('socket id successupdated ');
		} catch (e) {
			return res.json({ message: 'sorry the socket id could not be updated' });
		}
	} catch (e) {
		return res.json({ message: 'user could not be found' });
	}
});

//update driver location to redis
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

router.get('/check', async (req, res) => {
	let location = await Location.find({
		location: {
			$near: {
				$geometry: { type: 'Point', coordinates: [13.117753, 80.0931887] },
				$maxDistance: 800,
				$minDistance: 10,
			},
		},
	});

	res.json(location);
});

router.post('/profile', async (req, res) => {
	const user = req.user;

	let geoFormat = {
		type: 'Point',
		coordinates: [req.body.lat, req.body.long],
	};

	let foundDriver = await Driver.findById(user._id);

	let location = new Location({
		location: geoFormat,
		type: 'driver',
		identity: req.user._id,
	});

	let updatedLocation = await location.save();

	foundDriver.profileBio.name = req.body.name;
	foundDriver.profileBio.address = req.body.address;
	foundDriver.profileBio.phoneNo = req.body.phoneNo;
	foundDriver.location = updatedLocation;

	try {
		let updateDriver = await foundDriver.save();
		return res.json(updateDriver);
	} catch (e) {
		return res.json({ error: 'cannot update profile' + e });
	}
});

router.get('/requests', async (req, res) => {
	const requests = await Driver.findById(req.user._id)
		
		.populate('Requests')
		.exec();

	res.json(requests.Requests);
});

//accept a request
router.post('/:id/decision', async (req, res) => {
	//establish socket connection

	const io = req.app.io;
	let decision = false;

	let driver_id = req.user._id;

	switch (req.body.decision) {
		case 'true':
			decision = true;
			break;
		case 'false':
			decision = false;
			break;
		default:
			return res.json({
				error: 'unkknown decision please enter a valid decision',
			});
	}

	const requestId = req.params.id;
	try {
		let foundRequest = await bookModel.findById(requestId);
		foundRequest.bookInfo.decision = decision;
		foundRequest.bookInfo.acceptedDriver.id = req.user._id;
		foundRequest.bookInfo.acceptedDriver.username = req.user.username;
		const updateRequest = await foundRequest.save();
		// return res.json(updateRequest);
	} catch (e) {
		return res.json({ error: 'sorry your request could not be processed' + e });
	}

	if (req.body.decision == 'true') {
		let foundRequest = await bookModel
			.findById(requestId)
			.populate('bookInfo.bookedUser.id')
			.exec();
		// return res.json(foundRequest.bookInfo.bookedUser.id._id);
		let foundDriver = await Driver.findById(driver_id);
		let userid = foundRequest.bookInfo.bookedUser.id._id.toString();

		// let userSocketId = foundRequest.bookInfo.bookedUser.id.socketId;
		console.log('driver accepted');
		res.json({ message: 'Ride accepted' });
		sendRealtimeUpdate(userid, req.app.io, foundDriver.socketId);
		// io.on('new-socket', socketId => {
		// 	if (true) {
		// 		console.log('got new id from new-socket');
		// 		clearInterval(locationUpdateInterval);
		// 		sendRealtimeUpdate(userid, socketId, req.app.io);
		// 	}
		// });
	}
});
let locationUpdateInterval = null;
const sendRealtimeUpdate = (userid, io, driverSocketId) => {
	var locations = [
		{ longitude: 77.686017, latitude: 13.000245 },
		{ longitude: 77.686719, latitude: 13.000156 },
		{ longitude: 77.687416, latitude: 12.99966 },
		{ longitude: 77.687884, latitude: 12.99933 },
		{ longitude: 77.688394, latitude: 12.998719 },
		{ longitude: 77.688904, latitude: 12.998248 },
		{ longitude: 77.689869, latitude: 12.997652 },
		{ longitude: 77.690588, latitude: 12.997371 },
		{ longitude: 77.690723, latitude: 12.997172 },
		{ longitude: 77.690631, latitude: 12.996912 },
		{ longitude: 77.690461, latitude: 12.99651 },
		{ longitude: 77.690295, latitude: 12.996186 },
		{ longitude: 77.690032, latitude: 12.995687 },
		{ longitude: 77.689923, latitude: 12.995514 },
		{ longitude: 77.689457, latitude: 12.994309 },
		{ longitude: 77.689164, latitude: 12.993531 },
		{ longitude: 77.689101, latitude: 12.993118 },
		{ longitude: 77.689042, latitude: 12.992833 },
		{ longitude: 77.688852, latitude: 12.992462 },
		{ longitude: 77.688469, latitude: 12.991949 },
		{ longitude: 77.688057, latitude: 12.991495 },
		{ longitude: 77.687801, latitude: 12.991354 },
		{ longitude: 77.687758, latitude: 12.991318 },
		{ longitude: 77.687661, latitude: 12.991491 },
		{ longitude: 77.687316, latitude: 12.991938 },
		{ longitude: 77.686821, latitude: 12.99267 },
		{ longitude: 77.686358, latitude: 12.993211 },
		{ longitude: 77.685627, latitude: 12.994209 },
		{ longitude: 77.684928, latitude: 12.995223 },
		{ longitude: 77.684294, latitude: 12.99607 },
		{ longitude: 77.683513, latitude: 12.997277 },
		{ longitude: 77.68279, latitude: 12.998503 },
		{ longitude: 77.681999, latitude: 12.99975 },
		{ longitude: 77.681714, latitude: 13.000202 },
		{ longitude: 77.681861, latitude: 13.00038 },
		{ longitude: 77.682314, latitude: 13.000435 },
		{ longitude: 77.683424, latitude: 13.000385 },
		{ longitude: 77.684492, latitude: 13.000383 },
		{ longitude: 77.685628, latitude: 13.000246 },
		{ longitude: 77.686473, latitude: 13.00015 },
	];
	let i = 0;
	locationUpdateInterval = setInterval(async () => {
		let foundUser = await User.findById(userid);

		//  console.log("longitude:"+location[i].long+"   latitude:"+location[i].lat);
		io.to(foundUser.socketId)
			.to(driverSocketId)
			.emit('track-driver', locations[i++]);
		if (i == locations.length) {
			i = 0;
		}
		console.log('sending driver location ' + i + ' to user socket ' + foundUser.socketId);
		geo.location(`${userid}`, (err, location) => {
			// io.to(foundUser.socketId).emit('track-driver', location);
			// console.log('sending driver location to user socket ' + foundUser.socketId);
		});
	}, 4000);
};

router.get('/endtrip', (req, res) => {
	clearInterval(locationUpdateInterval);
	res.json({ message: 'Trip completed successfully' });
});

module.exports = router;
