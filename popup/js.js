window.addEventListener('message', (event) => {
    document.getElementById(event.data.id).style.display = 'none';
    setTimeout(() => document.getElementById(event.data.id).remove(), event.data.delay || 0);
    modules.forEach(item => { if (item.id === event.data.id) document.getElementById(item.button).classList.remove('checked'); });
});

var modules = [
    {button: 'newTask_btn', name: 'newTask', id: 'newTaskWindow'},
    {button: 'options_btn', name: 'options', id: 'optionsWindow'}
];
modules.forEach(item => document.getElementById(item.button).addEventListener('click', (event) => initialModules(event.target, item)));

function initialModules(element, module) {
    if (element.classList.contains('checked')) {
        document.getElementById(module.id).remove();
    }
    else {
        openModuleWindow(module);
    }
    element.classList.toggle('checked');
}

function openModuleWindow(module) {
    var iframe = document.createElement('iframe');
    iframe.id = module.id;
    iframe.src = '/modules/' + module.name + '/index.html';
    if (module.load) {
        iframe.addEventListener('load', module.load);
    }
    document.body.appendChild(iframe);
}

var queueTabs = [
    {button: 'active_btn', queue: 'activeQueue'},
    {button: 'waiting_btn', queue: 'waitingQueue'},
    {button: 'stopped_btn', queue: 'stoppedQueue'}
];
queueTabs.forEach(item => document.getElementById(item.button).addEventListener('click', (event) => toggleTaskQueue(event.target, item)));

function toggleTaskQueue(element, active) {
    if (element.classList.contains('checked')) {
        queueTabs.forEach(item => { if (item.queue !== active.queue) document.getElementById(item.queue).style.display = 'block'; });
    }
    else {
        document.getElementById(active.queue).style.display = 'block';
        queueTabs.forEach(item => { if (item.queue !== active.queue) document.getElementById(item.queue).style.display = 'none'; document.getElementById(item.button).classList.remove('checked');});
    }
    element.classList.toggle('checked');
}

document.getElementById('purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({method: 'aria2.purgeDownloadResult'});
});

function printMainFrame() {
    jsonRPCRequest([
            {method: 'aria2.getGlobalStat'},
            {method: 'aria2.tellActive'},
            {method: 'aria2.tellWaiting', index: [0, 999]},
            {method: 'aria2.tellStopped', index: [0, 999]}
        ],
        (global, active, waiting, stopped) => {
            document.getElementById('activeQueue').innerHTML = active.map(item => printTaskInfo(item)).join('');
            document.getElementById('waitingQueue').innerHTML = waiting.map(item => printTaskInfo(item)).join('');
            document.getElementById('stoppedQueue').innerHTML = stopped.map(item => printTaskInfo(item)).join('');
            document.getElementById('numActive').innerHTML = global.numActive;
            document.getElementById('numWaiting').innerHTML = global.numWaiting;
            document.getElementById('numStopped').innerHTML = global.numStopped;
            document.getElementById('downloadSpeed').innerHTML = bytesToFileSize(global.downloadSpeed) + '/s';
            document.getElementById('uploadSpeed').innerHTML = bytesToFileSize(global.uploadSpeed) + '/s';
            document.getElementById('queueTabs').style.display = 'block';
            document.getElementById('menuTop').style.display = 'block';
            document.getElementById('networkStatus').style.display = 'none';
        }, (error, rpc) => {
            document.getElementById('queueTabs').style.display = 'none';
            document.getElementById('menuTop').style.display = 'none';
            document.getElementById('networkStatus').innerHTML = error;
            document.getElementById('networkStatus').style.display = 'block';
        }
    );

    function printTaskInfo(result) {
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var connections = result.bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
        var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
        var uploadShow = result.bittorrent ? 'inline-block' : 'none';
        var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        var taskUrl = result.bittorrent ?  '' : result.files[0].uris[0].uri;
        var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
        var retryButton = !result.bittorrent && ['error', 'removed'].includes(result.status) ? 'inline-block' : 'none';
        return  '<div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '">'
        +           '<div class="taskBody">'
        +               '<div class="title">' + taskName + '</div>'
        +               '<span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span>'
        +               '<span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '</span><span style="display: ' + uploadShow + '">⏫ ' + uploadSpeed + '</span>'
        +           '</div>'
        +           '<div class="taskMenu">'
        +               '<span class="button" id="remove_btn">❌</span>'
        +               '<span class="button" id="invest_btn">🔍</span>'
        +               '<span class="button" id="retry_btn" style="display: ' + retryButton + '">🌌</span>'
        +           '</div>'
        +           '<div id="fancybar" class="' + result.status + 'Box">'
        +               '<div id="fancybar" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</div>'
        +           '</div>'
        +       '</div>';
    }
}

document.getElementById('taskQueue').addEventListener('click', (event) => {
    var status;
    var gid;
    document.querySelectorAll('div.taskInfo').forEach(item => { if (item.contains(event.target)) { gid = item.getAttribute('gid'); status = item.getAttribute('status'); } });

    if (event.target.id === 'remove_btn') {
        if (['active', 'waiting', 'paused'].includes(status)) {
            var method = 'aria2.forceRemove';
        }
        else if (['complete', 'error', 'removed'].includes(status)) {
            method = 'aria2.removeDownloadResult';
        }
        else {
            return;
        }
        jsonRPCRequest({method: method, gid: gid});
    }
    else if (event.target.id === 'invest_btn') {
        openModuleWindow({name: 'taskMgr', id: 'taskMgrWindow', load: (event) => event.target.contentWindow.postMessage(gid)});
    }
    else if (event.target.id === 'retry_btn') {
        jsonRPCRequest([
                {method: 'aria2.getFiles', gid: gid},
                {method: 'aria2.getOption', gid: gid}
            ], (files, options) => {
                jsonRPCRequest({method: 'aria2.removeDownloadResult', gid: gid}, () => {
                    downWithAria2({url: files[0].uris[0].uri, options: options, bypass: true});
                });
            }
        );
    }
    else if (event.target.id === 'fancybar') {
        if (['active', 'waiting'].includes(status)) {
            var method = 'aria2.pause';
        }
        else if (status === 'paused') {
            method = 'aria2.unpause';
        }
        else {
            return;
        }
        jsonRPCRequest({method: method, gid: gid});
    }
});

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
