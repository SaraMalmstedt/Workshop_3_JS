module.exports = {
    playerOneNick: null, // Variabel för att spara nickname på spelare 1
    playerOneSpeed: null,  
    playerOneSocketId: null, // Variabel för att spara socket.id för spelare 1
    playerOneEnableSpeed: false,
    playerTwoNick: null, // Variabel för att spara nickname på spelare 2
    playerTwoSpeed: null, 
    playerTwoSocketId: null, // Variabel för att spara socket.id för spelare 2
    playerTwoEnableSpeed: false,

    reset : function(){
        this.playerOneNick=null;
        this.playerOneSpeed=null;
        this.playerOneSocketId=null;
        this.playerOneEnableSpeed=false;
        this.playerTwoNick=null;
        this.playerTwoSpeed=null;
        this.playerTwoSocketId=null;
        this.playerTwoEnableSpeed=false;
    }
}
