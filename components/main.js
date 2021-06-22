chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: [info.linkUrl], referer: tab.url, hostname: getHostnameFromUrl(tab.url)});
    }
});

chrome.runtime.onInstalled.addListener(async (details) => {
    var response = await fetch('/components/options.json');
    var json = await response.json();
    Object.keys(json).forEach(key => {
        if (!localStorage[key]) {
            localStorage[key] = json[key];
        }
    });
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

function downWithAria2(session, options = {}) {
    if (!session.url) {
        return;
    }
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
    if (!session.referer) {
        return sendRPCRequest();
    }
    chrome.cookies.getAll({url: session.referer}, (cookies) => {
        var cookie = 'Cookie:';
        cookies.forEach(item => cookie += ' ' + item.name + '=' + item.value + ';');
        options['header'].push(cookie, 'Referer: ' + session.referer);
        sendRPCRequest();
    });

    function sendRPCRequest() {
        jsonRPCRequest(
            {method: 'aria2.addUri', url: session.url, options},
            (result) => {
                showNotification(chrome.i18n.getMessage('warn_download'), url.join('\n'));
            },
            (error, jsonrpc) => {
                showNotification(error, jsonrpc || url.join('\n'));
            }
        );
    }
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
