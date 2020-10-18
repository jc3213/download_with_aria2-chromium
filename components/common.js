function jsonRPCRequest(request, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    var json = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        var result = response[0].result;
        if (result) {
            return success(...response.map(item => item = item.result));
        }
        var error = response[0].error.message;
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

    function createJSON(request) {
        var token = localStorage.getItem('token') || '';
        var json = {
            'jsonrpc': 2.0,
            'method': request.method,
            'id': '',
            'params': [
                'token:' + token
            ]
        };
        if (request.gid) {
            json.params.push(request.gid);
        }
        if (request.index) {
            json.params = [...json.params, ...request.index];
        }
        if (request.url) {
            var url = santilizeLoop(request.url);
            json.params.push([url]);
        }
        if (request.options) {
            json.params.push(request.options);
        }
        return json;
    }

    function santilizeLoop(url) {
        var loop = url.match(/\[[^\[\]]+\]/g);
        var log = [];
        if (loop) {
            loop.map(item => {
                if (item.match(/\[\d+-\d+\]/)) {
                    log.push(item);
                }
                else {
                    url = url.replace(item, encodeURI(item));
                }
            });
            if (JSON.stringify(loop) !== JSON.stringify(log)) {
                return santilizeLoop(url)
            }
        }
        return url;
    }
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        'type': 'basic',
        'title': title,
        'iconUrl': '/icons/icon64.png',
        'message': message || ''
    };
    chrome.notifications.create(id, notification, () => {
        setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}

function downWithAria2(session) {
    var options = session.options || {};
    var proxied = localStorage.getItem('proxied') || '';
    if (session.proxy) {
        options['all-proxy'] = session.proxy;
    }
    else if (proxied.includes(session.domain)) {
        options['all-proxy'] = localStorage.getItem('allproxy') || '';
    }
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (options['header']) {
        sendRequest(options);
    }
    else {
        var useragent = localStorage.getItem('useragent') || navigator.userAgent;
        options['header'] = ['User-Agent: ' + useragent];
        if (session.referer) {
            chrome.cookies.getAll({'url': session.referer}, (cookies) => {
                options.header.push('Referer: ' + session.referer);
                options.header.push('Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' '));
                sendRequest(options);
            });
        }
        else {
            sendRequest(options);
        }
    }


    function sendRequest(options) {
        jsonRPCRequest(
            {'method': 'aria2.addUri', 'url': session.url, 'options': options},
            (result) => {
                showNotification('Downloading', session.url);
            },
            (error, rpc) => {
                showNotification(error, rpc || session.url || 'No URI to download');
            }
        );
    }
}

function domainFromUrl(url) {
    var host = url.split(/[\/:]+/)[1];
    var temp = host.split('.').reverse();
    if ('com,net,org,edu,gov,co'.includes(temp[1])) {
        return temp[2] + '.' + temp[1] + '.' + temp[0];
    }
    return temp[1] + '.' + temp[0];
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

function numberToTimeFormat(number) {
    if (isNaN(number) || number === Infinity) {
        return '∞';
    }
    var days = (number / 86400 | 0);
    var hours = (number / 3600 - days * 24 | 0);
    var minutes = (number / 60 - days * 1440 - hours * 60 | 0);
    var seconds = (number - days * 86400 - hours * 3600 - minutes * 60 | 0);
    var time = days + '<sub>d</sub>' + hours + '<sub>h</sub>' + minutes + '<sub>m</sub>' + seconds + '<sub>s</sub>';
    return time.replace(/(0<sub>[dhm]<\/sub>)*/, '');
}
