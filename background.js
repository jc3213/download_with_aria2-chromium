function downWithAria2(url, params) {
    jsonRPCRequest(
        createJSON('aria2.addUri', '', [[url], params]),
        (result) => {
            showNotification('jsonrpc_download', url);
        },
        (error) => {
            showNotification(error);
        }
    );
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: chrome.i18n.getMessage(title),
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

function captureCheck(item) {
    var ignored = localStorage.getItem('ignored');
    if (ignored && ignored !== '') {
        if (matchPattern(ignored, item.referrer)) {
            return false;
        }
    }
    var monitored = localStorage.getItem('monitored');
    if (monitored && monitored !== '') {
        if (matchPattern(monitored, tem.referrer)) {
            return true;
        }
    }
    var fileext = localStorage.getItem('fileExt');
    if (fileext && fileext !== '') {
        if (matchPattern(fileext, item.filename)) {
            return true;
        }
    }
    var filesize = localStorage.getItem('fileSize');
    if (filesize && filesize > 0) {
        if (item.fileSize >= filesize) {
            return true;
        }
    }
    return false;
}

function captureAdd(item) {
    var capture = captureCheck(item);
    if (capture) {
        getCookies(item.referrer, (params) => {
            chrome.downloads.erase({'id': item.id}, () => {
                downWithAria2(item.finalUrl, params);
            });
        });
    }
}

chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link'],
    onclick: (info, tab) => {
        getCookies(info.pageUrl, (params) => {
            downWithAria2(info.linkUrl, params);
        });
    }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    var capture = JSON.parse(localStorage.getItem('capture')) || false;
console.log(item);
    if (capture) {
        captureAdd(item);
    }
});
