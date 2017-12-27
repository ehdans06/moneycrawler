var express = require ('express');
var request = require ('request');
// var auth = require ('./modules/auth');
// var ticker = require ('./modules/ticker');
var algorithm = require ('./modules/algorithm');
var app = express ();

/***** login to KORBIT Server *****/
// console.log ('login to korbit server...');
// auth.login ();

/***** access cost info *****/
setInterval (function () {
    algorithm.simulation ('xrp_krw');
}, 1500);
