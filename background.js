chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
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

chrome.browserAction.setBadgeBackgroundColor({color: '#3cc'});

chrome.downloads.onDeterminingFilename.addListener(async item => {
    if (aria2RPC.capture['mode'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var tabs = await getCurrentActiveTabs();
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

chrome.runtime.onMessage.addListener(({session, options}) => {
    downloadWithAria2(session, options);
});

aria2RPCLoader(() => {
    aria2RPCClient();
    aria2RPCKeepAlive();
});

//Wrapper untill manifest v3
async function getCurrentActiveTabs() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            resolve(tabs);
        })
    });
}

async function downloadWithAria2({url, referer, hostname, filename}, options = {}) {
    var url = Array.isArray(url) ? url : [url];
    if (filename) {
        options['out'] = filename;
    }
    if (!options['all-proxy'] && aria2RPC.proxy['resolve'].includes(hostname)) {
        options['all-proxy'] = aria2RPC.proxy['uri'];
    }
    options['header'] = await getCookiesFromReferer(referer);
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.addUri', params: [aria2RPC.jsonrpc['token'], url, options]},
    result => showNotification(url[0]), showNotification);
}

function captureFilterWorker(hostname, fileExt, fileSize) {
    if (localStorage['ignored'].includes(hostname)) {
        return false;
    }
    if (localStorage['capture'] === '2') {
        return true;
    }
    if (localStorage['monitored'].includes(hostname)) {
        return true;
    }
    if (localStorage['fileExt'].includes(fileExt)) {
        return true;
    }
    if (localStorage['fileSize'] > 0 && fileSize >= localStorage['fileSize']) {
        return true;
    }
    return false;
}

async function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + aria2RPC['useragent'], 'Connection: keep-alive'];
    //Wrapper untill manifest v3
    return new Promise((resolve, reject) => {
        if (url) {
            chrome.cookies.getAll({url}, (cookies) => {
                cookies.forEach(cookie => {
                    result += ' ' + cookie.name + '=' + cookie.value + ';';
                });
                header.push(result, 'Referer: ' + url);
                resolve(header);
            });
        }
        else {
            resolve(header);
        }
    });
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
        chrome.browserAction.setBadgeText({text: global.numActive === '0' ? '' : global.numActive});
    },
    error => {
        showNotification(error);
        clearInterval(keepAlive);
    });
}
