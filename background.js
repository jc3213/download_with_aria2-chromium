function matchPattern(pattern, string) {
console.log(pattern, string);
    var match = JSON.parse(pattern).filter(item => string.includes(item));
console.log(match);
    if (match.length !== 0) {
        return true;
    }
    return false;
}

function captureCheck(host, ext, size) {
    var ignored = localStorage.getItem('ignored');
    if (ignored && ignored !== '[]') {
        if (matchPattern(ignored, host)) {
            return false;
        }
    }
    var monitored = localStorage.getItem('monitored');
    if (monitored && monitored !== '[]') {
        if (matchPattern(monitored, host)) {
            return true;
        }
    }
    var fileExt = localStorage.getItem('fileExt');
    if (fileExt && fileExt !== '[]') {
        if (matchPattern(fileExt, ext)) {
            return true;
        }
    }
    var fileSize = localStorage.getItem('fileSize');
    if (fileSize && fileSize > 0) {
        if (size >= fileSize) {
            return true;
        }
    }
    return false;
}

function captureAdd(item) {
    var captured = captureCheck(item.referrer.split('/')[2], item.mime.split('/').pop(), item.fileSize);
    if (captured) {
        chrome.downloads.erase({'id': item.id}, () => {
            downWithAria2(item.finalUrl, item.referrer);
        });
    }
}

chrome.downloads.onCreated.addListener((item) => {
    var capture = JSON.parse(localStorage.getItem('capture')) || false;
    if (capture) {
        if (item.referrer) {
            captureAdd(item);
        }
        else {
            chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
                item.referrer = tab[0].url;
                captureAdd(item);
            });
        }
    }
});

chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('extension_name'),
    'id': 'downwitharia2',
    'contexts': ['link']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2(info.linkUrl, info.pageUrl);
    }
});
