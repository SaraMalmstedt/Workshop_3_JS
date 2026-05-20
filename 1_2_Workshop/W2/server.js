'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Server } = require('socket.io');
const { parseCookies, getTimeStamp } = require('./my-module.js');

const app = express();
const port = 3002;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use('/public', express.static(__dirname + '/public'));

const httpServer = app.listen(port, function () {
    console.log(`Servern lyssnar på http://localhost:${port}`);
})

const io = new Server(httpServer);


app.get('/', (req, res) => {
    console.log('hej');

    if (req.cookies.nickname) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'loggain.html'));
    }
});

app.post('/', (req, res) => {

    res.cookie('nickname', req.body.nickname);
    res.redirect('/');


});

io.on('connection', function (socket) {
    console.log('sdfs');

    socket.on('newBackground', (data) => {

        const cookieHeader = socket.handshake.headers.cookie || '';

        let kakor = parseCookies(cookieHeader);
        console.log('Fågel: ' + data + ': nickname är ' + kakor.nickname);
        console.log(cookieHeader);

        io.emit('byt', { 'bildnr': data, 'nick': kakor.nickname });

    });



});

