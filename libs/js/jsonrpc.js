function aria2RPCKeepAlive() {
    if (window.aria2RPCClient) {
        clearInterval(window.keepAlive);
        window.keepAlive = setInterval(aria2RPCClient, aria2RPC.jsonrpc['refresh']);
    }
}

function aria2RPCLoader(callback) {
    chrome.storage.sync.get(null, result => {
        aria2RPC = result;
        callback();
    });
}

chrome.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        aria2RPC[key] = changes[key].newValue;
        if (key === 'jsonrpc') {
            aria2RPCKeepAlive();
        }
    });
});

function aria2RPCRequest(request, resolve, reject) {
    var requestJSON = Array.isArray(request) ? request : [request];
    return fetch(aria2RPC.jsonrpc['uri'], {method: 'POST', body: JSON.stringify(requestJSON)}).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw(response.statusText);
        }
    }).then(responseJSON => {
        var {result, error} = responseJSON[0];
        if (result && typeof resolve === 'function') {
            resolve(...responseJSON.map(item => item.result));
        }
        if (error) {
            throw(error.message);
        }
    }).catch(error => {
        if (typeof reject === 'function') {
            reject(error);
        }
    });
}

function showNotification(message = '') {
    chrome.notifications.create({
        type: 'basic',
        title: aria2RPC.jsonrpc['uri'],
        iconUrl: '/icons/icon48.png',
        message: message
    }, id => {
        setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}
