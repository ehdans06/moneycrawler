/*
 * 'auth.js' file is collection of functions for authentication.
 * Key functions is 'login', 'refresh', 'get_user_info_from_server', 'auth_init', 'get_wallet_info_from_server'.
 * 'login' make user login to KORBIT server and set interval of refresh rate.
 * 'refresh' make auth of user not to been expired.
 * 'get_user_info_from_server' request server to send user information.
 * 'auth_init' is integrated function of login, refresh, get_user_info_from_server.
 * 'get_wallet_info_from_server' request server to send user wallet information; assets.
 */

var request = require ('request');
var async = require ('async');

// element for saving access_token & refresh_token
var data;
// element for saving user information
var user_info;
// element for saving wallet information
var wallet_info;

// Auth refresh rate
const REFRESH_RATE = 3000000;



var auth_request = {
    method: 'POST',
    uri: 'https://api.korbit.co.kr/v1/oauth2/access_token',
    form: {
        client_id: process.env.KORBIT_CLIENT_ID,
        client_secret: process.env.KORBIT_CLIENT_SECRET,
        username: process.env.KORBIT_USERNAME,
        password: process.env.KORBIT_PASSWORD,
        grant_type: 'password'
    }
};

var refresh_request = {
    method: 'POST',
    uri: 'https://api.korbit.co.kr/v1/oauth2/access_token',
    form: {
        client_id: process.env.KORBIT_CLIENT_ID,
        client_secret: process.env.KORBIT_CLIENT_SECRET,
        refresh_token: 'NULL',
        grant_type: 'refresh_token'
    }
}

var inform_request = {
    method: 'GET',
    uri: 'https://api.korbit.co.kr/v1/user/info',
    headers: {
        Authorization: 'NULL'
    }
}

var wallet_request = {
    method: 'GET',
    uri: 'https://api.korbit.co.kr/v1/user/balances',
    headers: {
        Authorization: 'NULL'
    }
}

var refresh = function () {
    refresh_request.form.refresh_token = data.refresh_token;
    request (refresh_request, function (err, res, body) {
        if (!err && (res && res.statusCode) == 200) {
            data = JSON.parse (body);
            console.log ('refresh auth success.');
        }
        else {
            console.log ('critical error: cannot refresh Auth.');
            process.exit (1);
        }
    });
}

var login = function (cb) {
    request (auth_request, function (err, res, body) {
        if (!err && (res && res.statusCode) == 200) {
            data = JSON.parse (body);
            console.log ('login success.');
            cb (null);
        }
        else {
            console.log ('critical error: cannot login to KORBIT server.');
            process.exit (1);
        }
    });
}

var get_user_info_from_server = function (cb) {
    inform_request.headers.Authorization = 'Bearer ' + data.access_token;
    request (inform_request, function (err, res, body) {
        if (!err && (res && res.statusCode) == 200) {
            user_info = JSON.parse (body);
            console.log ('get user info success.');
            cb (null);
        }
        else {
            console.log ('critical error: cannot get user info from KORBIT server.');
            process.exit (1);
        }
    });
}

var auth_init = function (cb) {
    async.waterfall ([
        function (callback) {
            login (callback);
        },
        function (callback) {
            // if a system is in danger of expiring, refresh immediately
            if (data.expires_in <= (REFRESH_RATE/1000))
                refresh ();
            setInterval(refresh, REFRESH_RATE);
            console.log ('set refresh interval as %ds.', (REFRESH_RATE/1000));
            callback (null);
        },
        function (callback) {
            get_user_info_from_server (callback);
        }
    ], cb);
}

var get_wallet_info_from_server = function (cb) {
    wallet_request.headers.Authorization = 'Bearer ' + data.access_token;
    request (wallet_request, function (err, res, body){
        if (!err && (res && res.statusCode) == 200) {
            wallet_info = JSON.parse (body);
            console.log ('get wallet info success.');
            cb (null, wallet_info);
        }
        else {
            console.log ('critical error: cannot get wallet info from KORBIT server.');
            process.exit (1);
        }
    });
}

var get_access_token = function (cb) {
    cb(data.access_token);
}

var get_refresh_token = function (cb) {
    cb (data.refresh_token);
}

var get_user_info = function (cb) {
    cb (user_info);
}

module.exports = {
    auth_init: auth_init,
    get_wallet_info_from_server: get_wallet_info_from_server,
    get_access_token: get_access_token,
    get_refresh_token: get_refresh_token,
    get_user_info: get_user_info
};