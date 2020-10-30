window.addEventListener('message', (event) => {
    document.getElementById(event.data).remove();
    modules.forEach(item => { if (item.win === event.data) document.getElementById(item.id).classList.remove('checked'); });
});

var modules = [
    {'id': 'newTask_btn', 'name': 'newTask', 'win': 'newTaskWindow'}, 
    {'id': 'options_btn', 'name': 'options', 'win': 'optionsWindow'}
];
modules.forEach(item => document.getElementById(item.id).addEventListener('click', (event) => initialModules(event.target, item)));

function initialModules(element, module) {
    if (element.classList.contains('checked')) {
        document.getElementById(module.win).remove();
    }
    else {
        var iframe = document.createElement('iframe');
        iframe.id = module.win;
        iframe.src = '/modules/' + module.name + '/index.html';
        if (module.load) {
            iframe.addEventListener('load', module.load);
        }
        document.body.appendChild(iframe);
    }
    element.classList.toggle('checked');
}

var taskTabs = ['active_btn', 'waiting_btn', 'stopped_btn'];
var taskQueues = ['activeQueue', 'waitingQueue', 'stoppedQueue', 'allTaskQueue'];
taskTabs.forEach((item, index) => document.getElementById(item).addEventListener('click', (event) => toggleTaskQueue(event.target, item, taskQueues[index])));
taskQueues.forEach(item => document.getElementById(item).addEventListener('click', (event) => toggleTaskManager(event.target)));

function toggleTaskQueue(element, active, activeTab) {
    if (element.classList.contains('checked')) {
        document.getElementById('allTaskQueue').style.display = 'block';
        document.getElementById(activeTab).style.display = 'none';
    }
    else {
        document.getElementById(activeTab).style.display = 'block';
        taskTabs.forEach(item => { if (item !== active) document.getElementById(item).classList.remove('checked'); });
        taskQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'none'; });
    }
    element.classList.toggle('checked');
}

function toggleTaskManager(element, task) {
    document.querySelectorAll('div.taskInfo').forEach(item => { if (item.contains(element)) task = {'gid': item.getAttribute('gid'), 'status': item.getAttribute('status')}; })
    if (element.id === 'remove_btn') {
        removeTask(task.gid, task.status);
    }
    if (element.id === 'invest_btn') {
        initialModules(element, {'name': 'taskMgr', 'win': 'taskMgrWindow', 'load': (event) => event.target.contentWindow.postMessage(task.gid)});
    }
    if (element.id === 'retry_btn') {
        retryTask(task.gid);
    }
    if (element.id === 'progress_btn') {
        toggleTask(task.gid, task.status);
    }
}

function removeTask(gid, status) {
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

function toggleTask(gid, status) {
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
            document.getElementById('allTaskQueue').innerHTML = [...active, ...waiting, ...stopped].join('');
            document.getElementById('activeQueue').innerHTML = active.join('');
            document.getElementById('waitingQueue').innerHTML = waiting.join('');
            document.getElementById('stoppedQueue').innerHTML = stopped.join('');
        });
    }

    function printTaskInfo(result) {
        var downloadSpeed = bytesToFileSize(result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        var taskUrl = !result.bittorrent ? result.files[0].uris[0].uri : '';
        var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
        var connections = result.bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
        var uploadSpeed = result.bittorrent ? '⏫ ' + bytesToFileSize(result.uploadSpeed) + '/s' : '';
        var retryButton = !result.bittorrent && ['error', 'removed'].includes(result.status) ? '<span id="retry_btn" class="button">♻️</span>' : '';
        return  '<div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '">'
        +           '<div class="taskBody">'
        +               '<div class="title">' + taskName + '</div>'
        +               '<div><span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span></div>'
        +               '<div><span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '/s</span><span>' + uploadSpeed + '</span></div>'
        +           '</div>'
        +           '<div class="taskMenu"><span id="remove_btn" class="button">❌</span><span id="invest_btn" class="button">🔍</span>' + retryButton + '</div>'
        +           '<div id="progress_btn" class="fancybar ' + result.status + 'Bar"><span id="progress_btn" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
        +       '</div>'
    }
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
