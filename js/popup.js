function createJson(method, id, params) {
    var token = localStorage.getItem('aria2secret') || '';
    var json = {
        jsonrpc: 2.0,
        method: method,
        id: '',
        params: [
            'token:' + token
        ]
    };
    if (id) {
        json.params.push(id);
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
        return '&infin;';
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

$('#purgebtn').on('click', (event) => {
    jsonRPCRequest(createJson('aria2.purgeDownloadResult'));
});

$('#addbtn').on('click', (event) => {
    $('#addtaskcontainer').toggle();
    $('#addbtn').val(($('#addbtn').val() === 'Add' ? 'Cancel' : 'Add' ));
    $('#taskaddbox').show();
    $('#taskaddbatch').hide();
    $('#addmore').val('>>');
});

$('#addmore').on('click', (event) => {
    if ($('#addmore').val() === '>>') {
        $('#taskaddbox').hide();
        $('#taskaddbatch').show();
        $('#addmore').val('<<');
    }
    else {
        $('#taskaddbox').show();
        $('#taskaddbatch').hide();
        $('#addmore').val('>>');
    }
});

$('#addtask').on('submit', (event) => {
    event.preventDefault();
    var toadduri = ($('#taskaddbox').val() === '' ? $('#taskaddbatch').val().split('\n') : $('#taskaddbox').val().split('\n'));
    if (toadduri[0] !== '') {
        for (var i = 0, l = toadduri.length; i < l; i ++) {
            var uri = toadduri[i];
            jsonRPCRequest(createJson('aria2.addUri', '', [[uri]]));
        }
    }
    $('#addtaskcontainer').hide();
    $('#addbtn').val('Add');
});

$('#tasklist').on('click', 'button.removebtn', (event) => {
    var status = $(event.target).attr('class').split(' ').shift();
    var id = $(event.target).attr('id').split('_').pop();
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        console.log(status);
    }
    jsonRPCRequest(createJson(method, id));
}).on('click', 'div.progbar', (event) => {
    var status = $(event.target).attr('class').split(' ').shift();
    var id = $(event.target).attr('id').split('_').pop();
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
    jsonRPCRequest(createJson(method, id));
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
        var infoBar = '<div class="' + result.status + '_info2">' + result.connections + ' conns (' + result.numSeeders + ' seeds), ' + downloadSpeed + '/s (up: ' + uploadSpeed + '/s), ETA: ' + estimatedTime + '</div>';
    }
    else {
        infoBar = '<div class="' + result.status + '_info2">' + result.connections + ' conns, ' + downloadSpeed + '/s, ETA: ' + estimatedTime + '</div>';
    }
    return '<div id="taskInfo_' + result.gid + '">'
    +          '<div class="tasktitle">' + taskName + '<button id="removebtn_' + result.gid + '" class="' + result.status + ' removebtn">remove</button></div>'
    +          '<div class="' + result.status + '_info1">' + capitaliseFirstLetter(result.status) + ', ' + completedLength + '/' + totalLength + ', ' + completeRatio + '</div>'
    +          infoBar
    +      '</div>'
    +      '<div id="taskBar_' + result.gid + '" class="' + result.status + ' progbar" style="width: ' + completeRatio + '"></div>'
}

function printTasklist(globalWaiting, globalStopped) {
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
        $('#tasklist').html(html || 'No Task');
    });
}

function printContent() {
    jsonRPCRequest(createJson('aria2.getGlobalStat'), (response) => {
        if (response.result) {
            var global = response.result;
            var downloadSpeed = bytesToFileSize(global.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(global.uploadSpeed) + '/s';
            var active = (global.numActive | 0);
            var waiting = (global.numWaiting | 0);
            var stopped = (global.numStopped | 0);
            $('#globalstat').html('<span class="active">Active</span> ' + active + ' - <span class="paused">Waiting</span> ' + waiting + ' - <span class="removed">Stopped</span> ' + stopped);
            $('#nettraffic').html('<span class="download">Download</span> ' + downloadSpeed + ' | <span class="upload">Upload</span> ' + uploadSpeed);
            printTasklist(waiting, stopped);
        }
        else if (response.error) {
            $('#globalstat').html('<span class="error">Auth Failure</span>');
            $('#tasklist').html(' ');
            $('#nettraffic').html('<span class="download">Download</span> 0 B/s | <span class="upload">Upload</span> 0 B/s');
        }
    }, (event) => {
        $('#globalstat').html('<span class="error">No Response</span>');
        $('#tasklist').html(' ');
        $('#nettraffic').html('<span class="download">Download</span> 0 B/s | <span class="upload">Upload</span> 0 B/s')
    });
}

printContent();
var keepContentAlive = setInterval(printContent, 1000);
