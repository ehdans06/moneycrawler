/*
 * 'ticker.js' file is collection of functions for getting cost of coins (=ticker).
 * key function is 'get_cost_data', which request cost data from KORBIT server, and pass it to external callback function.
 */

var request = require ('request');
var async = require ('async');
const ticker_uri = 'https://api.korbit.co.kr/v1/ticker/detailed';

// most recent cost data from server
var cost_data = {
    timestamp: 0,
    last: 'NULL',
    bid: 'NULL',
    ask: 'NULL',
    low: 'NULL',
    high: 'NULL',
    volume: 'NULL',
    change: 'NULL',
    changePercent: 'NULL'
};

var blank_cost_request = {
    method: 'GET',
    uri: 'NULL'
};

var get_cost_info_from_server = function (currency, cb) {
    if (!currency) {
        console.log ('critical error: fill the currency information.');
        process.exit(1);
    }
    var cost_request = blank_cost_request;
    cost_request.uri = ticker_uri + '?currency_pair=' + String (currency);
    request (cost_request, function (err, res, body) {
        if (!err && res && res.statusCode == 200) {
            cost_data = JSON.parse (body);
            cb (null, cost_data);
        }
        else {
            console.log ('critical error: cannot get cost information from server.');
            process.exit(1);
        }
    });
}

var get_cost_data = function (currency, cb) {
    async.waterfall ([
        function (callback) {
            get_cost_info_from_server (currency, callback);
        },
        function (data, callback) {
            callback (null, data);
        }
    ], cb);
}


module.exports = {
    get_cost_data: get_cost_data
};