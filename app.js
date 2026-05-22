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

    // ----- DEL 4 VG-nivå--------
    // Skapar en ny div som ska innehålla checkboxen och dess label
    let formgroup = dom.window.document.createElement('div');
    formgroup.classList.add('formgroup', 'mb-3'); //Bootstrap, behövs inte 

    // Skapar en label med texten som visas bredvid checkboxen
    // 'for' kopplar labeln till checkboxen via dess id — klick på texten markerar checkboxen
    let label = dom.window.document.createElement('label');
    label.setAttribute('for', 'increase');
    label.classList.add('ms-2') //Bootstrap;
    label.textContent = 'Öka bollens fart var 10:e sekund';

    let br = dom.window.document.createElement('br');

    // Skapar själva checkboxen
    // name="increase" gör att värdet skickas med i POST-requesten när formuläret skickas
    // Om checkboxen är ikryssad skickas increase=on, om den inte är ikryssad skickas ingenting
    let checkbox = dom.window.document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('id', 'increase');
    checkbox.setAttribute('name', 'increase');

    // Lägger checkbox och label inuti formgroup-diven
    formgroup.appendChild(checkbox);
    formgroup.appendChild(label);

    // Sätter in formgroup INNAN knapp-diven (div.text-right) i formuläret
    // insertBefore(NYTT ELEMENT, REFERENSELEMENT) — det nya elementet hamnar precis ovanför referenselementet
    // Utan detta hade checkboxen hamnat sist i formuläret, efter knappen
    dom.window.document.querySelector('form').insertBefore(formgroup, dom.window.document.querySelector('div.text-right'));

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

            // VG DEL 4
            // Om checkboxen skickades med i formuläret (den var ikryssad)
            if (request.body.increase != null) {
                // Dubbelkollar att värdet verkligen är 'on'
                if (request.body.increase == 'on') {
                    player.playerTwoEnableSpeed = true;
                }
            }

        } else {
            // OBS: här borde man också kontrollera om både spelare 1 och 2 redan är med
            // Vad händer om en tredje spelare försöker ansluta?
            player.playerOneNick = nickname;
            player.playerOneSpeed = speed;
            response.cookie('player', '1', { maxAge: 60 * 60 * 1000, httpOnly: false });

            // VG DEL 4
            if (request.body.increase != null) {
                if (request.body.increase == 'on') {
                    player.playerOneEnableSpeed = true;
                }
            }
        }

        // Laddar in basepage.html igen och visar en väntesida med spinner
        // medan den andra spelaren registrerar sig
        let basePage = fs.readFileSync(__dirname + '/resources/basepage.html');

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


        // ----- DEL 4 VG-nivå --------
        // Checkboxen måste läggas till manuellt här i catch-blocket också.
        // När ett valideringsfel inträffar byggs formuläret upp från scratch med jsdom.
        // Utan denna kod skulle checkboxen försvinna när formuläret visas igen efter ett fel,
        // eftersom catch inte vet vad GET-routen lade till tidigare
        let formgroup = dom.window.document.createElement('div');
        formgroup.classList.add('formgroup', 'mb-3');

        let label = dom.window.document.createElement('label');
        label.setAttribute('for', 'increase');
        label.classList.add('ms-2') //Bootstrap;
        label.textContent = 'Öka bollens fart var 10:e sekund';

        let br = dom.window.document.createElement('br');

        let checkbox = dom.window.document.createElement('input');

        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('id', 'increase');
        checkbox.setAttribute('name', 'increase');

        formgroup.appendChild(checkbox);
        formgroup.appendChild(label);

        dom.window.document.querySelector('form').insertBefore(formgroup, dom.window.document.querySelector('div.text-right'));

        response.send(dom.serialize());
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

    // Kontrollerar om båda spelarna har registrerat sig
    // Spelet startar inte förrän både spelare 1 och spelare 2 har ett nickname
    if (player.playerOneNick != null && player.playerTwoNick != null) {
        // Beräknar hur ofta bollen ska uppdateras (i millisekunder)
        // Ju högre speed spelarna valde → kortare interval → snabbare boll
        // Exempel: båda valde 3 → 80 - ((3+3)*10) = 20ms mellan varje uppdatering
        game.timeInterval = 80 - ((player.playerOneSpeed + player.playerTwoSpeed) * 10)

        // Bygger ihop data-objektet som skickas till spelare 1
        // currentnick = spelarens egna namn, opponentnick = motståndarens namn
        // player: 'left' betyder att spelare 1 styr vänster pad
        let data = {
            currentnick: player.playerOneNick,
            opponentnick: player.playerTwoNick,
            player: 'left'
        }
        // Skickar startgame enbart till spelare 1 via deras unika socket.id
        // io.to(id).emit() skickar bara till en specifik klient — inte alla
        io.to(player.playerOneSocketId).emit('startgame', data);

        // Bygger om data-objektet för spelare 2 — nicknamnen är spegelvända!
        // player: 'right' betyder att spelare 2 styr höger pad
        data = {
            currentnick: player.playerTwoNick,
            opponentnick: player.playerOneNick,
            player: 'right'
        }

        // Skickar startgame enbart till spelare 2 via deras unika socket.id
        io.to(player.playerTwoSocketId).emit('startgame', data);

        // Startar bollrörelsen — setTimeout anropar timeout() efter timeInterval millisekunder
        // game.timerId sparas så vi kan stoppa timern med clearTimeout() vid game over
        game.timerId = setTimeout(timeout, game.timeInterval);

        // VG DEL - ökad bollhastighet
        // Aktiveras bara om BÅDA spelarna kryssade i checkboxen vid registrering
        // Om bara en spelare kryssade i händer ingenting
        if (player.playerOneEnableSpeed === true && player.playerTwoEnableSpeed == true) {
            game.increaseSpeedEnabled = true;
            // Startar en timer i game.js som ökar bollens hastighet var 10:e sekund
            game.increaseSpeed();
        }
    }

    //Ta emot changedirection-händelse från klient (fanns med från start)
    socket.on('changedirection', function () {
        if (game.directionLock < 0) {
            game.deltaX = game.deltaX * -1;
            //lägg på lås så inte riktning ändras igen inom 5 positionsuppdateringar.
            game.directionLock = 5;
        }
    });


    // Lyssnar efter när en klient skickar sin padposition till servern.
    // Servern kollar vem som skickade och vidarebefordrar positionen till motståndaren
    // så att båda spelarna kan se varandras pads röra sig i realtid. 
    socket.on('updatePadPos', function (data) {

        if (socket.id === player.playerOneSocketId) {
            io.to(player.playerTwoSocketId).emit('updatePadPos', { Y: data });
        }
        else if (socket.id === player.playerTwoSocketId) {
            io.to(player.playerOneSocketId).emit('updatePadPos', { Y: data });
        }
    });

});

// VG -DEL
// Funktion som kontrollerar om spelet är slut efter varje bolluppdatering.
// Anropas från timeout() efter varje gång bollen har rört sig.
function checkForGameOver() {

    // Kollar om bollen har passerat vänster eller höger vägg
    // Spelplanen är 800px bred — väggarna är vid x=0 (vänster) och x=790 (höger)
    if (game.ballX <= 0 || game.ballX >= 790) {
        // Bollen passerade höger vägg — spelare 2 missade sin pad — spelare 1 vinner
        if (game.ballX >= 790) {
            // Spelare 1 har vunnit. io.emit() skickar till ALLA anslutna klienter — båda ska få veta att spelet är slut
            io.emit('gameover', { winner: player.playerOneNick }); // emit skickar till alla ansluta 
        }
        else {
            // Bollen passerade vänster vägg — spelare 1 missade sin pad — spelare 2 vinner
            io.emit('gameover', { winner: player.playerTwoNick });
        }

        // Återställer spel- och spelarobjekten till sina startvärden
        // så att en ny omgång kan påbörjas
        game.reset();
        player.reset();
    }
    else {
        // Ingen vägg träffad — spelet fortsätter
        // Startar en ny timer som anropar timeout() igen efter timeInterval millisekunder
        // Detta skapar en loop: timeout() → checkForGameOver() → timeout() → ...
        // som håller bollen rörande tills någon träffar en vägg
        game.timerId = setTimeout(timeout, game.timeInterval);
    }
}


//Funktion för att beräkna bollens rörelse (fanns med från start)
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

