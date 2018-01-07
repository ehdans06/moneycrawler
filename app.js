var request = require ('request');
var auth = require ('./modules/auth');
var simulation = require ('./modules/simulation');
var trader = require ('./modules/trader');

/***** login to KORBIT Server *****/
console.log ('login to korbit server...');
auth.auth_init (function (err) {
    if (err) {
        console.log ("critical error: error while auth_init.");
        process.exit (1);
    }
    else {
        console.log ('auth complete.');
    }
});

/*********** simulation ***********/
// setInterval (function () {
//     simulation.simulation ('xrp_krw');
// }, 1100);

/******** real transaction ********/
setInterval (function () {
    trader.auto_trader ('xrp_krw');
}, 3000);
