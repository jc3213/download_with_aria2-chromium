chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('extension_name'),
    'id': 'downwitharia2',
    'contexts': ['link']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2(info.linkUrl, tab.url);
    }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    var capture = JSON.parse(localStorage.getItem('capture')) || false;
    if (capture) {
        if (item.referrer) {
            captureAdd(item);
        }
        else {
            chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
                item.referrer = tabs[0].url;
                captureAdd(item);
            });
        }
    }

    function captureAdd(item) {
        var captured = captureCheck(getDomain(item.referrer), item.filename.split('.').pop(), item.fileSize);
        if (captured) {
            chrome.downloads.cancel(item.id, () => {
                chrome.downloads.erase({'id': item.id}, () => {
                    downWithAria2(item.finalUrl, item.referrer);
                });
            });
        }
    }

    function getDomain(url) {
        var host = url.split(/[\/:]+/)[1];
        var temp = host.split('.').reverse();
        if ('com,net,org,edu,gov,co'.includes(temp[1])) {
            return temp[2] + '.' + temp[1] + '.' + temp[0];
        }
        return temp[1] + '.' + temp[0];
    }

    function captureCheck(domain, ext, size) {
        var ignored = localStorage.getItem('ignored');
        if (ignored && ignored.includes(domain)) {
            return false;
        }
        var monitored = localStorage.getItem('monitored');
        if (monitored && monitored.includes(domain)) {
            return true;
        }
        var fileExt = localStorage.getItem('fileExt');
        if (fileExt && fileExt.includes(ext)) {
            return true;
        }
        var fileSize = localStorage.getItem('fileSize');
        if (fileSize > 0 && size >= fileSize) {
            return true;
        }
        return false;
    }
});
