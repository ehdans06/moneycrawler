var async = require ('async');
var ticker = require ('./ticker');

const FIRST_ESSET = 1000000;
var money = 1000000;
var profit = 0;
var coin = 0;

// 0: I have $, 1: I have coin
var state = 0;

// naive trade algorithm simulation
var algorithm = function (data, cb) {
    if (Number(data.low) == Number(data.last) && !state) {
        coin += (money/Number(data.last));
        money = 0;
    }
    if (Number(data.high) == Number(data.last) && state) {
        money += coin * Number(data.last);
        coin = 0;
    }
    profit = money + coin*Number(data.last) - FIRST_ESSET;
}

var simulation = function (currency) {
    ticker.get_cost_data (currency, function (err, data) {
        if (Number(data.low) == Number(data.last) && !state) {
            coin += (money/Number(data.last));
            money = 0;
        }
        if (Number(data.high) == Number(data.last) && state) {
            money += coin * Number(data.last);
            coin = 0;
        }
        profit = money + coin*Number(data.last) - FIRST_ESSET;
        console.log ('-------------------------------');
        console.log ('profit: ', profit);
        console.log ('money : ', money);
        console.log ('coin  : ', coin);
    });
}

module.exports = {
    simulation: simulation
};