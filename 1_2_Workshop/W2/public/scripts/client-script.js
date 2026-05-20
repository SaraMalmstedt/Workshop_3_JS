'use strict';
const socket = io();

let knapps = document.querySelectorAll('.birdbutton');

for(let i = 0 ; i< knapps.length; i++) {
    knapps[i].addEventListener('click', ettnamn);
}

function ettnamn(e) {
    e.preventDefault();
    socket.emit('newBackground', e.target.getAttribute('data-birdid'));

}

socket.on('byt', function(data) {
    document.querySelector('body').style.backgroundImage = 'url(public/images/' + data.bildnr + '.jpg)';
    document.querySelector('.lead').textContent = 'Bilden uppdaterades av ' + data.nick;


});