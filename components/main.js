var aria2RPC = {};

function registerMessageService() {
    clearInterval(aria2RPC.keepAlive);
    clearInterval(aria2RPC.message);
    aria2RPC.keepAlive = setInterval(() => {
        jsonRPCRequest([
            {method: 'aria2.getVersion'},
            {method: 'aria2.getGlobalOption'},
            {method: 'aria2.getGlobalStat'},
            {method: 'aria2.tellActive'},
            {method: 'aria2.tellWaiting', index: [0, 999]},
            {method: 'aria2.tellStopped', index: [0, 999]}
        ], (version, globalOption, globalStat, active, waiting, stopped) => {
            aria2RPC = {...aria2RPC, version, globalOption, globalStat, active, waiting, stopped, error: undefined};
            chrome.browserAction.setBadgeText({text: globalStat.numActive === '0' ? '' : globalStat.numActive});
        }, (error) => {
            aria2RPC = {...aria2RPC, error};
            clearInterval(aria2RPC.keepAlive);
        });
    }, 1000);
    aria2RPC.message = setInterval(() => {
        chrome.runtime.sendMessage(aria2RPC);
    }, aria2RPC.option.jsonrpc['refresh']);
}

chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({url: info.linkUrl, referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

chrome.storage.sync.get(null, result => {
    aria2RPC.option = result;
    registerMessageService();
});

chrome.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        aria2RPC.option[key] = changes[key].newValue;
        if (key === 'jsonrpc') {
            registerMessageService();
        }
    });
});

chrome.browserAction.setBadgeBackgroundColor({color: '#3cc'});

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        var response = await fetch('/components/option.json');
        var json = await response.json();
        chrome.storage.sync.set(json);
    }
    if (details.reason === 'update' && details.previousVersion <= '2.6800') {
        chrome.storage.sync.set({
            jsonrpc: {
                uri: localStorage['jsonrpc'] ?? 'http://localhost:6800/jsonrpc',
                token: localStorage['token'] ?? '',
                refresh: localStorage['refresh'] | 0
            },
            useragent: localStorage['useragent'] ?? navigator.userAgent,
            proxy: {
                uri: localStorage['allproxy'] ?? '',
                resolve: (localStorage['proxied'] ?? '').split(/[\s\n,]/)
            },
            capture: {
                mode: localStorage['capture'] ?? '0',
                reject: (localStorage['ignored'] ?? '').split(/[\s\n,]/),
                resolve: (localStorage['monitored'] ?? '').split(/[\s\n,]/),
                fileExt: (localStorage['fileExt'] ?? '').split(/[\s\n,]/),
                fileSize: localStorage['fileSize'] | 0
            }
        });
        localStorage.clear();
    }
});

chrome.runtime.onMessage.addListener((message, sender, response) => {
    var {jsonrpc, purge, session, options} = message;
    if (jsonrpc) {
        response(aria2RPC);
    }
    if (purge) {
        aria2RPC.stopped = [];
    }
    if (session && options) {
        downWithAria2(session, options);
    }
});

chrome.downloads.onDeterminingFilename.addListener(async (item, suggest) => {
    if (aria2RPC.option.capture['mode'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var session = {url: item.finalUrl, filename: item.filename};
    var tabs = await getCurrentActiveTabs();
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

//Wrapper untill manifest v3
async function getCurrentActiveTabs() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            resolve(tabs);
        })
    });
}

async function downWithAria2(session, options = {}) {
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && aria2RPC.option.proxy['resolve'].includes(session.hostname)) {
        options['all-proxy'] = aria2RPC.option.proxy['uri'];
    }
    options['header'] = await getCookiesFromReferer(session.referer);
    jsonRPCRequest(
        {method: 'aria2.addUri', url, options},
        (result) => {
            showNotification(chrome.i18n.getMessage('warn_download'), url.join('\n'));
        },
        (error, jsonrpc) => {
            showNotification(error, jsonrpc ?? url.join('\n'));
        }
    );
}

function captureFilterWorker(hostname, fileExt, fileSize) {
    if (aria2RPC.option.capture['reject'].includes(hostname)) {
        return false;
    }
    if (aria2RPC.option.capture['mode'] === '2') {
        return true;
    }
    if (aria2RPC.option.capture['resolve'].includes(hostname)) {
        return true;
    }
    if (aria2RPC.option.capture['fileExt'].includes(fileExt)) {
        return true;
    }
    if (aria2RPC.option.capture['fileSize'] > 0 && fileSize >= aria2RPC.option.capture['fileSize']) {
        return true;
    }
    return false;
}

async function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + aria2RPC.option['useragent'], 'Connection: keep-alive'];
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
    if (host.includes(':')) {
    	return host.slice(0, host.indexOf(':'))
 	}
    return host;
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}
