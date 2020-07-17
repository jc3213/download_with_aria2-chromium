function jsonRPCRequest(options, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    if (options.length) {
        var json = options.map(item => createJSON(item));
    }
    else {
        json = createJSON(options);
    }
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (json.length) {
            var error = multiRequest(response);
        }
        else {
            error = singleRequest(response);
        }
        if (error) {
            if (error === 'Unauthorized') {
                failure(error, rpc);
            }
            else {
                failure(error);
            }
        }
    };
    xhr.onerror = () => {
        failure('No response', rpc);
    };
    xhr.send(JSON.stringify(json));

    function createJSON(options) {
        var token = localStorage.getItem('token') || '';
        var json = {
            'jsonrpc': 2.0,
            'method': options.method,
            'id': '',
            'params': [
                'token:' + token
            ]
        };
        if (options.gid) {
            json.params.push(options.gid);
        }
        if (options.url) {
            if (!options.url.match(/\[\d+-\d+\]/)) {
                options.url = options.url.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
            }
            json.params.push([options.url]);
        }
        if (options.params) {
            json.params = [...json.params, ...options.params];
        }
        return json;
    }

    function multiRequest(response) {
        var result = response.map(item => item = item.result);
        if (result[0]) {
            return success(...result);
        }
        var error = response.map(item => item = item.error);
        if (error[0]) {
            return error[0].message;
        }
    }

    function singleRequest(response) {
        if (response.result) {
            return success(response.result);
        }
        if (response.error) {
            return response.error.message;
        }
    }
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        'type': 'basic',
        'title': title,
        'iconUrl': 'icons/icon64.png',
        'message': message || ''
    };
    chrome.notifications.create(id, notification, () => {
        setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}

function downWithAria2(url, referer) {
    if (referer) {
        chrome.cookies.getAll({'url': referer}, (cookies) => {
            var params = {
                'header': [
                    'Referer: ' + referer,
                    'Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' ')
                ]
            }
            sendRequest({'method': 'aria2.addUri', 'url': url, 'params': [params]}, url);
        });
    }
    else {
        sendRequest({'method': 'aria2.addUri', 'url': url}, url);
    }

    function sendRequest(options, url) {
        jsonRPCRequest(
            options,
            (result) => {
                showNotification('Downloading', url);
            },
            (error, rpc) => {
                showNotification(error, rpc || url || 'No URI to download');
            }
        );
    }
}

function bytesToFileSize(bytes) {
    var KBytes = 1024;
    var MBytes = 1048576;
    var GBytes = 1073741824;
    var TBytes = 1099511627776;
    if (bytes >= 0 && bytes < KBytes) {
        return bytes + ' B';
    }
    else if (bytes >= KBytes && bytes < MBytes) {
        return (bytes / KBytes * 100 + 1 | 0) / 100 + ' KB';
    }
    else if (bytes >= MBytes && bytes < GBytes) {
        return (bytes / MBytes * 100 + 1 | 0) / 100 + ' MB';
    }
    else if (bytes >= GBytes && bytes < TBytes) {
        return (bytes / GBytes * 100 + 1 | 0) / 100 + ' GB';
    }
    else if (bytes >= TBytes) {
        return (bytes / TBytes * 100 + 1 | 0) / 100 + ' TB';
    }
    else {
        return bytes + ' B';
    }
}

function multiDecimalNumber(number, decimal) {
    decimal = decimal || 2;
    if (number.toString().length >= decimal ) {
        return number.toString();
    }
    var result = number + Math.pow(10, decimal);
    return result.toString().substr(1);
}

function secondsToHHMMSS(number) {
    if (isNaN(number)) {
        return '-';
    }
    if (number === Infinity) {
        return '∞';
    }
    var hours = (number / 3600 | 0);
    var minutes = ((number - hours * 3600) / 60 | 0);
    var seconds = (number - hours * 3600 - minutes * 60 | 0);
    var time = multiDecimalNumber(hours) + 'h' + multiDecimalNumber(minutes) + 'm' + multiDecimalNumber(seconds) + 's';
    return time.replace(/(00[hms])*/, '');
}
