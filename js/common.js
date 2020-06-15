function createJSON(method, options) {
    var token = localStorage.getItem('token') || '';
    var json = {
        jsonrpc: 2.0,
        method: method,
        id: '',
        params: [
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
            var result = response.filter(item => item.result);
            if (result.length !== 0) {
                return success(...result.map(item => item = item.result));
            }
            var error = response.filter(item => item.error);
            if (error.length !== 0) {
                return failure(error[0].error.message);
            }
        }
        else {
            if (response.error) {
                failure(error.message);
            }
            else if (response.result) {
                success(response.result);
            }
        }
    };
    xhr.onerror = () => {
        failure('No Response');
    };
    xhr.send(JSON.stringify(json));
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: title,
        iconUrl: 'icons/icon64.png',
        message: message || localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc'
    };
    chrome.notifications.create(id, notification, () => {
        window.setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}
