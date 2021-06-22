chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({url: [info.linkUrl], referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        var response = await fetch('/components/options.json');
        var json = await response.json();
        Object.keys(json).forEach(key => {
            localStorage[key] = json[key];
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, response) => {
    var {session, options} = message;
    downWithAria2(session, options);
    response();
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (localStorage['capture'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var session = {url: [item.finalUrl], filename: item.filename};
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

chrome.browserAction.setBadgeBackgroundColor({color: '#3cc'});

async function downWithAria2(session, options = {}) {
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = await getCookiesFromReferer(session.referer);
    jsonRPCRequest(
        {method: 'aria2.addUri', url: session.url, options},
        (result) => {
            showNotification(chrome.i18n.getMessage('warn_download'), session.url.join('\n'));
        },
        (error, jsonrpc) => {
            showNotification(error, jsonrpc || session.url.join('\n'));
        }
    );
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

function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
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

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            chrome.browserAction.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    );
}

displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
