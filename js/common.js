function createJSON(method, options) {
    var token = localStorage.getItem('token') || '';
    var json = {
        'jsonrpc': 2.0,
        'method': method,
        'id': '',
        'params': [
            'token:' + token
        ]
    };
    if (options) {
        if (options.gid) {
            json.params.push(options.gid);
        }
        if (options.url) {
            json.params.push([options.url]);
        }
        if (options.params) {
            json.params = [...json.params, ...options.params];
        }
    }
    return json;
}

function jsonRPCRequest(json, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (json.length) {
            var result = response.map(item => item = item.result);
            if (result[0]) {
                return success(...result);
            }
            var error = response.map(item => item = item.error);
            if (error[0]) {
                error = error[0].message;
            }
        }
        else {
            if (response.result) {
                return success(response.result);
            }
            if (response.error) {
                error = error.message;
            }
        }
        if (error === 'Unauthorized') {
            return failure(error, rpc);
        }
        failure(error);
    };
    xhr.onerror = () => {
        failure('No response', rpc);
    };
    xhr.send(JSON.stringify(json));
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        'type': 'basic',
        'title': title,
        'iconUrl': 'icons/icon64.png',
        'message': message
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
            downloadRequest(createJSON('aria2.addUri', {'url': url, 'params': [params]}), url);
        });
    }
    else {
        downloadRequest(createJSON('aria2.addUri', {'url': url}), url);
    }
}

function downloadRequest(json, url) {
    jsonRPCRequest(
        json,
        (result) => {
            showNotification('Downloading', url);
        },
        (error, rpc) => {
            showNotification(error, rpc || url);
        }
    );
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
    if (number.toString().length >= decimal ) {
        return number;
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
    var time = multiDecimalNumber(hours, 2) + 'h' + multiDecimalNumber(minutes, 2) + 'm' + multiDecimalNumber(seconds, 2) + 's';
    return time.replace(/(00[hms])*/, '');
}
