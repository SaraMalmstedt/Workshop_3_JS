'use strict';

//Globala variabler 
let socket = io(); // ansluter automatiskt till servern när sidan laddas. KRÄVER AT socket.io-client ÄR LÄNKAD I HTML
let player = null; // null - sätts till'left' eller 'right' när spelet startar. Används för att veta vilken pad klienten styr 
let lastY = null; // null . används för att beräkna hur myckey musen har rört sig vertikalt

//Händelse för att ta hand om uppdaterad position på bollen
socket.on('updateball', function (data) {

    let ball = document.getElementById('ball');
    ball.style.left = data.xpos + 'px'; // 
    ball.style.top = data.ypos + 'px';

    //Kolla om träff på pad höger pad      
    if (data.xpos >= 725 && data.xpos <= 740) {
        let padPosition = document.getElementById('rightpad').style.top; // returnerar en sträng med enheten på tex '160px'
        padPosition = padPosition.slice(0, -2); // plocka bort 'px' eftersom man inte kan jämföra sträng med tal, blir då '160'

        // ollar om bollen är inom padens höjd, alltså om det är en träff
        if (data.ypos >= padPosition && data.ypos <= (parseInt(padPosition) + 180)) { // gör om strängen '160' till int
            //Spela pingljud och..
            document.getElementById('ping').play();
            //skicka händelsen changedirection till servern så bollen byter håll
            socket.emit('changedirection', null);
        }
    }


    //Kolla om träff på pad vänster pad 
    if (data.xpos <= 55 && data.xpos >= 40) {
        let padPosition = document.getElementById('leftpad').style.top;
        padPosition = padPosition.slice(0, -2);

        if (data.ypos >= padPosition && data.ypos <= (parseInt(padPosition) + 180)) {
            //Spela ping
            document.getElementById('ping').play();
            //Byt håll
            socket.emit('changedirection', null);
        }
    }

});


// Lyssnar på händelsen 'startgame' som skickas från servern.
// Servern MÅSTE skicka ett objekt med tre nycklar: 
// { currentnick, opponentnick, player } — annars blir värdena undefined.
socket.on('startgame', function (data) {

    // Rensar spelplanen så den är tom innan spelet byggs upp
    document.querySelector('main').innerHTML = null;

    // Bygger upp spelgränssnittet med båda spelarnas namn
    // data.currentnick = spelarens egna namn
    // data.opponentnick = motståndarens namn
    buildGUI(data.currentnick, data.opponentnick);

    //starta musik
    document.getElementById('in-game-music').play();

    // Aktiverar muslyssnaren — nu kan spelaren styra sin pad
    document.querySelector('main').addEventListener('mousemove', updatePadPosition);

    // Sparar om denna spelare är 'left' eller 'right'
    // Används senare för att veta vilken pad spelaren styr
    player = data.player;

});

// Lyssnar på händelsen 'updatePadPos' som skickas från servern.
// Servern tar emot padpositionen från EN spelare och vidarebefordrar till DEN ANDRE.
// Servern MÅSTE skicka ett objekt med nyckeln Y: { Y: position }
socket.on('updatePadPos', function (data) {


    // Om JAG är vänsterspelaren ska MOTSTÅNDARENS (höger) pad uppdateras
    // Om JAG är högerspelaren ska MOTSTÅNDARENS (vänster) pad uppdateras
    // Alltså uppdateras alltid motståndarens pad — aldrig din egen
    // (din egen pad uppdateras lokalt i updatePadPosition-funktionen)
    if (player == 'left') {
        document.getElementById('rightpad').style.top = data.Y + 'px';
    }
    else {
        document.getElementById('leftpad').style.top = data.Y + 'px';
    }

});


// Lyssnar på händelsen 'gameover' som skickas från servern när bollen träffat en vägg.
// Servern MÅSTE skicka ett objekt med nyckeln winner: { winner: 'nicknamnePåVinnaren' }
socket.on('gameover', function (data) {

    //stoppa musik
    document.getElementById('in-game-music').pause();

    // Avaktiverar muslyssnaren — spelaren kan inte längre styra sin pad
    document.querySelector('main').removeEventListener('mousemove', updatePadPosition);

    // Skriver ut vinnaren i h1-elementet som redan finns i spelplanen
    // data.winner = nicknamneet på den som vann
    document.querySelector('main h1').textContent = 'Vinnare är ' + data.winner;

    // Skapar en "Spela igen"-knapp och lägger till den i spelplanen
    let btn = document.createElement('a');
    let div = document.createElement('div');
    div.classList.add('w-100', 'text-center');

    btn.href = '/'; // klick på knappen skickar spelaren tillbaka till startsidan
    btn.classList.add('btn', 'btn-lg', 'btn-primary');
    btn.textContent = 'Spela igen?';
    div.appendChild(btn);
    document.querySelector('main').insertBefore(div, document.querySelector('main>div'));

    // Tar bort player-cookien genom att sätta utgångsdatumet till en tid i det förflutna
    // VIKTIGT: fungerar bara om cookien är satt med httpOnly: false på servern!
    // Om httpOnly: true kan JavaScript inte nå cookien och den tas aldrig bort
    document.cookie = 'player=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});

// Lyssnar på händelsen 'ping' som skickas från servern.
// Servern skickar 'ping' när bollen studsar mot tak eller golv (ballY <= 0 || ballY >= 480)
// Detta är redan skrivet i den förskrivna timeout()-funktionen i app.js
// Spelar upp ett pingljud på klienten som återkoppling till spelaren
socket.on('ping', function (data) {
    document.getElementById('ping').play();
});

// Funktion som körs varje gång spelaren rör musen (aktiverad av mousemove-lyssnaren i startgame).
// Beräknar hur mycket musen rört sig och uppdaterar padens position därefter.
function updatePadPosition(evt) {
    // Första gången musen rör sig — spara Y-positionen som referenspunkt
    if (lastY == null) {
        lastY = evt.clientY;
    }
    else if (lastY != evt.clientY) {

        // Beräkna hur många pixlar musen rört sig sedan förra gången
        let delta = lastY - evt.clientY;

        // Uppdatera referenspunkten till nuvarande musposition
        lastY = evt.clientY;
        let padPosition;
        if (player === 'left') {
            // Hämta padens nuvarande Y-position och ta bort 'px'
            padPosition = document.getElementById('leftpad').style.top;
            padPosition = padPosition.slice(0, -2);
            // Flytta paden med delta — musen upp = paden upp, musen ned = paden ned
            padPosition = parseInt(padPosition) - parseInt(delta);

            // Begränsa paden så den inte åker utanför spelplanen
            // Min 0 (överkant) och max 320 (underkant — 500px höjd minus 180px pad)
            if (padPosition < 0) padPosition = 0;
            else if (padPosition > 320) padPosition = 320;

            // Uppdatera padens position på skärmen lokalt
            document.getElementById('leftpad').style.top = padPosition + 'px';

            // Skicka den nya positionen till servern som ett tal (inte objekt!)
            // Servern vidarebefordrar det till motståndaren som { Y: padPosition }
            socket.emit('updatePadPos', padPosition);
            //console.log(padPosition);
        }
        else if (player === 'right') {
            // Exakt samma logik som för vänster — fast för höger pad
            padPosition = document.getElementById('rightpad').style.top;
            padPosition = padPosition.slice(0, -2);
            padPosition = parseInt(padPosition) - parseInt(delta);

            if (padPosition < 0) padPosition = 0;
            else if (padPosition > 320) padPosition = 320;

            document.getElementById('rightpad').style.top = padPosition + 'px';

            socket.emit('updatePadPos', padPosition);
            //console.log(padPosition);
        }

    }
}

// Funktion som bygger upp hela spelgränssnittet i webbläsaren.
// Anropas från startgame-händelsen med spelarens egna nick och motståndarens nick.
function buildGUI(mynick, opponentnick) {

    // Gör html och body 100% höga så spelplanen fyller hela skärmen
    document.querySelector('html').style.height = '100%';
    document.querySelector('body').style.height = '100%';

    // Skapar en rubrik med båda spelarnas namn, t.ex. "Sara vs. Johan"
    let h1 = document.createElement('h1');
    h1.textContent = mynick + ' vs. ' + opponentnick;
    h1.classList.add('text-center', 'w-100');
    document.querySelector('main').appendChild(h1);

    // Skapar spelplanen — en grå ruta som är 800x500px
    let gameArea = document.createElement('div');
    gameArea.style.width = '800px';
    gameArea.style.height = '500px';
    //gameArea.style.overflowX='scroll';
    gameArea.style.backgroundColor = 'silver';
    gameArea.style.position = 'relative';
    gameArea.style.border = '1px solid black';

    // Skapar vänster pad — svart rektangel 50x180px, placerad 5px från vänsterkanten
    // Startar på y=160px (ungefär i mitten av spelplanen)
    let leftPad = document.createElement('div');
    leftPad.setAttribute('id', 'leftpad');
    leftPad.style.width = '50px';
    leftPad.style.height = '180px';
    leftPad.style.position = 'absolute';
    leftPad.style.left = '5px';
    leftPad.style.top = '160px';
    leftPad.style.backgroundColor = 'black';

    gameArea.appendChild(leftPad);

    // Skapar höger pad — identisk med vänster men placerad 5px från högerkanten
    let rightPad = document.createElement('div');
    rightPad.setAttribute('id', 'rightpad');
    rightPad.style.width = '50px';
    rightPad.style.height = '180px';
    rightPad.style.position = 'absolute';
    rightPad.style.right = '5px';
    rightPad.style.top = '160px';
    rightPad.style.backgroundColor = 'black';

    gameArea.appendChild(rightPad);

    // Skapar bollen — svart kvadrat 20x20px, startposition i mitten av spelplanen
    let ball = document.createElement('div');
    ball.setAttribute('id', 'ball');
    ball.style.width = '20px';
    ball.style.height = '20px';
    ball.style.position = 'absolute';
    ball.style.left = '390px';
    ball.style.top = '240px';
    ball.style.backgroundColor = 'black';

    gameArea.appendChild(ball);

    // Centrerar spelplanen i main med flexbox
    document.querySelector('main').style.display = 'flex';
    document.querySelector('main').style.height = '100%';
    document.querySelector('main').style.justifyContent = 'center';
    document.querySelector('main').style.alignItems = 'center';
    document.querySelector('main').style.flexWrap = 'wrap';
    document.querySelector('main').appendChild(gameArea);
}