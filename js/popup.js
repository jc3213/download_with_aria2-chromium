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
    jsonRPCRequest(createJSON('aria2.purgeDownloadResult'));
});

$('#addMore_btn, #addLess_btn').on('click', (event) => {
    $('#addMore_btn, #addLess_btn, #taskInput, #taskBatch').toggle();
});

$('#submit_btn').on('click', (event) => {
    var url = ($('#taskBatch').val() || $('#taskInput').val()).split('\n');
    var json = url.filter(item => item !== '').map(item => createJSON('aria2.addUri', '', [[item]]));
    jsonRPCRequest(json);
    $('#addTask_btn').show();
    $('#cancel_btn, #addTaskWindow').hide();
    $('#taskInput, #taskBatch').val('');
});

$('#active_btn, #waiting_btn, #stopped_btn').on('click', (event) => {
    var active = '#' + event.target.id;
    var activeQueue = active.replace('_btn', 'Queue');
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
    jsonRPCRequest(createJSON(method, gid));
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
    jsonRPCRequest(createJSON(method, gid));
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
        var seedsInfo = ' (' + result.numSeeders + ' ' + window['task_bit_seeders'] + ')';
        var uploadInfo = ', ⇧: ' + uploadSpeed + '/s';
    }
    else {
        seedsInfo = '';
        uploadInfo = '';
    }
    return '<div class="taskInfo">'
    +          '<div><span class="taskName">' + taskName + '</span> <span class="button" status="' + result.status + '" gid="' + result.gid + '">❌</span></div>'
    +          '<div>' + window['task_download_size'] + ': ' + completedLength + '/' + totalLength + ', ' + window['task_estimated_time'] + ': ' + estimatedTime + '</div>'
    +          '<div class="' + result.status + '_info">' + window['task_connections'] + ': ' + result.connections + seedsInfo + ', ⇩: ' + downloadSpeed + '/s' + uploadInfo + '</div>'
    +          '<div class="progress ' + result.status + '_bar"><span class="' + result.status + '" status="' + result.status + '" gid="' + result.gid + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
    +      '</div>'
}

function printTaskQueue(globalWaiting, globalStopped) {
    var params = ['status', 'gid', 'completedLength', 'totalLength', 'files', 'connections', 'dir', 'downloadSpeed', 'bittorrent', 'uploadSpeed', 'numSeeders'];
    jsonRPCRequest([
        createJSON('aria2.tellActive', '', [params]),
        createJSON('aria2.tellWaiting', '', [0, globalWaiting, params]),
        createJSON('aria2.tellStopped', '', [0, globalStopped, params]),
    ], (activeQueue, waitingQueue, stoppedQueue) => {
        var active = activeQueue.map(item => printTaskInfo(item));
        var waiting = waitingQueue.map(item => printTaskInfo(item));
        var stopped = stoppedQueue.map(item => printTaskInfo(item));
        $('#allTaskQueue').html([...active, ...waiting, ...stopped].join('<hr>'));
        $('#activeQueue').html(active.join('<hr>'));
        $('#waitingQueue').html(waiting.join('<hr>'));
        $('#stoppedQueue').html(stopped.join('<hr>'));
    });
}

function printMainFrame() {
    jsonRPCRequest(createJSON('aria2.getGlobalStat'), (result) => {
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
        $('#globalHeader, #globalMenu').show();
        $('#globalError').hide();
        printTaskQueue(waiting, stopped);
    }, (error) => {
        $('#globalHeader, #globalMenu').hide();
        $('#globalError').show().html(window[error]);
    });
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
