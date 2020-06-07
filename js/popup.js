function createJson(method, gid, params) {
    var token = localStorage.getItem('aria2secret') || '';
    var json = {
        jsonrpc: 2.0,
        method: method,
        id: '',
        params: [
            'token:' + token
        ]
    };
    if (gid) {
        json.params.push(gid);
    }
    if (params) {
        json.params = [...json.params, ...params];
    }
    return json;
}

function jsonRPCRequest(json, onload, onerror) {
    var xhr = new XMLHttpRequest();
    var rpc = localStorage.getItem('aria2rpc') || 'http://localhost:6800/jsonrpc';
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (typeof onload === 'function') {
            onload(response);
        }
    };
    xhr.onerror = onerror;
    xhr.send(JSON.stringify(json));
}

function bytesToFileSize(bytes) {
    var KBytes = 1024;
    var MBytes = 1048576;
    var GBytes = 1073741824;
    var TBytes = 1099511627776;
    if (bytes >= 0 && bytes < KBytes) {
        return bytes + ' B';
    }
    else if (bytes >= KBytes && bytes < MBytes) {
        return (bytes / KBytes * 100 + 1 | 0) / 100 + ' KB';
    }
    else if (bytes >= MBytes && bytes < GBytes) {
        return (bytes / MBytes * 100 + 1 | 0) / 100 + ' MB';
    }
    else if (bytes >= GBytes && bytes < TBytes) {
        return (bytes / GBytes * 100 + 1 | 0) / 100 + ' GB';
    }
    else if (bytes >= TBytes) {
        return (bytes / TBytes * 100 + 1 | 0) / 100 + ' TB';
    }
    else {
        return bytes + ' B';
    }
}

function twoDecimalNumber(number) {
    return ('00' + number).substr(number.toString().length);
}

function secondsToHHMMSS(number) {
    if (isNaN(number)) {
        return '-';
    }
    if (number === Infinity) {
        return '∞';
    }
    var integer = (number | 0);
    var hours = twoDecimalNumber(integer / 3600 | 0);
    var minutes = twoDecimalNumber((integer - (hours * 3600)) / 60 | 0);
    var seconds = twoDecimalNumber(integer - (hours * 3600) - (minutes * 60));
    var time = hours + 'h' + minutes + 'm' + seconds + 's';
    return time.replace(/(00[hms])*/, '');
}

$('#addTask_btn, #cancel_btn').on('click', (event) => {
    $('#addTask_btn, #cancel_btn, #addTaskWindow').toggle();
    $('#addMore_btn, #taskInput').show();
    $('#addLess_btn, #taskBatch').hide();
    $('#taskInput, #taskBatch').val('');
});

$('#purdge_btn').on('click', (event) => {
    jsonRPCRequest(createJson('aria2.purgeDownloadResult'));
});

$('#addMore_btn, #addLess_btn').on('click', (event) => {
    $('#addMore_btn, #addLess_btn, #taskInput, #taskBatch').toggle();
});

$('#submit_btn').on('click', (event) => {
    var urls = ($('#taskBatch').val() || $('#taskInput').val()).split('\n');
    var jsons = urls.filter(item => item !== '').map(item => createJson('aria2.addUri', '', [[item]]));
    jsonRPCRequest(jsons);
    $('#addTask_btn').show();
    $('#cancel_btn, #addTaskWindow').hide();
    $('#taskInput, #taskBatch').val('');
});

$('#active_btn, #waiting_btn, #stopped_btn').on('click', (event) => {
    var active = '#' + event.target.id;
    var activeQueue = '#' + event.target.id.replace('_btn', 'Queue');
    var inactive = ['#active_btn', '#waiting_btn', '#stopped_btn'].filter(item => item !== active).join(', ');
    var inactiveQueue = ['#allTaskQueue', '#activeQueue', '#waitingQueue', '#stoppedQueue'].filter(item => item !== activeQueue).join(', ');
    if ($(active).hasClass('checked')) {
        $(active).removeClass('checked');
        $('#allTaskQueue').show();
        $(activeQueue).hide();
    }
    else {
        $(active).addClass('checked');
        $(inactive).removeClass('checked');
        $(activeQueue).show();
        $(inactiveQueue).hide();
    }
});

$('#options_btn').on('click', (event) => {
    open('options.html', '_blank');
});

$('div.taskQueue').on('click', 'span.button', (event) => {
    var gid = $(event.target).attr('gid');
    var status = $(event.target).attr('status');
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        console.log(status);
    }
    jsonRPCRequest(createJson(method, gid));
}).on('click', 'div.progress', (event) => {
    var gid = $(event.target).children('span').attr('gid') || $(event.target).attr('gid');
    var status = $(event.target).children('span').attr('status') || $(event.target).attr('status');
    if (['active', 'waiting'].includes(status)) {
        var method = 'aria2.pause';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else if (status === 'paused') {
        method = 'aria2.unpause';
    }
    else {
        console.log(status);
    }
    jsonRPCRequest(createJson(method, gid));
});

function printTaskInfo(result) {
    var downloadSpeed = bytesToFileSize(result.downloadSpeed);
    var totalLength = bytesToFileSize(result.totalLength);
    var completedLength = bytesToFileSize(result.completedLength);
    var estimatedTime = secondsToHHMMSS((result.totalLength - result.completedLength) / result.downloadSpeed);
    var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
    if (result.bittorrent && result.bittorrent.info && result.bittorrent.info.name) {
        var taskName = result.bittorrent.info.name;
    }
    else {
        taskName = result.files[0].path.split('/').pop();
    }
    if (result.bittorrent) {
        var uploadSpeed = bytesToFileSize(result.uploadSpeed);
        var seedsInfo = ' (' + result.numSeeders + ' seeds)';
        var uploadInfo = ' (up: ' + uploadSpeed + '/s)';
    }
    else {
        seedsInfo = '';
        uploadInfo = '';
    }
    return '<div class="taskInfo">'
    +          '<div class="taskName">' + taskName + ' <span class="button" status="' + result.status + '" gid="' + result.gid + '">Remove</span></div>'
    +          '<div class="' + result.status + '_basic"><span class="capitalize">' + result.status + '</span>, ' + completedLength + '/' + totalLength + ', ETA: ' + estimatedTime + '</div>'
    +          '<div class="' + result.status + '_extra">' + result.connections + ' conns' + seedsInfo + ', ' + downloadSpeed + '/s' + uploadInfo + '</div>'
    +          '<div class="progress ' + result.status + '_bar"><span class="' + result.status + '" status="' + result.status + '" gid="' + result.gid + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
    +      '</div>'
}

function printTaskList(globalWaiting, globalStopped) {
    var params = ['status', 'gid', 'completedLength', 'totalLength', 'files', 'connections', 'dir', 'downloadSpeed', 'bittorrent', 'uploadSpeed', 'numSeeders'];
    jsonRPCRequest([
        createJson('aria2.tellActive', '', [params]),
        createJson('aria2.tellWaiting', '', [0, globalWaiting, params]),
        createJson('aria2.tellStopped', '', [0, globalStopped, params]),
    ], (response) => {
        var activeQueue = response[0].result
        var waitingQueue = response[1].result;
        var stoppedQueue = response[2].result;
        var active = activeQueue.map(item => printTaskInfo(item));
        var waiting = waitingQueue.map(item => printTaskInfo(item));
        var stopped = stoppedQueue.map(item => printTaskInfo(item));
        $('#allTaskQueue').html([...active, ...waiting, ...stopped].join('<hr>'));
        $('#activeQueue').html(active.join('<hr>'));
        $('#waitingQueue').html(waiting.join('<hr>'));
        $('#stoppedQueue').html(stopped.join('<hr>'));
    });
}

function printContent() {
    jsonRPCRequest(createJson('aria2.getGlobalStat'), (response) => {
        if (response.result) {
            var result = response.result;
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var active = (result.numActive | 0);
            var waiting = (result.numWaiting | 0);
            var stopped = (result.numStopped | 0);
            $('#numActive').html(active);
            $('#numWaiting').html(waiting);
            $('#numStopped').html(stopped);
            $('#downloadSpeed').html(downloadSpeed);
            $('#uploadSpeed').html(uploadSpeed);
            $('#globalStatus, #mainMenu').show();
            $('#globalError').hide();
            printTaskList(waiting, stopped);
        }
        else if (response.error) {
            $('#globalStatus, #mainMenu').hide();
            $('#globalError').html('Auth Failure').show();
        }
    }, (event) => {
        $('#globalStatus, #mainMenu').hide();
        $('#globalError').html('No Response').show();
    });
}

printContent();
var keepContentAlive = setInterval(printContent, 1000);
