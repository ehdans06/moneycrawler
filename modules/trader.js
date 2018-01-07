/*
 * 'trader.js' file is collection of functions for bid & ask transaction request.
 *  key function is
 */

var request = require ('request');
var async = require ('async');

var auth = require ('./auth');
var ticker = require ('./ticker');

// current states
var current_state = {
    state: 0,           // 0: I have $ (bid timing sicking mode), 1: I have coin (ask timing sicking mode)
    money: 0,           // how much money I have; 'krw'
    coin: 0,            // how much coin I have; type of coin is based on currency option of 'app.js' file
    first_asset: -1,    // asset state when initiate program
    current_asset: 0,   // current asset
    profit: 0,          // profit
    nonce: 1            // next nonce
};

// bid (buy coins) request element
var bid_request = {
    method: 'POST',
    uri: 'https://api.korbit.co.kr/v1/user/orders/buy',
    headers: {
        Authorization: 'NULL'
    },
    form: {
        currency_pair: 'NULL',
        type: 'NULL',
        // price: 'NULL',
        // coin_amount: 'NULL',
        flat_amount: 'NULL',
        nonce: 0
    }
};

// ask (sell coins) request element
var sell_request = {
    method: 'POST',
    uri: 'https://api.korbit.co.kr/v1/user/orders/sell',
    headers: {
        Authorization: 'NULL'
    },
    form: {
        currency_pair: 'NULL',
        type: 'NULL',
        // price: 'NULL',
        coin_amount: 'NULL',
        nonce: 0
    }
};

// calculate current state based on wallet data.
var calc_state = function (wallet_data, currency, cost_data, cb) {
    
    // set available coin & money (krw)
    if (currency == 'btc_krw') {
        current_state.coin = Number(wallet_data.btc.available);
    }
    else if (currency == 'etc_krw') {
        current_state.coin = Number(wallet_data.etc.available);
    }
    else if (currency == 'eth_krw') {
        current_state.coin = Number(wallet_data.eth.available);
    }
    else if (currency == 'xrp_krw') {
        current_state.coin = Number(wallet_data.xrp.available);
    }
    else if (currency == 'bch_krw') {
        current_state.coin = Number(wallet_data.bch.available);
    }
    current_state.money = Number(wallet_data.krw.available);

    // set state; bid timing sicking mode / ask timing sicking mode
    if (current_state.money >= current_state.coin*Number(cost_data.last)) {
        current_state.state = 0;  // bid timing sicking mode
    }
    else {
        current_state.state = 1;  // ask timing sicking mode
    }

    // set current_asset
    current_state.current_asset = current_state.money + current_state.coin*Number(cost_data.last);
    
    // set first_asset
    if (current_state.first_asset == -1) {
        current_state.first_asset = Number(current_state.current_asset);
    }
    
    // set current profit
    current_state.profit = current_state.current_asset - current_state.first_asset;
    // console.log (cost_data);
    // console.log (wallet_data);
    // console.log (current_state);
    cb (null);
}

// trading algorithm which makes decision; bid, ask, or stay.
// test version
var algorithm = function (cost_data, cb) {
    var trade_opt = 0; // no trade
    if (!current_state.state) {
        trade_opt = 1; // bid (buy)
    }
    else if (current_state.state) {
        trade_opt = 2; // ask (sell)
    }
    cb (null, trade_opt);
}

// trading algorithm which makes decision; bid, ask, or stay.
// very naive version
// var algorithm = function (cost_data, cb) {
//     var trade_opt = 0; // no trade
//     if (Number(cost_data.low) == Number(cost_data.last) && !current_state.state) {
//         trade_opt = 1; // bid (buy)
//     }
//     else if (Number(cost_data.high) == Number(cost_data.last) && current_state.state) {
//         trade_opt = 2; // ask (sell)
//     }
//     cb (null, trade_opt);
// }

var error_msg;

// send trade request to server (coping both bid and ask transaction)
var send_trade_request_to_server = function (trade_opt, currency, cb) {
    if (trade_opt != 0) {
        if (trade_opt == 1) { // buy coins (bid)
            auth.get_access_token (function (access_token) {
                bid_request.headers.Authorization = 'Bearer ' + String(access_token);
                bid_request.form.currency_pair = currency;
                bid_request.form.type = 'market';
                bid_request.form.flat_amount = current_state.money;
                bid_request.form.nonce = current_state.nonce;
                current_state.nonce++;
                request (bid_request, function (err, res, body) {
                    if (!err && res && res.statusCode == 200) {
                        console.log ('bid trade success!');
                        cb (null, cost_data);
                    }
                    else {
                        console.log ('critical error: cannot buy(bid) coin (server communication error)');
                        process.exit(1);
                    }
                })
            });
        }
        else if (trade_opt == 2) { // sell coins (ask)
            auth.get_access_token (function (access_token) {
                sell_request.headers.Authorization = 'Bearer ' + String(access_token);
                sell_request.form.currency_pair = currency;
                sell_request.form.type = 'market';
                sell_request.form.coin_amount = current_state.coin;
                sell_request.form.nonce = current_state.nonce;
                current_state.nonce++;
                request (sell_request, function (err, res, body) {
                    if (!err && res && res.statusCode == 200) {
                        console.log ('bid trade success!');
                        cb (null, cost_data);
                    }
                    else {
                        console.log ('critical error: cannot sell(ask) coin (server communication error)');
                        process.exit(1);
                    }
                })
            });
        }
    }
    cb (null);
}

var auto_trader = function (currency) {
    // 1. get cost data from server ('data')
    ticker.get_cost_data (currency, function (err, data) {
        if (err) {
            console.log ('critical error: fail to get cost data.');
            process.exit (1);
        }
        else {
            async.waterfall ([
                // 2. get wallet_data from server ('wallet_data')
                function (callback) {
                    auth.get_wallet_info_from_server (callback);
                },
                // 3. calculate current state based on wallet_data & cost_data
                function (wallet_data, callback) {
                    calc_state (wallet_data, currency, data, callback);
                },
                // 4. make bid/ask disicion based on wallet_data & cost_data
                function (callback) {
                    algorithm (data, callback);
                },
                // 5. request bid/ask transaction 
                function (trade_opt, callback) {
                    send_trade_request_to_server (trade_opt, currency, callback);
                }
            ], 
            // 6. log current state (asset, profit)
            function (err) {
                if (err) {
                    console.log ('critical error: auto trading failed.');
                    process.exit (1);
                }
                else {
                    console.log ('current asset: ', current_state.current_asset);
                    console.log ('total profit : ', current_state.profit);
                }
            });
        }
    });
}

module.exports = {
    auto_trader: auto_trader
}