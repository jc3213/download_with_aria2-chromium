var taskTabs = ['#active_btn', '#waiting_btn', '#stopped_btn'];
var taskQueues = ['#allTaskQueue', '#activeQueue', '#waitingQueue', '#stoppedQueue'];
taskTabs.forEach(item => document.querySelector(item).addEventListener('click', toggleTaskQueue));

function toggleTaskQueue(event) {
    var active = '#' + event.target.id;
    var activeQueue = active.replace('_btn', 'Queue');
    if (event.target.classList.contains('checked')) {
        document.querySelector('#allTaskQueue').style.display = 'block';
        document.querySelector(activeQueue).style.display = 'none';
    }
    else {
        document.querySelector(activeQueue).style.display = 'block';
        taskTabs.forEach(item => { if (item !== active) document.querySelector(item).classList.remove('checked'); });
        taskQueues.forEach(item => { if (item !== activeQueue) document.querySelector(item).style.display = 'none'; });
    }
    event.target.classList.toggle('checked');
}

var newTaskButton = ['#newTask_btn', '#cancel_btn'];
var newTaskWindow = ['#newTask_btn', '#cancel_btn', '#purdge_btn', '#newTaskWindow'];
newTaskButton.forEach(item => document.querySelector(item).addEventListener('click', clickNewTaskButton));

function clickNewTaskButton(event) {
    document.querySelector('#setProxy').checked = false;
    document.querySelector('#taskProxy').disabled = true;
    document.querySelector('#taskProxy').value = localStorage.getItem('allproxy') || '';
    toggleNewTaskWindow();
}

function toggleNewTaskWindow() {
    document.querySelector('#taskReferer').value = '';
    document.querySelector('#taskBatch').value = '';
    newTaskWindow.forEach(item => document.querySelector(item).style.display = document.querySelector(item).style.display === 'none' ? 'initial' : 'none');
}

document.querySelector('#setProxy').addEventListener('click', (event) => {
    document.querySelector('#taskProxy').disabled = !document.querySelector('#taskProxy').disabled;
});

document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#taskReferer').value;
    var proxy = document.querySelector('#setProxy').checked ? document.querySelector('#taskProxy').value : '';
    var url = document.querySelector('#taskBatch').value.split('\n').forEach(item => { if (item !== '') downWithAria2({'url': item, 'referer': referer, 'proxy': proxy}) });
    toggleNewTaskWindow();
});

document.querySelector('#purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({'method': 'aria2.purgeDownloadResult'});
});

document.querySelector('#options_btn').addEventListener('click', (event) => {
    if (event.target.classList.contains('checked')) {
        document.querySelector('#optionsWindow').remove();
    }
    else {
        var optionsWindow = document.createElement('iframe');
        optionsWindow.id = 'optionsWindow';
        optionsWindow.src = 'options.html';
        document.querySelector('body').appendChild(optionsWindow);
    }
    event.target.classList.toggle('checked');
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
            document.querySelector('#numActive').innerHTML = active;
            document.querySelector('#numWaiting').innerHTML = waiting;
            document.querySelector('#numStopped').innerHTML = stopped;
            document.querySelector('#downloadSpeed').innerHTML = downloadSpeed;
            document.querySelector('#uploadSpeed').innerHTML = uploadSpeed;
            document.querySelector('#queueTabs').style.display = 'block';
            document.querySelector('#menuTop').style.display = 'block';
            document.querySelector('#networkStatus').style.display = 'none';
        }, (error, rpc) => {
            document.querySelector('#queueTabs').style.display = 'none';
            document.querySelector('#menuTop').style.display = 'none';
            document.querySelector('#networkStatus').innerHTML = error;
            document.querySelector('#networkStatus').style.display = 'block';
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
            document.querySelector('#allTaskQueue').innerHTML = [...active, ...waiting, ...stopped].join('');
            document.querySelector('#activeQueue').innerHTML = active.join('');
            document.querySelector('#waitingQueue').innerHTML = waiting.join('');
            document.querySelector('#stoppedQueue').innerHTML = stopped.join('');
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
        var retryButton = !result.bittorrent && ['error', 'removed'].includes(result.status) ? '<span id="retry_btn" class="button">🌌</span>' : '';
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
