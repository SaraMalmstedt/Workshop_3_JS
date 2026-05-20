module.exports = {
    timerId : null, 
    ballX: 390,
    ballY: 240,
    deltaX: 8,
    deltaY: 2,
    directionLock: 5,
    timeInterval: null,
    increaseSpeedEnabled: false,

    increaseSpeed: function() {
        setTimeout(() => {
            if(this.timeInterval != null && this.increaseSpeedEnabled != false) {
                this.timeInterval = parseInt(parseInt(this.timeInterval) * 0.9);
                console.log('speed är nu ' + this.timeInterval);
                this.increaseSpeed();
            }
        }, 10000);
    },

    reset:function() {
        clearTimeout(this.timerId);
        this.timerId = null;
        this.ballX = 390;
        this.ballY = 240;
        this.deltaX = 4;
        this.deltaY = 1;
        this.directionLock = 5;
        this.timeInterval = null;
        this.increaseSpeedEnabled = false;
    }
}