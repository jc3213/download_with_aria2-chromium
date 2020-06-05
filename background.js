function downWithAria2(url, params) {
    var xhr = new XMLHttpRequest();
    var rpc = localStorage.getItem('aria2rpc') || 'http://localhost:6800/jsonrpc';
    var token = localStorage.getItem('aria2secret') || '';
    var json = {
        jsonrpc: 2.0,
        method: 'aria2.addUri',
        id: '',
        params: [
            'token:' + token,
            [url],
            params
        ]
    };
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (response.result) {
            showNotification('Start Downloading', url);
        }
        else if (response.error) {
            showNotification('Authentication Failure');
        }
    };
    xhr.onerror = (event) => {
        showNotification('No Response from RPC Server');
    };
    xhr.send(JSON.stringify(json));
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: title,
        iconUrl: 'icons/icon64.png'
    };
    if (message) {
        notification.message = message;
    }
    chrome.notifications.create(id, notification, () => {
        window.setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}

function getCookies(referer, callback) {
    var cache = [];
    chrome.cookies.getAll({'url': referer}, (cookies) => {
        for (i = 0; i < cookies.length; i ++) {
            var cookie = cookies[i];
            cache.push(cookie.name + '=' + cookie.value + ';');
        }
        var params = {
            referer: referer,
            header: 'Cookie: ' + cache.join(' ')
        }
        callback(params);
    })
}

function matchPattern(pattern, url) {
    var regexp = new RegExp(pattern, 'gi');
    return regexp.test(url);
}

function captureCheck(item, referer) {
    'use strict';
    if (item.finalUrl.startsWith('blob')) {
        return false;
    }
    var black = localStorage.getItem('blackpattern');
    if (black && black !== '') {
        if (matchPattern(black, referer)) {
            return false;
        }
    }
    var white = localStorage.getItem('whitepattern');
    if (white && white !== '') {
        if (matchPattern(white, referer)) {
            return true;
        }
    }
    var fileext = localStorage.getItem('extpattern');
    if (fileext && fileext !== '') {
        if (matchPattern(fileext, item.finalUrl)) {
            return true;
        }
    }
    var size = localStorage.getItem('sizenumber');
    if (size && size > 0) {
        if (item.fileSize >= size) {
            return true;
        }
    }
    return false;
}

function captureAdd(item, referer) {
    var capture = captureCheck(item, referer);
    if (capture) {
        getCookies(referer, (params) => {
            chrome.downloads.erase({'id': item.id}, () => {
                downWithAria2(item.finalUrl, params);
            });
        });
    }
}

chrome.contextMenus.create({
    title: 'Download with Aria2',
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2') {
        getCookies(info.pageUrl, (params) => {
            downWithAria2(info.linkUrl, params);
        });
    }
});

chrome.downloads.onCreated.addListener((item) => {
    var capture = localStorage.getItem('capture');
    if (capture === 'true' || capture === true) {
        chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
            captureAdd(item, tabs[0].url);
        });
    }
});
