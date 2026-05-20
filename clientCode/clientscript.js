'use strict';

let socket = io();
let player = null;
let lastY = null;

//Händelse för att ta hand om uppdaterad position på bollen
socket.on('updateball', function (data) {
    
    let ball = document.getElementById('ball');
    ball.style.left = data.xpos + 'px';
    ball.style.top = data.ypos + 'px';

    //Kolla om träff på pad höger      
    if(data.xpos>=725 && data.xpos<=740) {
        let padPosition = document.getElementById('rightpad').style.top;
        padPosition = padPosition.slice(0, -2);

        if(data.ypos>=padPosition && data.ypos<=(parseInt(padPosition)+180)) {
            //Spela ping
            document.getElementById('ping').play();
            //Byt håll
            socket.emit('changedirection',null);
        }
    }
    

    //Vänster pad
    if(data.xpos<=55 && data.xpos>=40) {
        let padPosition = document.getElementById('leftpad').style.top;
        padPosition = padPosition.slice(0, -2);

        if(data.ypos>=padPosition && data.ypos<=(parseInt(padPosition)+180)) {
            //Spela ping
            document.getElementById('ping').play();
            //Byt håll
            socket.emit('changedirection',null);
        }
    }

});

//Händelse för att starta spelet
socket.on('startgame', function (data) {
    
    //Rensa main
    document.querySelector('main').innerHTML=null;

    //Bygg gränssnitt
    buildGUI(data.currentnick, data.opponentnick);

    //starta musik
    document.getElementById('in-game-music').play();

    //Lägg lyssnare på mus
    document.querySelector('main').addEventListener('mousemove', updatePadPosition);
    player = data.player; 

});

//Händelse för uppdatering av motståndarens pad
socket.on('updatePadPos', function (data) {
    
    if(player=='left') {
        document.getElementById('rightpad').style.top = data.Y + 'px';
    }
    else {
        document.getElementById('leftpad').style.top = data.Y + 'px';
    }
    
});

//Händelse för att hantera game over.
socket.on('gameover', function (data) {

        //stoppa musik
        document.getElementById('in-game-music').pause();

        //Tabort lyssnare på mus
        document.querySelector('main').removeEventListener('mousemove', updatePadPosition);

        //Skriv ut vinnare
        document.querySelector('main h1').textContent = 'Vinnare är ' + data.winner;

        //Lägg till spela-igen knapp
        let btn = document.createElement('a');
        let div = document.createElement('div');
        div.classList.add('w-100','text-center');

        btn.href='/';
        btn.classList.add('btn','btn-lg','btn-primary');
        btn.textContent = 'Spela igen?';
        div.appendChild(btn);
        document.querySelector('main').insertBefore(div, document.querySelector('main>div'));

        //Ta bort kakor
        document.cookie = 'player=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});

//Händelse för att hantera ping
socket.on('ping', function (data) {
    document.getElementById('ping').play(); 
});

//Funktion för att uppdatera position på Pad'en
function updatePadPosition(evt) {
    if(lastY==null) {
        lastY = evt.clientY;
    }
    else if(lastY != evt.clientY) {
        let delta = lastY - evt.clientY;
        lastY = evt.clientY;
        let padPosition;
        if(player === 'left') {
            padPosition = document.getElementById('leftpad').style.top;
            padPosition = padPosition.slice(0, -2);
            padPosition = parseInt(padPosition) - parseInt(delta);
            
            if(padPosition<0) padPosition = 0;
            else if( padPosition>320) padPosition = 320;

            document.getElementById('leftpad').style.top = padPosition + 'px';

            //Skicka ny padposition till server
            socket.emit('updatePadPos', padPosition);
            //console.log(padPosition);
        }
        else if(player === 'right') {
            padPosition = document.getElementById('rightpad').style.top;
            padPosition = padPosition.slice(0, -2);
            padPosition = parseInt(padPosition) - parseInt(delta);
            
            if(padPosition<0) padPosition = 0;
            else if( padPosition>320) padPosition = 320;

            document.getElementById('rightpad').style.top = padPosition + 'px';
            
            //Skicka ny padposition till server
            socket.emit('updatePadPos', padPosition);
            //console.log(padPosition);
        }
        
    }
} 

//Funktion för att bygga gränssnittet med spelplan
function buildGUI(mynick, opponentnick) {
    document.querySelector('html').style.height = '100%';
    document.querySelector('body').style.height = '100%';

    let h1 = document.createElement('h1');
    h1.textContent = mynick + ' vs. ' + opponentnick;
    h1.classList.add('text-center', 'w-100');
    document.querySelector('main').appendChild(h1);

    let gameArea = document.createElement('div');
    gameArea.style.width = '800px';
    gameArea.style.height = '500px';
    //gameArea.style.overflowX='scroll';
    gameArea.style.backgroundColor = 'silver';
    gameArea.style.position = 'relative';
    gameArea.style.border = '1px solid black';

    let leftPad = document.createElement('div');
    leftPad.setAttribute('id','leftpad');
    leftPad.style.width = '50px';
    leftPad.style.height = '180px';
    leftPad.style.position = 'absolute';
    leftPad.style.left = '5px';
    leftPad.style.top = '160px';
    leftPad.style.backgroundColor = 'black';

    gameArea.appendChild(leftPad);

    let rightPad = document.createElement('div');
    rightPad.setAttribute('id','rightpad');
    rightPad.style.width = '50px';
    rightPad.style.height = '180px';
    rightPad.style.position = 'absolute';
    rightPad.style.right = '5px';
    rightPad.style.top = '160px';
    rightPad.style.backgroundColor = 'black';

    gameArea.appendChild(rightPad);

    let ball = document.createElement('div');
    ball.setAttribute('id','ball');
    ball.style.width = '20px';
    ball.style.height = '20px';
    ball.style.position = 'absolute';
    ball.style.left = '390px';
    ball.style.top = '240px';
    ball.style.backgroundColor = 'black';

    gameArea.appendChild(ball);

    document.querySelector('main').style.display = 'flex';
    document.querySelector('main').style.height='100%';
    document.querySelector('main').style.justifyContent='center';
    document.querySelector('main').style.alignItems = 'center';
    document.querySelector('main').style.flexWrap = 'wrap';
    document.querySelector('main').appendChild(gameArea);
}