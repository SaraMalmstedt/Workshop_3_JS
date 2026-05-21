// Lägg in din anmälningskod här
// Skriv ditt namn här
// Använda verktyg och tjänster (Exempelvis Visual studio Code, NodeJS, NPM, stackoverflow, ChatGPT)
'use strict';
const express = require('express');
const cookieParser = require('cookie-parser');
const jsdom = require('jsdom');

const fs = require('fs');

const player = require('./resources/player.js');
const game = require('./resources/game.js');
const utils = require('./resources/utils.js');

// (variable på vänstersidan för att använda för högersidan )

const app = express();

let expressServer = app.listen(3000, function () {
    console.log('Servern körs på port 3000');
});

app.use(cookieParser());
app.use('/public', express.static(__dirname + '/clientCode'));

app.use(express.urlencoded({ extended: True }));

app.get('/', function () {

    let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
    let htmlSnippet = 

})

//EXTRA INFO
// Läs in textfiler med antingen fs.readFileSync() (synkront) eller fs.readFile() (asynkront).
// Kolla i kravspecifikationen vilket som gäller — det påverkar hur koden struktureras.
// Synkront: enklare kod, ingen callback behövs.
// Asynkront: kräver callback/promise, men blockerar inte servern under läsningen.
// Oavsett vilket — använd try/catch för att fånga upp fel som t.ex. felstavade filnamn.



//NEDAN KOMMER I EFTERMIDDAG
/*
//Ta emot changedirection-händelse från klient
socket.on('changedirection', function () {
    if (game.directionLock < 0) {
        game.deltaX = game.deltaX * -1;
        //lägg på lås så inte riktning ändras igen inom 5 positionsuppdateringar.
        game.directionLock = 5;
    }
});


//Funktion för att beräkna bollens rörelse
function timeout() {
    //uppdatera ballposition
    game.ballX = game.ballX + game.deltaX;
    game.ballY = game.ballY + game.deltaY;
    game.directionLock--;

    //Kontrollera krock nedåt,uppåt
    if (game.ballY <= 0 || game.ballY >= 480) {
        game.deltaY = game.deltaY * -1;
        io.emit('ping', null);
    }
    io.emit('updateball', { 'xpos': game.ballX, 'ypos': game.ballY });
    //Ropa på funktion för att kontrollera om spelet är slut
    checkForGameOver();
}

*/



