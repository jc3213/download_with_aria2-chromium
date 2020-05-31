function createJson(method, id, params) {
    var token = localStorage.getItem('aria2secret') || '';
    var json = {
        jsonrpc: 2.0,
        method: method,
        id: ''
    };
    if (params) {
        json.params = params;
    }
    else {
        json.params = [];
    }
    if (id) {
        json.params.unshift(id);
    }
    json.params.unshift('token:' + token);
    return json;
}

function jsonRPCRequest(json, onloadCallback, onerrorCallback) {
    var xhr = new XMLHttpRequest();
    var rpc = localStorage.getItem('aria2rpc') || 'http://localhost:6800/jsonrpc';
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (typeof onloadCallback === 'function') {
            onloadCallback(response);
        }
    };
    xhr.onerror = (event) => {
        var response = JSON.parse(xhr.response);
        if (typeof onerrorCallback === 'function') {
            onerrorCallback(response);
        }
    };
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

function addurisubmit() {
    var toadduri = (e_taskaddbox.val() === '' ? e_taskaddbatch.val().split('\n') : e_taskaddbox.val().split('\n'));
    if (toadduri[0] !== '') {
        for (var i = 0, l = toadduri.length; i < l; i ++) {
            var uri = toadduri[i];
            jsonRPCRequest(createJson('aria2.addUri', '', [[uri]]));
        }
    }
    e_addtaskctn.hide();
    e_addbtn.val('Add');
}

function addmoretoggle() {
    if (e_addmore.val() === '>>') {
        e_taskaddbox.hide();
        e_taskaddbatch.show();
        e_addmore.val('<<');
    }
    else {
        e_taskaddbox.show();
        e_taskaddbatch.hide();
        e_addmore.val('>>');
    }
}

function addtasktoggle() {
    e_addtaskctn.toggle();
    e_addbtn.val((e_addbtn.val() === 'Add' ? 'Cancel' : 'Add' ));
    e_taskaddbox.show();
    e_taskaddbatch.hide();
    e_addmore.val('>>');
}

var e_addtaskctn = $('#addtaskcontainer');
var e_addbtn = $('#addbtn');
var e_addmore = $('#addmore');
var e_taskaddbox = $('#taskaddbox');
var e_taskaddbatch = $('#taskaddbatch');
var e_tasklist = $('#tasklist').on('click', 'button.removebtn', (event) => {
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
$('#purgebtn').on('click', (event) => {
    jsonRPCRequest(createJson('aria2.purgeDownloadResult'));
});
$('#addbtn').on('click', (event) => {
    addtasktoggle();
});
$('#addmore').on('click', (event) => {
    addmoretoggle();
})
$('#addtask').on('submit', (event) => {
    event.preventDefault();
    addurisubmit();
});

function printContent() {
    jsonRPCRequest(createJson('aria2.getGlobalStat'), (response) => {
        var result = response.result;
        var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
        $('#globalstat').html(downloadSpeed);
        printContentBody((result.numWaiting | 0), (result.numStopped | 0));
    });
}

function printContentBody(globalWaiting, globalStopped) {
    var params = ['status', 'gid', 'completedLength', 'totalLength', 'files', 'connections', 'dir', 'downloadSpeed', 'bittorrent', 'uploadSpeed', 'numSeeders'];
    jsonRPCRequest([
        createJson('aria2.tellActive', '', [params]),
        createJson('aria2.tellWaiting', '', [0, globalWaiting, params]),
        createJson('aria2.tellStopped', '', [0, globalStopped, params]),
    ], (response) => {
        var activeQueue = response[0].result
        var waitingQueue = response[1].result;
        var stoppedQueue = response[2].result;
        if (activeQueue.length + waitingQueue.length + stoppedQueue.length === 0 && e_tasklist.find('.tasktitle').length === 0) {
            e_tasklist.html('Empty task list');
        }
        else {
            var html = '';
            for (var i = 0, l = response.length; i < l; i ++) {
                var result = response[i].result;
                html += printContentTask(result);
            }
            e_tasklist.html(html);
        }
    });
}

function printContentTask(result) {
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

printContent();
var keepContentAlive = setInterval(printContent, 1000);
