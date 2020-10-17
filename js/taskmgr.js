document.querySelector('div.taskQueue').addEventListener('click', (event) => {
    var taskInfo;
    document.querySelectorAll('div.taskInfo').forEach(item => { if (item.contains(event.target)) taskInfo = item; });
    var status = taskInfo.getAttribute('status');
    var gid = taskInfo.getAttribute('gid');
    if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_btn') {
        toggleTask(status, gid);
    }
    else if (event.target.id === 'invest_btn') {
        var iframe = document.createElement('iframe');
        iframe.id = 'taskMgrWindow';
        iframe.src = '/modules/taskMgr/index.html';
        iframe.addEventListener('load', (event) => event.target.contentWindow.postMessage(gid));
        document.querySelector('body').appendChild(iframe);
    }
    else if (event.target.id === 'retry_btn') {
        retryTask(gid);
    }
});

function removeTask(status, gid) {
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        return;
    }
    jsonRPCRequest({'method': method, 'gid': gid});
}

function toggleTask(status, gid) {
    if (['active', 'waiting'].includes(status)) {
        var method = 'aria2.pause';
    }
    else if (status === 'paused') {
        method = 'aria2.unpause';
    }
    else {
        return;
    }
    jsonRPCRequest({'method': method, 'gid': gid});
}

function retryTask(gid) {
    jsonRPCRequest([
            {'method': 'aria2.getFiles', 'gid': gid},
            {'method': 'aria2.getOption', 'gid': gid},
        ], (files, options) => {
            jsonRPCRequest({'method': 'aria2.removeDownloadResult', 'gid': gid}, () => {
                downWithAria2({'url': files[0].uris[0].uri, 'options': options});
            });
        }
    );
}
