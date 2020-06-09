function downWithAria2(url, params) {
    jsonRPCRequest(
        createJSON('aria2.addUri', '', [[url], params]),
        (response) => {
            if (response.result) {
                showNotification('Start Downloading', url);
            }
            else if (response.error) {
                showNotification('Authentication Failure');
            }
        },
        (event) => {
            showNotification('No Response from RPC Server');
        }
    );
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
        callback({
            header: [
                'Referer: ' + referer,
                'Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' ')
            ]
        });
    })
}

function matchPattern(pattern, url) {
    var regexp = new RegExp(pattern, 'gi');
    return regexp.test(url);
}

function captureCheck(item, referer) {
    var ignored = localStorage.getItem('nor_pattern');
    if (ignored && ignored !== '') {
        if (matchPattern(ignored, referer)) {
            return false;
        }
    }
    var monitored = localStorage.getItem('mon_pattern');
    if (monitored && monitored !== '') {
        if (matchPattern(monitored, referer)) {
            return true;
        }
    }
    var fileext = localStorage.getItem('ext_pattern');
    if (fileext && fileext !== '') {
        if (matchPattern(fileext, item.finalUrl)) {
            return true;
        }
    }
    var size = localStorage.getItem('size_number');
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
    var capture = localStorage.getItem('capture') === 'true' ? true: false;
    if (capture) {
        chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
            captureAdd(item, tabs[0].url);
        });
    }
});
