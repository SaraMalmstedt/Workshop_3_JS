'use strict';

/*
    Skapa ett projekt: npm init
    Installera express: npm install express
    Installera jsdom: npm install jsdom
    Kanske installera nodemon lokalt.

    1. Starta en webbserver som svarar på port 3000
    2. Lägg till ett middleware för att exponera lämplig mapp (se form.html och katalogstruktur)
    3. Lägg till ett middleware för att kunna avkoda data från formulär (se form.html)

    4. Lägg till endpoint på / för get
    4.1 Vid anrop skicka asynkront form.html till klienten. 
    4.2 OCm något går fel returnera felet till klienten och skriv lämlig utdata till konsolen.
    4.3 Om allt gick bra skriv lämplig utdata till konsolen.

    5. Lägg till endpoint på / för post
    5.1 Använd undantagshantering och kontrollera indata för undefined, tomt, numeriskt värde, värde mellan 0-255.
    5.2 Om något utvärderas till true ska ett undantag kastas. 
    5.3 Om ett undantag har kastas skapa en server DOM av form.html (läs in med asynkon metod och hantera enligt 4.2-4.3) och om det har inkommit några värden återplacera dessa i respektive element.
    5.4 Till elementet med id errorMsg skriv ut texten i undantaget som har kastats.
    5.5 Skicka den modifierade server DOM till anropande klient.
    5.6 Om inget har utvärderats till false skapa en server DOM av index.html (läs in med asynkon metod och hantera enligt 4.2-4.3).
    5.7 Modifiera elmentet med id status till att erhålla en backgrundsfärg (rgb()) baserad på inkommande värden.
    5.8 Skicka den modifierade server DOM till anropande klient.
    
    För att testa er lösning använd både webbläsare och Postman.
*/

//1 
const express = require('express'); // Har vi installerat själva 
const jsdom = require('jsdom'); // Har vi installerat själva 

const fs = require('fs'); // Finns redan 

let app = express();

app.listen(3000, function () { // Kicka igång servern 
    console.log("Servern körs på port 3000");
});

app.use('/openDir', express.static(__dirname + '/lostFiles'));
app.use(express.urlencoded({ extended: true }));


app.get('/', function (request, response) {

    response.sendFile(__dirname + '/lostFiles/html/form.html', function (err) { // Hämtar hela sökvägen 

        if (err) {
            console.log(err);
            response.send(err.message);
        } else {
            console.log('Allt ok');
        }
    })
});

app.post('/', function (request, response) {

    let red = 0, green = 0, blue = 0;

    try {
        console.log(request.body);
        if (request.body === undefined) {
            throw new Error('Ingen data till server!');
        }
        // Röd
        if (request.body.red === undefined) {
            throw new Error('Röd saknar värde');
        }

        red = request.body.red;
        red = red.trim();

        if (red.length == 0) {
            throw new Error('Ange röd...');
        }

        //Blå
        if (request.body.blue === undefined) {
            throw new Error('Blå saknar värde');
        }

        blue = request.body.blue;
        blue = blue.trim();

        if (blue.length == 0) {
            throw new Error('Ange blå...');
        }

        //Grön
        if (request.body.green === undefined) {
            throw new Error('Grön saknar värde');
        }

        green = request.body.green;
        green = green.trim();

        if (green.length == 0) {
            throw new Error('Ange grön...');
        }

        // response.send(request.body);
        //Heltal, tal mellan 0-255
        // Allt ok... 

        red = parseInt(red);
        blue = parseInt(blue);
        green = parseInt(green);

        if (isNaN(red) || isNaN(blue) || isNaN(green)) {
            throw new Error('Måste vara siffror');
        }

        if ((red < 0 || red > 255) || (blue < 0 || blue > 255) || (green < 0 || green > 255)) {
            throw new Error('Måste vara mellan 0-255');
        }

        fs.readFile(__dirname + '/lostFiles/html/index.html', function (err, data) { //Data är innehåller i filen 

            let serverDOM = new jsdom.JSDOM(data); //Bygger ett objekt 

            serverDOM.window.document.querySelector('#status').style.backgroundColor = 'rgb(' + red.toString() + ',' + green.toString() + ',' + blue.toString() + ')';

            data = serverDOM.serialize();

            response.send(data);
        });

    } catch (oError) {

        fs.readFile(__dirname + '/lostFiles/html/form.html', function (err, data) { //Data är innehåller i filen 

            let serverDOM = new jsdom.JSDOM(data); //Bygger ett objekt 

            serverDOM.window.document.querySelector('#errorMsg').textContent = oError.message;

            if (request.body.red !== undefined) {
                serverDOM.window.document.querySelector('[name = "red"]').setAttribute('value', request.body.red);
            }
            if (request.body.blue !== undefined) {
                serverDOM.window.document.querySelector('[name = "blue"]').setAttribute('value', request.body.blue);
            }
            if (request.body.green !== undefined) {
                serverDOM.window.document.querySelector('[name = "green"]').setAttribute('value', request.body.green);
            }

            data = serverDOM.serialize();
            response.send(data);
        });
    }
});


// Användaren ska inte kunna skicka ogiltuga värden 
//Exportera rätt katalog som static 