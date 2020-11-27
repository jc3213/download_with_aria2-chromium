function jsonRPCRequest(request, success, failure) {
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var json = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    var xhr = new XMLHttpRequest();
    xhr.open('POST', rpc, true);
    xhr.onloadend = () => {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.response);
            var result = response[0].result;
            var error = response[0].error;
            if (result && typeof success === 'function') {
                success(...response.map(item => item = item.result));
            }
            if (error && typeof failure === 'function') {
                failure(error.message);
            }
        }
        else {
            if (typeof failure === 'function') {
                failure('No Response', rpc);
            }
        }
    };
    xhr.send(JSON.stringify(json));

    function createJSON(request) {
        var token = localStorage.getItem('token') || '';
        var json = {
            'jsonrpc': 2.0,
            'method': request.method,
            'id': '',
            'params': ['token:' + token]
        };
        if (request.gid) {
            json.params.push(request.gid);
        }
        if (request.index) {
            json.params = json.params.concat(request.index);
        }
        if (request.url) {
            json.params.push([santilizeLoop(request.url)]);
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
                return santilizeLoop(url);
            }
        }
        return url;
    }
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
    if (!options['header']) {
        var useragent = localStorage.getItem('useragent') || navigator.userAgent;
        options['header'] = ['User-Agent: ' + useragent];
        if (session.referer) {
            chrome.cookies.getAll({'url': session.referer}, (cookies) => {
                options.header.push('Referer: ' + session.referer);
                options.header.push('Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' '));
            });
        }
    }

    jsonRPCRequest(
        {'method': 'aria2.addUri', 'url': session.url, 'options': options},
        (result) => showNotification('Downloading', session.url),
        (error, rpc) => showNotification(error, rpc || session.url)
    );
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: title,
        iconUrl: '/icons/icon48.png',
        message: message || ''
    };
    chrome.notifications.create(id, notification, () => {
        setTimeout(() => chrome.notifications.clear(id), 5000);
    });
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
    if (bytes >= 0 && bytes < 1024) {
        return bytes + ' B';
    }
    else if (bytes >= 1024 && bytes < 1048576) {
        return (bytes / 10.24 + 1 | 0) / 100 + ' KB';
    }
    else if (bytes >= 1048576 && bytes < 1073741824) {
        return (bytes / 10485.76 + 1 | 0) / 100 + ' MB';
    }
    else if (bytes >= 1073741824 && bytes < 1099511627776) {
        return (bytes / 10737418.24 + 1 | 0) / 100 + ' GB';
    }
    else if (bytes >= 1099511627776) {
        return (bytes / 10995116277.76 + 1 | 0) / 100 + ' TB';
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
