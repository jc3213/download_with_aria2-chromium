function downWithAria2(referer, url) {
    chrome.cookies.getAll({'url': referer}, (cookies) => {
        var params = {
            'header': [
                'Referer: ' + referer,
                'Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' ')
            ]
        }
        jsonRPCRequest(
            createJSON('aria2.addUri', {'url': url, 'params': [params]}),
            (result) => {
                showNotification('Downloading', url);
            },
            (error, rpc) => {
                showNotification(error, rpc || url);
            }
        );
    });
}

function getCookies(referer, callback) {
    chrome.cookies.getAll({'url': referer}, (cookies) => {
        callback({
            'header': [
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
    var ignored = localStorage.getItem('ignored');
    if (ignored && ignored !== '') {
        if (matchPattern(ignored, referer)) {
            return false;
        }
    }
    var monitored = localStorage.getItem('monitored');
    if (monitored && monitored !== '') {
        if (matchPattern(monitored, referer)) {
            return true;
        }
    }
    var fileext = localStorage.getItem('fileExt');
    if (fileext && fileext !== '') {
        if (matchPattern(fileext, item.finalUrl)) {
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

function captureAdd(item, referer) {
    var capture = captureCheck(item, referer);
    if (capture) {
        chrome.downloads.erase({'id': item.id}, () => {
            downWithAria2(referer, item.finalUrl);
        });
    }
}

chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('extension_name'),
    'id': 'downwitharia2',
    'contexts': ['link']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2(info.pageUrl, info.linkUrl);
    }
});

chrome.downloads.onCreated.addListener((item) => {
    var capture = JSON.parse(localStorage.getItem('capture')) || false;
    if (capture) {
        chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
            captureAdd(item, tabs[0].url);
        });
    }
});
