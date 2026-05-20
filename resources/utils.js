
module.exports = {
    

    /* Funktion för att plocka ut kakor är strängen som returneras ifrån request.headers.cookie
       Tar emot strängen som ska parsas som invärde. (socket.handshake.headers.cookie)
       returnerar ett JS-objekt med nyckel-värde par innehållande de kakor som fanns i strängen  
    */
    parseCookies: function (rc) {

        let list = {};
        //*************************************************************************************** */
        //Funktion för att parsa cookie-sträng  
        rc && rc.split(';').forEach(function (cookie) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
        //Hämtad ifrån: https://stackoverflow.com/questions/45473574/node-js-cookies-not-working
        //*************************************************************************************** */
        return list;
    },

    isNumber: function(number){	
		if(isNaN(number)){
			return false;
		}
		return true;
	},
	
}
  

