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

    var session = {'url': item.finalUrl, 'filename': item.filename};
    chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
        session.referer = item.referrer || tabs[0].url;
        session.domain = domainFromUrl(item.referrer);
        captureFilters();
    });

    function captureAdd() {
        chrome.downloads.cancel(item.id, () => {
            chrome.downloads.erase({'id': item.id}, () => {
                downWithAria2(session);
            });
        });
    }

    function captureFilters() {
        var capture = (localStorage.getItem('capture') | 0);
        if (capture === 0) {
            return;
        }
        else if (capture === 2) {
            return captureAdd();
        }
        else {
            var ignored = localStorage.getItem('ignored') || '';
            if (ignored.includes(session.domain)) {
                return;
            }
            var monitored = localStorage.getItem('monitored') || '';
            if (monitored.includes(session.domain)) {
                return captureAdd();
            }
            var fileExt = localStorage.getItem('fileExt') || '';
            if (fileExt.includes(item.filename.split('.').pop())) {
                return captureAdd();
            }
            var fileSize = (localStorage.getItem('fileSize') | 0);
            if (fileSize !== 0 && item.fileSize >= fileSize) {
                return captureAdd();
            }
        }
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
