importScripts('libs/js/jsonrpc.js');

chrome.contextMenus.create({
    title: 'Download With Aria2',
    id: 'downwitharia2v3',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2v3') {
        downloadWithAria2({url: info.linkUrl, referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason === 'install') {
        var response = await fetch('options.json');
        var json = await response.json();
        chrome.storage.sync.set(json);
    }
});

chrome.action.setBadgeBackgroundColor({color: '#3cc'});

chrome.downloads.onDeterminingFilename.addListener(async item => {
    if (aria2RPC.capture['mode'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var tabs = await chrome.tabs.query({active: true, currentWindow: true});
    var url = item.finalUrl;
    var referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
    var hostname = hostname = getHostnameFromUrl(referer);
    var filename = item.filename;

    if (captureDownload(hostname, getFileExtension(filename), item.fileSize)) {
        chrome.downloads.cancel(item.id, () => {
            chrome.downloads.erase({id: item.id}, () => {
                downloadWithAria2({url, referer, hostname, filename});
            });
        });
    }
});

aria2RPCLoader(() => {
    aria2RPCClient();
    aria2RPCKeepAlive();
});

function captureDownload(hostname, fileExt, fileSize) {
    if (aria2RPC.capture['reject'].includes(hostname)) {
        return false;
    }
    if (aria2RPC.capture['mode'] === '2') {
        return true;
    }
    if (aria2RPC.capture['resolve'].includes(hostname)) {
        return true;
    }
    if (aria2RPC.capture['fileExt'].includes(fileExt)) {
        return true;
    }
    if (aria2RPC.capture['fileSize'] > 0 && fileSize >= aria2RPC.capture['fileSize']) {
        return true;
    }
    return false;
}

function getHostnameFromUrl(url) {
    var host = url.split('/')[2];
    var index = host.indexOf(':');
    return host.slice(0, index === -1 ? host.length : index);
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

function aria2RPCClient() {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getGlobalStat', params: [aria2RPC.jsonrpc['token']]},
    global => {
        chrome.action.setBadgeText({text: global.numActive === '0' ? '' : global.numActive});
    },
    error => {
        showNotification(error);
        clearInterval(keepAlive);
    });
}
