chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('extension_name'),
    'id': 'downwitharia2',
    'contexts': ['link']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({'url': info.linkUrl, 'referer': tab.url, 'domain': domainFromUrl(tab.url)});
    }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (item.finalUrl.startsWith('blob')) {
        return;
    }

    var capture = (localStorage.getItem('capture') | 0);
    if (capture > 0) {
        if (item.referrer) {
            captureAdd(capture, item);
        }
        else {
            chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
                item.referrer = tabs[0].url;
                captureAdd(capture, item);
            });
        }
    }

    function captureAdd(capture, item) {
        var domain = domainFromUrl(item.referrer);
        var check = captureCheck(domain, item.filename.split('.').pop(), item.fileSize);
        if (capture === 2 || check) {
            chrome.downloads.cancel(item.id, () => {
                chrome.downloads.erase({'id': item.id}, () => {
                    downWithAria2({'url': item.finalUrl, 'referer': item.referrer, 'domain': domain, 'filename': item.filename});
                });
            });
        }
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
        var fileSize = (localStorage.getItem('fileSize') | 0);
        if (fileSize > 0 && size >= fileSize) {
            return true;
        }
        return false;
    }
});

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {'method': 'aria2.getGlobalStat'},
        (result) => {
            if (result.numActive !== '0') {
                chrome.browserAction.setBadgeText({'text': result.numActive});
                chrome.browserAction.setBadgeBackgroundColor({'color': '#3CC'});
            }
            else {
                chrome.browserAction.setBadgeText({'text': ''});
            }
        }
    )
}

displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
