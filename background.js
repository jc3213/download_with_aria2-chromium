var aria2RPC = {};
var aria2Port;

function aria2RPCRequest(request) {
    var requestJSON = Array.isArray(request) ? request.map(createJSON) : [createJSON(request)];
    return fetch(aria2RPC.options.jsonrpc['uri'], {method: 'POST', body: JSON.stringify(requestJSON)}).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw(response.statusText);
        }
    }).then(responseJSON => {
        var {result, error} = responseJSON[0];
        if (result) {
            return responseJSON.map(item => item.result);
        }
        if (error) {
            throw(error.message);
        }
    });
}

function createJSON({method, params}) {
    return {id: '', jsonrpc: 2, method, params : params ? [aria2RPC.options.jsonrpc['token'], ...params] : [aria2RPC.options.jsonrpc['token']]};
}

function registerMessageService() {
    clearInterval(aria2RPC.connect);
    clearInterval(aria2RPC.message);
    aria2RPC.connect = setInterval(() => {
        aria2RPCRequest([
            {method: 'aria2.getVersion'},
            {method: 'aria2.getGlobalOption'},
            {method: 'aria2.getGlobalStat'},
            {method: 'aria2.tellActive'},
            {method: 'aria2.tellWaiting', params: [0, 999]},
            {method: 'aria2.tellStopped', params: [0, 999]},
            {method: 'aria2.tellStatus', params: [aria2RPC.lastSession]},
            {method: 'aria2.getOption', params: [aria2RPC.lastSession]}
        ]).then(([version, globalOption, globalStat, active, waiting, stopped, sessionResult, sessionOption]) => {
            aria2RPC = {...aria2RPC, version, globalOption, globalStat, active, waiting, stopped, sessionResult, sessionOption, error: undefined};
            chrome.browserAction.setBadgeText({text: globalStat.numActive === '0' ? '' : globalStat.numActive});
        }).catch(error => {
            aria2RPC = {...aria2RPC, error};
            showNotification(error);
            clearInterval(aria2RPC.connect);
        });
    }, 1000);
    aria2RPC.message = setInterval(() => {
        if (aria2Port) {
            aria2Port.postMessage(aria2RPC);
        }
    }, aria2RPC.options.jsonrpc['refresh']);
}

chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        startDownload({url: info.linkUrl, referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

chrome.storage.sync.get(null, result => {
    aria2RPC.options = result;
    registerMessageService();
});

chrome.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        aria2RPC.options[key] = changes[key].newValue;
        if (key === 'jsonrpc') {
            registerMessageService();
        }
    });
});

chrome.browserAction.setBadgeBackgroundColor({color: '#3cc'});

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        var response = await fetch('options.json');
        var json = await response.json();
        chrome.storage.sync.set(json);
    }
    if (details.reason === 'update' && details.previousVersion <= '2.6800') {
        chrome.storage.sync.set({
            jsonrpc: {
                uri: localStorage['jsonrpc'] ?? 'http://localhost:6800/jsonrpc',
                token: 'token:' + (localStorage['token'] ?? ''),
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
    if (details.reason === 'update' && details.previousVersion === '2.6900') {
        aria2RPC.options.jsonrpc['token'] = 'token:' + aria2RPC.options.jsonrpc['token'];
        chrome.storage.sync.set(aria2RPC.options);
    }
});

chrome.runtime.onConnect.addListener(port => {
    aria2Port = port;
    port.onDisconnect.addListener(() => {
        aria2Port = null;
    })
});

chrome.runtime.onMessage.addListener(({jsonrpc, session, download, request}, sender, response) => {
    if (jsonrpc) {
        response(aria2RPC);
    }
    if (download) {
        startDownload(...download);
    }
    if (session) {
        aria2RPC.lastSession = session;
    }
    if (request) {
        aria2RPCRequest(request).then(result => {
            var {restart, refresh} = request;
            if (restart) {
                restartDownload();
            }
            if (refresh && aria2Port) {
                aria2Port.postMessage(aria2RPC);
            }
        });
    }
});

chrome.downloads.onDeterminingFilename.addListener(async (item, suggest) => {
    if (aria2RPC.options.capture['mode'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
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
                startDownload({url, referer, hostname, filename});
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

function captureDownload(hostname, fileExt, fileSize) {
    if (aria2RPC.options.capture['reject'].includes(hostname)) {
        return false;
    }
    if (aria2RPC.options.capture['mode'] === '2') {
        return true;
    }
    if (aria2RPC.options.capture['resolve'].includes(hostname)) {
        return true;
    }
    if (aria2RPC.options.capture['fileExt'].includes(fileExt)) {
        return true;
    }
    if (aria2RPC.options.capture['fileSize'] > 0 && fileSize >= aria2RPC.options.capture['fileSize']) {
        return true;
    }
    return false;
}

async function startDownload({url, referer, hostname, filename}, options = {}) {
    if (filename) {
        options['out'] = filename;
    }
    if (!options['all-proxy'] && aria2RPC.options.proxy['resolve'].includes(hostname)) {
        options['all-proxy'] = aria2RPC.options.proxy['uri'];
    }
    options['header'] = await getCookiesFromReferer(referer);
    downloadWithAria2(Array.isArray(url) ? url : [url], options);
}

function restartDownload() {
    var {sessionResult, sessionOption} = aria2RPC;
    var url = sessionResult.files[0].uris.map(uri => uri.uri);
    downloadWithAria2(url, sessionOption);
};

function downloadWithAria2(url, options) {
    aria2RPCRequest({method: 'aria2.addUri', params: [url, options]})
        .then(response => showNotification(url[0]))
        .catch(showNotification);
}

async function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + aria2RPC.options['useragent'], 'Connection: keep-alive'];
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

function showNotification(message = '') {
    chrome.notifications.create({
        type: 'basic',
        title: aria2RPC.options.jsonrpc['uri'],
        iconUrl: '/icons/icon48.png',
        message: message
    }, id => {
        setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}
