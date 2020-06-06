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
        json.params = json.params.concat(params);
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

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    var toadduri = ($('#taskInput').val() === '' ? $('#taskBatch').val().split('\n') : $('#taskInput').val().split('\n'));
    if (toadduri[0] !== '') {
        for (var i = 0, l = toadduri.length; i < l; i ++) {
            var uri = toadduri[i];
            jsonRPCRequest(createJson('aria2.addUri', '', [[uri]]));
        }
    }
    $('#addTask_btn').show();
    $('#cancel_btn, #addTaskWindow').hide();
    $('#taskInput, #taskBatch').val('');
});

$('#taskList').on('click', 'span.button', (event) => {
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
    var status = $(event.target).children('span').attr('class') || $(event.target).attr('class');
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
    +          '<div class="' + result.status + '_basic">' + capitaliseFirstLetter(result.status) + ', ' + completedLength + '/' + totalLength + ', ETA: ' + estimatedTime + '</div>'
    +          '<div class="' + result.status + '_extra">' + result.connections + ' conns' + seedsInfo + ', ' + downloadSpeed + '/s' + uploadInfo + '</div>'
    +          '<div class="progress"><span class="' + result.status + '" gid="' + result.gid + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
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
        var html = '';
        for (var i = 0, l = activeQueue.length; i < l; i ++) {
            html += printTaskInfo(activeQueue[i]);
        }
        for (i = 0, l = waitingQueue.length; i < l; i ++) {
            html += printTaskInfo(waitingQueue[i]);
        }
        for (i = 0, l = stoppedQueue.length; i < l; i ++) {
            html += printTaskInfo(stoppedQueue[i]);
        }
        $('#taskList').html(html);
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
