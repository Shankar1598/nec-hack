const express = require('express');
const mongoose = require('mongoose');
const keys = require('./config/key.js');
const bodyParser = require('body-parser');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const localip = '192.168.43.199';

let userId = '';

//socket io express middleware
app.io = io.on('connection', function(socket) {
	console.log('Socket connected: ' + socket.id);
	io.emit('server', 'hi from server');
	// socket.on('location', data => console.log(data));
});

//redis config
var client = redis.createClient('6379', localip);

//geo-redis config
var geo = require('georedis').initialize(client);

require('./auth/auth');

//middleware config
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//import routes
const publicRoutes = require('./routes/authorization');
const userProtectedRoutes = require('./routes/user.js');
const driverProtectedRoutes = require('./routes/driver.js');

//database config
mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true }, err => {
	if (err) {
		throw new Error('connection to database failed');
	} else {
		console.log('connection to database successfull');
	}
});

//route handler
app.use('/api', publicRoutes);
// app.use("/user", userProtectedRoutes);

app.get('/', (req, res) => {
	res.send('theivam');
});

app.use('/user', passport.authenticate('user_jwt', { session: false }), userProtectedRoutes);

app.use('/driver', passport.authenticate('driver_jwt', { session: false }), driverProtectedRoutes);

server.listen(3000, localip, err => {
	if (err) {
		console.log(err);
	} else {
		console.log('server running');
	}
});
