chrome.runtime.sendMessage({jsonrpc: true}, response => {
    aria2RPC = response;
    feedEventHandler();
    document.querySelectorAll('[aria2]').forEach(aria2 => parseValueToOption(aria2, aria2RPC.globalOption));
});

document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#referer').value;
    var options = {};
    document.querySelectorAll('[option], [aria2]').forEach(option => {
        options[option.id] = option.value;
    });
    document.querySelector('#entries').value.split('\n').forEach(url => {
        try {
            var session = JSON.parse(url);
            if (Array.isArray(session)) {
                if (typeof session[0] === 'string') {
                    submitNewDownloadTask({url: session, referer}, options);
                }
                else {
                    session.forEach(task => submitNewDownloadTask(referer ? {...task, referer} : task, options));
                }
            }
            else {
                submitNewDownloadTask(referer ? {...session, referer} : session, options);
            }
        }
        catch(error) {
            submitNewDownloadTask({url, referer}, options);
        }
    });
});

function submitNewDownloadTask(session, options) {
    chrome.runtime.sendMessage({download: [session, options]});
    parent.document.querySelector('[module="' + frameElement.id + '"]').classList.remove('checked');
    frameElement.remove();
}
