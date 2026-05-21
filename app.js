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

app.use(express.urlencoded({ extended: true }));


app.get('/', function (request, response) {

    //Borde vara i en try/catch, eller istället readFile med callback osv. 
    let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
    let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

    // Skapar en virtuell DOM av HTML-strängen med jsdom.
    // Används för att manipulera HTML på serversidan innan den skickas till klienten.
    // Viktigt: använd alltid setAttribute() för att sätta värden på element — inte .value
    // .value fungerar inte med jsdom eftersom det är en dynamisk egenskap som inte
    // serialiseras tillbaka till HTML-strängen när man anropar dom.serialize().
    let dom = new jsdom.JSDOM(basePage);

    dom.window.document.querySelector('main').innerHTML = htmlSnippet;

    response.send(dom.serialize()); //trycker tillbaka till klienten

});

app.post('/play', function (request, response) {

    try {
        // kontrollera att kroppen finns, kommer det något tillbaka till servern överhuvudtaget 
        if (request.body === undefined) { // om det är sant kommer inget in 
            throw { 'errorMsg': 'Ingen data till servern!' }; // (Object literal)
        }

        if (request.body.nickname === undefined || request.body.speed === undefined) { //Kontrollerar om det finns någon data att hämta överhuvudtaget?
            throw { 'errorMsg': 'Ange nickname och speed!' };
        }

        //plockar ut nickname och speed och ger dem variabler 
        let nickname = request.body.nickname;
        let speed = request.body.speed;

        // kontrollera om nickname är kortare än 6 tecken 
        if (nickname.length < 6) {
            throw { 'errorMsg': 'nickname måste vara minst 6 tecken långt!' };
        }
        //!! Här borde man kontrollera om stränglägden på speed är tomt !!

        if (!utils.isNumber(speed)) { // isNumber är en funktion från filen utils som kontrollerar om det är ett heltal 
            throw { 'errorMsg': 'speed måste vara ett heltal' };
        }

        speed = parseInt(speed); //konverterar speed till ett heltal 

        if (speed < 1 || speed > 5) {
            throw { 'errorMsg': 'speed måste vara ett heltal mellan 1-5' };
        }

        //Kontrollera så spelare 1 och spelare 2 har olika namn
        if (player.playerOneNick !== null && player.playerOneNick === nickname) {
            throw { 'errorMsg': 'nickname måste vara olika!' };
        }

        if (player.playerOneNick !== null) { //Om ettan är skilt från null blir det tvåan
            player.playerTwoNick = nickname;
            player.playerTwoSpeed = speed;
            response.cookie('player', '2', { maxAge: 60 * 60 * 1000, httpOnly: false }); //default är att klienten kan manipulera cookies så här behövs inte göra nåt 
        } else {
            //Borde kontrllera mot att både spelare 1 och 2 redan är med i spelet
            // För vad händer när spelare 3 ansluter?
            player.playerOneNick = nickname;
            player.playerOneSpeed = speed;
            response.cookie('player', '1', { maxAge: 60 * 60 * 1000, httpOnly: false });
        }

        let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
        let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

        let dom = new jsdom.JSDOM(basePage);

        dom.window.document.querySelector('main').innerHTML = '<h1>Väntar på spelare</h1><div class="spinner-border text-muted" div>';

        response.send(dom.serialize()); //trycker tillbaka till klienten

        // TIPS! Skapa en reset -metod, så man resetar kakor pch alla saker på servern

    } catch (exeption) {

        let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
        let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

        let dom = new jsdom.JSDOM(basePage);

        dom.window.document.querySelector('main').innerHTML = htmlSnippet;
        dom.window.document.querySelector('#error').textContent = exeption.errorMsg

        response.send(dom.serialize()); //trycker tillbaka till klienten


    }
});

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



