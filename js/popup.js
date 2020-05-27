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

function aria2CMD(method, id) {
    $.jsonRPC.request(method, {
        params: [rpct, id]
    })
}

// add new task manually
function addurisubmit() {
    var toadduri = (e_taskaddbox.val() === '' ? e_taskaddbatch.val().split('\n') : e_taskaddbox.val().split('\n'));
    if (toadduri[0] !== '') {
        for (var i = 0, l = toadduri.length; i < l; i ++) {
            var uri = toadduri[i];
            aria2CMD('addUri', [uri]);
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

//event binding
var rpc = localStorage.getItem('aria2rpc') || 'http://localhost:6800/jsonrpc';
var token = localStorage.getItem('aria2secret') || '';
var rpct = 'token:' + token;
$.jsonRPC.setup({
    endPoint: rpc,
    namespace: 'aria2'
});

var headInfotpl = $('#headInfo').html();
var taskInfotpl = $('#taskInfo').html();
var e_addtaskctn = $('#addtaskcontainer');
var e_addbtn = $('#addbtn');
var e_addmore = $('#addmore');
var e_taskaddbox = $('#taskaddbox');
var e_taskaddbatch = $('#taskaddbatch');
var e_tasklist = $('#tasklist').on('click', 'button.removebtn', (event) => {
    var status = $(event.target).attr('class').split(' ').shift();
    var id = $(event.target).attr('id').split('_').pop();
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'removeDownloadResult';
    }
    else {
        console.log(status);
    }
    aria2CMD(method, id);
}).on('click', 'div.progbar', (event) => {
    var status = $(event.target).attr('class').split(' ').shift();
    var id = $(event.target).attr('id').split('_').pop();
    if (['active', 'waiting'].includes(status)) {
        var method = 'pause';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'removeDownloadResult';
    }
    else if (status === 'paused') {
        method = 'unpause';
    }
    else {
        console.log(status);
    }
    aria2CMD(method, id);
});
$('#purgebtn').on('click', (event) => {
    aria2CMD('purgeDownloadResult', '');
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

Mustache.parse(headInfotpl);
Mustache.parse(taskInfotpl);

function printContent() {
    $.jsonRPC.request('getGlobalStat', {
        params: [rpct],
        success: (response) => {
            var result = response.result;
            var tplpart = {};
            if (result.downloadSpeed === 0) {
                tplpart.globspeed = '';
            }
            else {
                tplpart.globspeed = bytesToFileSize(result.downloadSpeed) + '/s';
            }
            var headInfohtml = Mustache.render(headInfotpl, result, tplpart);
            $('#globalstat').html(headInfohtml);
            printContentBody(result);
        }
    })
}

function printContentBody(result) {
    var rquestParams = ['status', 'gid', 'completedLength', 'totalLength', 'files', 'connections', 'dir', 'downloadSpeed', 'bittorrent', 'uploadSpeed', 'numSeeders'];
    $.jsonRPC.batchRequest([
        {method: 'tellActive', params: [rpct, rquestParams]},
        {method: 'tellWaiting', params: [rpct, 0, (result.numWaiting | 0), rquestParams]},
        {method: 'tellStopped', params: [rpct, 0, (result.numStopped | 0), rquestParams]}
    ], {
        success: (response) => {
            var activeQueue = response[0].result
            var waitingQueue = response[1].result;
            var stoppedQueue = response[2].result;
            if (activeQueue.length + waitingQueue.length + stoppedQueue.length === 0 && e_tasklist.find('.tasktitle').length === 0) {
                e_tasklist.html('Empty task list');
                //clearInterval(keepContentAlive);
            }
            else {
                var html = '';
                for (var i = 0, l = response.length; i < l; i ++) {
                    var result = response[i].result;
                    html += printContentTask(result);
                }
                e_tasklist.html(html);
            }
        }
    });
}

function printContentTask(result) {
    var html = '';
    var tplpart = {};
    for (var i = 0, l = result.length; i < l; i ++) {
        var files = result[i].files;
        var gid = result[i].gid;
        var torrent = result[i].bittorrent;
        if (torrent && torrent.info && torrent.info.name) {
            tplpart.displayName = torrent.info.name;
        }
        else {
            tplpart.displayName = files[0].path.split('/').pop();
        }
        if (torrent) {
            tplpart.upspeedPrec = ' (up:' + bytesToFileSize(result[i].uploadSpeed) + '/s)';
            tplpart.numSeedersf = '/' + result[i].numSeeders + ' seeds';
        }
        else {
            tplpart.upspeedPrec = '';
            tplpart.numSeedersf = '';
        }
        tplpart.dlspeedPrec = bytesToFileSize(result[i].downloadSpeed);
        tplpart.tlengthPrec = bytesToFileSize(result[i].totalLength);
        tplpart.clengthPrec = bytesToFileSize(result[i].completedLength);
        tplpart.completeRatio = ((result[i].completedLength / result[i].totalLength * 10000 | 0) / 100).toString();
        var etasec = (result[i].totalLength - result[i].completedLength) / result[i].downloadSpeed;
        tplpart.eta = secondsToHHMMSS(etasec);
        tplpart.statusUpper = capitaliseFirstLetter(result[i].status);
        if (isNaN(result[i].completedLength) || result[i].completedLength === 0) {
            tplpart.p = '0%';
        }
        else {
            tplpart.p = ((result[i].completedLength/result[i].totalLength * 10000 | 0) / 100).toString() + '%';
        }
        html += Mustache.render(taskInfotpl, result[i], tplpart);
    }
    return html;
}

printContent();
var keepContentAlive = setInterval(printContent, 1000);
