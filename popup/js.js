window.addEventListener('message', (event) => {
    document.getElementById(event.data).remove();
    modules.forEach(item => { if (item.id === event.data) document.getElementById(item.button).classList.remove('checked'); });
});

var modules = [
    {'button': 'newTask_btn', 'name': 'newTask', 'id': 'newTaskWindow'},
    {'button': 'options_btn', 'name': 'options', 'id': 'optionsWindow'}
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

var taskTabs = ['active_btn', 'waiting_btn', 'stopped_btn'];
var taskQueues = ['activeQueue', 'waitingQueue', 'stoppedQueue'];
taskTabs.forEach((item, index) => document.getElementById(item).addEventListener('click', (event) => toggleTaskQueue(event.target, item, taskQueues[index])));

function toggleTaskQueue(element, active, activeTab) {
    if (element.classList.contains('checked')) {
        taskQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'block'; });
    }
    else {
        document.getElementById(activeTab).style.display = 'block';
        taskTabs.forEach(item => { if (item !== active) document.getElementById(item).classList.remove('checked'); });
        taskQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'none'; });
    }
    element.classList.toggle('checked');
}

document.getElementById('purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({'method': 'aria2.purgeDownloadResult'});
});

function printMainFrame() {
    jsonRPCRequest(
        {'method': 'aria2.getGlobalStat'},
        (result) => {
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var active = (result.numActive | 0);
            var waiting = (result.numWaiting | 0);
            var stopped = (result.numStopped | 0);
            printTaskQueue(waiting, stopped);
            document.getElementById('numActive').innerHTML = active;
            document.getElementById('numWaiting').innerHTML = waiting;
            document.getElementById('numStopped').innerHTML = stopped;
            document.getElementById('downloadSpeed').innerHTML = downloadSpeed;
            document.getElementById('uploadSpeed').innerHTML = uploadSpeed;
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

    function printTaskQueue(globalWaiting, globalStopped) {
        jsonRPCRequest([
            {'method': 'aria2.tellActive'},
            {'method': 'aria2.tellWaiting', 'index': [0, globalWaiting]},
            {'method': 'aria2.tellStopped', 'index': [0, globalStopped]},
        ], (activeQueue, waitingQueue, stoppedQueue) => {
            var active = activeQueue ? activeQueue.map(item => printTaskInfo(item)) : [];
            var waiting = waitingQueue ? waitingQueue.map(item => printTaskInfo(item)) : [];
            var stopped = stoppedQueue ? stoppedQueue.map(item => printTaskInfo(item)) : [];
            document.getElementById('activeQueue').innerHTML = active.join('');
            document.getElementById('waitingQueue').innerHTML = waiting.join('');
            document.getElementById('stoppedQueue').innerHTML = stopped.join('');
        });
    }

    function printTaskInfo(result) {
        var bittorrent = result.bittorrent;
        var gid = result.gid;
        var status = result.status;
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var connections = bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
        var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
        var upload_show = bittorrent ? 'inline-block' : 'none';
        var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        var taskUrl = bittorrent ?  '' : result.files[0].uris[0].uri;
        var taskName = bittorrent && bittorrent.info ? bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
        var retryButton = !bittorrent && ['error', 'removed'].includes(status) ? 'inline-block' : 'none';
        return  '<div class="taskInfo" gid="' + gid + '" status="' + status + '">'
        +           '<div class="taskBody">'
        +               '<div class="title">' + taskName + '</div>'
        +               '<span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span>'
        +               '<span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '</span><span style="display: ' + upload_show + '">⏫ ' + uploadSpeed + '</span>'
        +           '</div>'
        +           '<div class="taskMenu">'
        +               '<span class="button" id="remove_btn">❌</span>'
        +               '<span class="button" id="invest_btn">🔍</span>'
        +               '<span class="button" id="retry_btn" style="display: ' + retryButton + '">🌌</span>'
        +           '</div>'
        +           '<div id="fancybar" class="' + status + 'Box">'
        +               '<div id="fancybar" class="' + status + '" style="width: ' + completeRatio + '">' + completeRatio + '</div>'
        +           '</div>'
        +       '</div>';
    }
}

document.getElementById('taskQueue').addEventListener('click', (event) => {
    var element = event.target;
    var status;
    var gid;
    document.querySelectorAll('div.taskInfo').forEach(item => { if (item.contains(element)) { gid = item.getAttribute('gid'); status = item.getAttribute('status'); } });
    if (element.id === 'remove_btn') {
        removeTask();
    }
    if (element.id === 'invest_btn') {
        openModuleWindow({'name': 'taskMgr', 'id': 'taskMgrWindow', 'load': (event) => event.target.contentWindow.postMessage(gid)});
    }
    if (element.id === 'retry_btn') {
        retryTask();
    }
    if (element.id === 'fancybar') {
        toggleTask();
    }

    function removeTask() {
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

    function toggleTask() {
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

    function retryTask() {
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
});

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
