var async = require ('async');
var ticker = require ('./ticker');

const FIRST_ASSET = 1000000;
var money = 1000000;
var profit = 0;
var coin = 0;

// 0: I have $, 1: I have coin
var state = 0;

// price when I buy
var my_price = 0;

// naive trade algorithm
var algorithm = function (data, cb) {
    var trade_opt = 0; // no trade
    if (Number(data.low) == Number(data.last) && !state) {
        trade_opt = 1; // bid (buy)
        state = 1;
    }
    else if (Number(data.high) == Number(data.last) && state) {
        trade_opt = 2; // ask (sell)
        state = 0;
    }
    cb (null, trade_opt);
}

// little bit advanced algorithm
var algorithm = function (data, cb) {
    var trade_opt = 0;
    if (state == 0) {
        my_price = Number(data.last);
        trade_opt = 1;
        state = 1;
    }
    else if (my_price < Number(data.last) && state == 1) {
        my_price = 0;
        trade_opt = 2;
        state = 0;
    }
    cb (null, trade_opt);
}


var simulation = function (currency) {
    ticker.get_cost_data (currency, function (err, data) {
        if (err) {
            console.log ('critical error: fail to get cost data.');
            process.exit (1);
        }
        else {
            async.waterfall ([
                function (callback) {
                    algorithm (data, callback);
                }
            ], function (err, trade_opt) {
                if (trade_opt == 1) {
                    coin += (money/Number(data.last));
                    money = 0;
                }
                else if (trade_opt == 2) {
                    money += coin * Number(data.last);
                    coin = 0;
                }
                profit = money + coin*Number(data.last) - FIRST_ASSET;
                console.log ('-------------------------------');
                // console.log (data);
                console.log ('trade_opt: ', trade_opt);
                console.log ('profit: ', profit);
                console.log ('money : ', money);
                console.log ('coin  : ', coin);
            });
        }
    });
}

module.exports = {
    algorithm: algorithm,
    simulation: simulation
};