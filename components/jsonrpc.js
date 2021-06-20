var storage;

chrome.storage.sync.get(null, (result) => {
    storage = result;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    Object.keys(changes).forEach(key => {
        storage[key] = changes[key].newValue;
    });
});

function jsonRPCRequest(request, success, failure) {
    var rpc = storage['jsonrpc'];
    var json = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    fetch(rpc, {method: 'POST', body: JSON.stringify(json)})
    .catch(error => {
        if (typeof failure === 'function') {
            failure('No Response', rpc);
        }
    })
    .then(response => response.json())
    .then(json => {
        var result = json[0].result;
        var error = json[0].error;
        if (result && typeof success === 'function') {
            success(...json.map(item => item.result));
        }
        if (error && typeof failure === 'function') {
            failure(error.message);
        }
    });

    function createJSON(request) {
        var params = ['token:' + storage['token']];
        if (request.gid) {
            params.push(request.gid);
        }
        if (request.index) {
            params.push(...request.index);
        }
        if (request.url) {
            params.push(request.url);
        }
        if (request.add) {
            params.shift();
            params.push(1, [], [request.add]);
        }
        if (request.remove) {
            params.shift();
            params.push(1, [request.remove], []);
        }
        if (request.options) {
            params.push(request.options);
        }
        return {jsonrpc: 2.0, method: request.method, id: '', params};
    }
}

function downWithAria2(session, options = {}, bypass = false) {
    if (!session.url) {
        return;
    }
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (bypass) {
        return sendRPCRequest();
    }
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && storage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = storage['allproxy'];
    }
    options['header'] = ['User-Agent: ' + storage['useragent'], 'Connection: Keep-Alive'];
    if (!session.referer) {
        return sendRPCRequest();
    }
    chrome.cookies.getAll({url: session.referer}, (cookies) => {
        var cookie = 'Cookie:';
        cookies.forEach(item => cookie += ' ' + item.name + '=' + item.value + ';');
        options['header'].push(cookie, 'Referer: ' + session.referer);
        sendRPCRequest();
    });

    function sendRPCRequest() {
        jsonRPCRequest(
            {method: 'aria2.addUri', url, options},
            (result) => {
                showNotification('Aria2 Download' , url.join('\n'));
            },
            (error, rpc) => {
                showNotification(error, rpc || url.join('\n'));
            }
        );
    }
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: title || 'Aria2 Response',
        iconUrl: '/icons/icon48.png',
        message: message || ''
    };
    chrome.notifications.create(id, notification, () => {
        setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}
