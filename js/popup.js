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
    var html = '';
    for (var i = 0, l = result.length; i < l; i ++) {
        var files = result[i].files;
        var gid = result[i].gid;
        var torrent = result[i].bittorrent;
        var conns = result[i].connections;
        var status = result[i].status;
        var downloadSpeed = bytesToFileSize(result[i].downloadSpeed);
        var totalLength = bytesToFileSize(result[i].totalLength);
        var completedLength = bytesToFileSize(result[i].completedLength);
        var estimatedTime = secondsToHHMMSS((result[i].totalLength - result[i].completedLength) / result[i].downloadSpeed);
        var completeRatio = ((result[i].completedLength / result[i].totalLength * 10000 | 0) / 100).toString() + '%';
        if (torrent && torrent.info && torrent.info.name) {
            var taskName = torrent.info.name;
        }
        else {
            taskName = files[0].path.split('/').pop();
        }
        if (torrent) {
            var uploadSpeed = bytesToFileSize(result[i].uploadSpeed);
            var infoBar = '<div class="' + status + '_info2">' + conns + ' conns (' + result[i].numSeeders + ' seeds), ' + downloadSpeed + '/s (up: ' + uploadSpeed + '/s), ETA: ' + estimatedTime + '</div>';
        }
        else {
            infoBar = '<div class="' + status + '_info2">' + conns + ' conns, ' + downloadSpeed + '/s, ETA: ' + estimatedTime + '</div>';
        }
        var taskInfo = '<div id="taskInfo_' + gid + '">\
            <div class="tasktitle">' + taskName + '<button id="removebtn_' + gid + '" class="' + status + ' removebtn">remove</button></div>\
            <div class="' + status + '_info1">' + capitaliseFirstLetter(status) + ', ' + completedLength + '/' + totalLength + ', ' + completeRatio + '</div>\
            ' + infoBar + '</div>\
        <div id="taskBar_' + gid + '" class="' + status + ' progbar" style="width: ' + completeRatio + '"></div>'
        html += taskInfo;
    }
    return html;
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
        if (activeQueue.length + waitingQueue.length + stoppedQueue.length === 0 && $('#tasklist').find('.tasktitle').length === 0) {
            $('#tasklist').html('Empty task list');
        }
        else {
            var html = '';
            for (var i = 0, l = response.length; i < l; i ++) {
                var result = response[i].result;
                html += printTaskInfo(result);
            }
            $('#tasklist').html(html);
        }
    });
}

function printContent() {
    jsonRPCRequest(createJson('aria2.getGlobalStat'), (response) => {
        if (response.result) {
            var result = response.result;
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            $('#globalstat').html(downloadSpeed);
            printTasklist((result.numWaiting | 0), (result.numStopped | 0));
        }
        else if (response.error) {
            $('#globalstat').html('Auth Failure');
        }
    }, (event) => {
        $('#globalstat').html('No Response');
    });
}

printContent();
var keepContentAlive = setInterval(printContent, 1000);
