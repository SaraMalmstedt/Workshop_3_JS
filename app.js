// Lägg in din anmälningskod här
// Skriv ditt namn här
// Använda verktyg och tjänster (Exempelvis Visual studio Code, NodeJS, NPM, stackoverflow, ChatGPT)
'use strict';





//Ta emot changedirection-händelse från klient
socket.on('changedirection', function () {
    if(game.directionLock<0) {
        game.deltaX = game.deltaX * -1;
        //lägg på lås så inte riktning ändras igen inom 5 positionsuppdateringar.
        game.directionLock=5;
    }
});

//Funktion för att beräkna bollens rörelse
function timeout() {
    //uppdatera ballposition
    game.ballX = game.ballX + game.deltaX;
    game.ballY = game.ballY + game.deltaY;
    game.directionLock--;

    //Kontrollera krock nedåt,uppåt
    if(game.ballY<=0 || game.ballY>=480) {
        game.deltaY = game.deltaY * -1;
        io.emit('ping',null);
    }
    io.emit('updateball', {'xpos': game.ballX, 'ypos': game.ballY});
    //Ropa på funktion för att kontrollera om spelet är slut
    checkForGameOver();
}




