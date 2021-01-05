chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: info.linkUrl, referer: tab.url, domain: domainFromUrl(tab.url)});
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.previousVersion < '2.4000') {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/components/options.json', true);
        xhr.onload = () => restoreSettings(xhr.response, details.reason);
        xhr.send();
    }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (localStorage['capture'] === '0' || item.finalUrl.match(/^(blob|data)/)) {
        return;
    }

    var session = {url: item.finalUrl, options: {'out': item.filename}};
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.referer = item.referrer || tabs[0].url;
        session.domain = domainFromUrl(session.referer);
        if (localStorage['capture'] === '2') {
            return captureDownload();
        }
        if (localStorage['ignored'].includes(session.domain)) {
            return;
        }
        if (localStorage['monitored'].includes(session.domain)) {
            return captureDownload();
        }
        if (localStorage['fileExt'].includes(item.filename.split('.').pop())) {
            return captureDownload();
        }
        if (item.fileSize >= localStorage['fileSize']) {
            return captureDownload();
        }
    });

    function captureDownload() {
        chrome.downloads.cancel(item.id, () => {
            chrome.downloads.erase({id: item.id}, () => {
                downWithAria2(session);
            });
        });
    }
});

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            chrome.browserAction.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    );
}

chrome.browserAction.setBadgeBackgroundColor({color: '#3CC'});
displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
