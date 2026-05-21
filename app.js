// Lägg in din anmälningskod här
// Skriv ditt namn här
// Använda verktyg och tjänster (Exempelvis Visual studio Code, NodeJS, NPM, stackoverflow, ChatGPT)
'use strict';

// ---IMPORTER--------
// Tredjepartsmoduler - måste installeras med npm install innan dom kan användas 
const express = require('express');
const cookieParser = require('cookie-parser');
const jsdom = require('jsdom');

// Inbyggd Node.js-modul, som inye behöver installeras 
const fs = require('fs');

// Egna moduler - palyer, game och utils är filer som 'din kamrat' har skrivit att vi ska ha
const player = require('./resources/player.js');
const game = require('./resources/game.js');
const utils = require('./resources/utils.js');

// (variable på vänstersidan för att använda för högersidan )

// ---SERVER ----------
// Skapar en Express-applikation - app är objektet vi använder för att definiera routes 
const app = express();

// Startar servern på port 3000 och sparar referensen i expressServer 
// expressServer behövs senare för att koppla Socket.io till samma server 
let expressServer = app.listen(3000, function () {
    console.log('Servern körs på port 3000');
});


// Kopplar Socket.io till samma HTTP-server som Express 
// Detta är viktigt - WebSockets-asnlutningen börjar med ett HTTP.handshake 
// och måste därför dela port med Express-servern 
const io = require('socket.io')(expressServer); //inte importera http, bara express


// ---- MIDDLEWARE -----
// Aktiverar cookie-parser så att request.cookies finns tillgägnligt i alla routes 
app.use(cookieParser());

// Gör mappen 'clientCode' tillgägnlif för klienteb under URL:en '/public'
// app.use() tar alltid två argument: (1) URL/endpoint, (2) middleware
// express.static() öppnar upp en mapp så klienten kan ladda hem filer från den
app.use('/public', express.static(__dirname + '/clientCode'));

// Översätter formulärdata till något som Javascript förstår, ett objekt 
// extended: true tillåter mer komplexa objekt i formulärdata
app.use(express.urlencoded({ extended: true }));



// ─── DEL 1: GET /──────────────────────
// När klienten besöker startsidan visas registreringsformuläret.
// Vi läser in två HTML-filer, skapar en virtuell DOM med jsdom,
// sätter in formuläret i <main> och skickar tillbaka den färdiga HTML-sidan.
app.get('/', function (request, response) {

    // Läser in HTML-filerna synkront — enkelt men blockerar servern under läsningen.
    // I produktion bör man använda asynkron läsning med fs.readFile() istället.
    // Borde också vara i try/catch ifall filnamnet är felstavat!
    let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
    let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

    // Skapar en virtuell DOM av HTML-strängen med jsdom.
    // Används för att manipulera HTML på serversidan innan den skickas till klienten.
    // Viktigt: använd alltid setAttribute() för att sätta värden på element — inte .value
    // .value fungerar inte med jsdom eftersom det är en dynamisk egenskap som inte
    // serialiseras tillbaka till HTML-strängen när man anropar dom.serialize().
    let dom = new jsdom.JSDOM(basePage);

    // Sätter in formuläret inuti <main>-elementet i den virtuella DOM:en.
    // OBS: använd alltid innerHTML för att sätta in HTML-strängar,
    // och setAttribute() för att sätta värden på enskilda element — inte .value!
    // .value serialiseras inte tillbaka av jsdom och försvinner ur HTML-svaret.
    dom.window.document.querySelector('main').innerHTML = htmlSnippet;

    // Konverterar den virtuella DOM:en tillbaka till en HTML-sträng och skickar till klienten
    response.send(dom.serialize());

});


// ─── DEL 2: POST /play ─────────
// När klienten skickar in registreringsformuläret valideras nickname och speed.
// Vid fel visas formuläret igen med ett felmeddelande och de gamla värdena ifyllda.
// Vid godkänd validering sparas spelaren och en cookie sätts.
app.post('/play', function (request, response) {

    try {
        // kontrollera att kroppen finns, kommer det något tillbaka till servern överhuvudtaget 
        if (request.body === undefined) { // om det är sant kommer inget in 
            throw { 'errorMsg': 'Ingen data till servern!' }; // (Object literal)
        }

        // Kontrollerar att både nickname och speed finns i formulärdata
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

        // Kontrollerar att speed är ett tal med hjälp av isNumber() i utils.js
        // isNaN() används inuti isNumber() för att avgöra om värdet är ett tal
        if (!utils.isNumber(speed)) {
            throw { 'errorMsg': 'speed måste vara ett heltal' };
        }

        // Konverterar speed från sträng till heltal så vi kan jämföra med < och >
        // Formulärdata kommer alltid in som strängar, även om användaren skrivit en siffra
        speed = parseInt(speed);

        if (speed < 1 || speed > 5) {
            throw { 'errorMsg': 'speed måste vara ett heltal mellan 1-5' };
        }

        // Kontrollerar att spelare 1 och spelare 2 inte har samma nickname
        // player.playerOneNick är null tills spelare 1 har registrerat sig
        if (player.playerOneNick !== null && player.playerOneNick === nickname) {
            throw { 'errorMsg': 'nickname måste vara olika!' };
        }

        // Om spelare 1 redan är registrerad (playerOneNick !== null) är det spelare 2 som ansluter
        // Annars är det spelare 1 som ansluter
        // Cookien sätts med httpOnly: false så att klienten kan ta bort den själv vid game over
        // maxAge anges i millisekunder — 60 * 60 * 1000 = 1 timme
        if (player.playerOneNick !== null) {
            player.playerTwoNick = nickname;
            player.playerTwoSpeed = speed;
            response.cookie('player', '2', { maxAge: 60 * 60 * 1000, httpOnly: false }); //default är att klienten kan manipulera cookies så här behövs inte göra nåt 
        } else {
            // OBS: här borde man också kontrollera om både spelare 1 och 2 redan är med
            // Vad händer om en tredje spelare försöker ansluta?
            player.playerOneNick = nickname;
            player.playerOneSpeed = speed;
            response.cookie('player', '1', { maxAge: 60 * 60 * 1000, httpOnly: false });
        }

        // Laddar in basepage.html igen och visar en väntesida med spinner
        // medan den andra spelaren registrerar sig
        let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
        let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

        let dom = new jsdom.JSDOM(basePage);

        dom.window.document.querySelector('main').innerHTML = '<h1>Väntar på spelare</h1><div class="spinner-border text-muted" div>';

        response.send(dom.serialize()); //trycker tillbaka till klienten

        // TIPS! Skapa en reset -metod, så man resetar kakor pch alla saker på servern

    } catch (exeption) {

        // Vid valideringsfel — visa formuläret igen med felmeddelande och gamla värden ifyllda
        let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');
        let htmlSnippet = fs.readFileSync(__dirname + '/resources/register-form.html')

        let dom = new jsdom.JSDOM(basePage); // Måste skapa ny DOM i catch 

        // Sätter in formuläret i <main>
        dom.window.document.querySelector('main').innerHTML = htmlSnippet;

        // Visar felmeddelandet i elementet med id="error"
        dom.window.document.querySelector('#error').textContent = exeption.errorMsg

        // Fyller i de gamla värdena så användaren inte behöver skriva om allt
        // OBS: setAttribute() måste användas — inte .value — annars serialiseras inte värdet!
        // OBS: borde kontrollera att dessa inte är undefined innan man sätter dem
        dom.window.document.querySelector('#nickname').setAttribute('value', request.body.nickname); //Tänk hårdkodad HTML kod!
        dom.window.document.querySelector('#speed').setAttribute('value', request.body.speed);

        response.send(dom.serialize()); //trycker tillbaka till klienten

    }
});

//EXTRA INFO
// Läs in textfiler med antingen fs.readFileSync() (synkront) eller fs.readFile() (asynkront).
// Kolla i kravspecifikationen vilket som gäller — det påverkar hur koden struktureras.
// Synkront: enklare kod, ingen callback behövs.
// Asynkront: kräver callback/promise, men blockerar inte servern under läsningen.
// Oavsett vilket — använd try/catch för att fånga upp fel som t.ex. felstavade filnamn.


// ─── DEL 2: SOCKET.IO CONNECTION ────────────────
// Körs varje gång en ny klient ansluter via Socket.io.
// Vi läser klientens cookie för att avgöra om det är spelare 1 eller 2
// och sparar socket.id så vi kan skicka meddelanden till rätt spelare senare.
io.on('connection', function (socket) {

    // Hämtar cookie-strängen från klientens handshake-headers
    // socket.handshake.headers.cookie returnerar en rå sträng, t.ex. "player=1"
    let cookieString = socket.handshake.headers.cookie;

    // Använder parseCookies() från utils.js för att omvandla strängen till ett objekt
    // "player=1" blir { player: '1' } så vi kan läsa list.player
    let list = utils.parseCookies(cookieString); //blir ett json objekt 

    console.log(cookieString, list)

    // Sparar socket.id på rätt spelare beroende på cookie-värdet
    // socket.id är ett unikt ID som Socket.io sätter för varje anslutning
    // Vi behöver det senare för att skicka startgame-händelsen till rätt spelare
    // OBS: kan det finnas buggar här? Vad händer om cookien saknas eller är felaktig?
    // En spelare utan cookie skulle hamna i else och sparas som spelare 2!
    if (list.player === '1') {
        player.playerOneSocketId = socket.id;
    } else {
        player.playerTwoSocketId = socket.id;
    }
});



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



