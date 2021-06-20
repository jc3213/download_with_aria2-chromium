importScripts('/components/jsonrpc.js');

chrome.contextMenus.create({
    title: 'Download With Aria2',
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({url: info.linkUrl, referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (storage['capture'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var session = {url: item.finalUrl, filename: item.filename};
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
        session.hostname = getHostnameFromUrl(session.referer);
        if (captureFilterWorker(session.hostname, getFileExtension(session.filename), item.fileSize)) {
            chrome.downloads.cancel(item.id, () => {
                chrome.downloads.erase({id: item.id}, () => {
                    downWithAria2(session);
                });
            });
        }
    });
});

chrome.runtime.onInstalled.addListener((details) => {
    fetch('/components/options.json')
    .then(response => response.json())
    .then(json => chrome.storage.sync.set(json));
})

chrome.action.setBadgeBackgroundColor({color: '#3CC'});

function captureFilterWorker(hostname, fileExt, fileSize) {
    if (storage['ignored'].includes(hostname)) {
        return false;
    }
    if (storage['capture'] === '2') {
        return true;
    }
    if (storage['monitored'].includes(hostname)) {
        return true;
    }
    if (storage['fileExt'].includes(fileExt)) {
        return true;
    }
    if (storage['fileSize'] > 0 && fileSize >= storage['fileSize']) {
        return true;
    }
    return false;
}

function getHostnameFromUrl(url) {
    var host = url.split('/')[2];
    if (host.includes(':')) {
    	return host.slice(0, host.indexOf(':'))
 	}
    return host;
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            chrome.action.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    );
}

chrome.storage.sync.get(null, displayActiveTaskNumber);
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
