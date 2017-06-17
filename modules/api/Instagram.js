const fs = require("fs");
const path = require("path");
const rp = require("request-promise");

var method = Instagram.prototype;
var _store = {};

function Instagram() {
    _store.data = [];
    return;
}

method.Setup = function () {
    var httpConnection = {
        method: "GET",
        uri: "https://www.instagram.com/",
        gzip: true,
        resolveWithFullResponse: true,

        headers: {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.8,fr;q=0.6,ro;q=0.4,ru;q=0.2",
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://www.instagram.com",
            "referer": "https://www.instagram.com/",
            "upgrade-insecure-requests": "1"
        }
    };

    return rp(httpConnection)
        .then((response) => {
            _ICookieManager(response.headers["set-cookie"]);
            return;
        });
}

method.Authenticate = function (username, password) {
    var httpConnection = {
        method: "POST",
        uri: "https://www.instagram.com/accounts/login/ajax/",
        gzip: true,
        resolveWithFullResponse: true,

        headers: {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.8,fr;q=0.6,ro;q=0.4,ru;q=0.2",
            "content-type": "application/x-www-form-urlencoded",
            "cookie": _store.raw,
            "origin": "https://www.instagram.com",
            "referer": "https://www.instagram.com/",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36",
            "x-csrftoken": _store.csrf,
            "x-instagram-ajax": "1",
            "x-requested-with": "XMLHttpRequest"
        },

        form: {
            "username": username,
            "password": password
        }
    };

    return rp(httpConnection)
        .then((response) => {
            var parsedResp = JSON.parse(response.body);
            if (parsedResp.authenticated) {
                _ICookieManager(response.headers["set-cookie"]);
                console.log(_store);
            } else {
                //failed
            }
        })

        .catch((e) => {
            //logger.info("Something went wrong when logging in: " + error);
            console.log(e);
            console.log(_store);
        });
}

function _ICookieManager(cookies) {
    var csrf = /csrftoken=/g;

    for (var i = 0; i < cookies.length; i++) {
        if (csrf.test(cookies[i])) {
            csrf = /csrftoken=([a-zA-Z0-9]+)/g;
            _store.csrf = csrf.exec(cookies[i])[1];
        }

        var cookie = cookies[i].split(";")[0];
        var cookieKey = cookie.split("=")[0];
        var cookieValue = cookie.split("=")[1];



        /* Check if the cookie already exists and replace it */
        var exists = false;
        var existsKey = -1;

        if (_store.data.length > 0) {
            for (var j = 0; j < _store.data.length; j++) {
                if (_store.data[j].key == cookieKey) {
                    exists = true;
                    existsKey = j;
                }
            }
        }

        if (exists) {
            _store.data[existsKey].value = cookieValue;
        } else {
            var ICookie = {};
            ICookie.key = cookieKey;
            ICookie.value = cookieValue;

            _store.data.push(ICookie);
        }
    }
    
    _store.raw = "";
    for (var key in _store.data) {
        _store.raw += _store.data[key].key + "=" + _store.data[key].value + ";";
    }

    return;
}

function IGException(eid) {
    // Exception function, kinda messy.

    switch (eid) {
        case "EX_SQL_FILE_BUFFER_READ":
            this.eid = eid;
            this.message = "The SQL database file could not be read into the buffer.";
            this.suggestions = [];
            break;
        case "EX_SQL_FILE_BUFFER_EDIT":
            this.eid = eid;
            this.message = "The SQL database file could not be written to.";
            this.suggestions = [];
            break;
        case "EX_SQL_RUN":
            this.eid = eid;
            this.message = "The SQL run command failed.";
            this.suggestions = [];
            break;
        default:
            this.eid = eid;
            this.message = "An unknown exception occurred";
            this.suggestions = [];
            break;
    }
}

module.exports = Instagram;