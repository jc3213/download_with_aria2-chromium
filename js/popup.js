$('#newTask_btn, #cancel_btn').on('click', (event) => {
    $('#newTask_btn, #cancel_btn, #purdge_btn, #newTaskWindow').toggle();
    $('#taskReferer, #taskBatch').val('');
    $('#setProxy').prop('checked', false);
    $('#taskProxy').prop('disabled', 'disabled');
});

$('#setProxy').on('click', (event) => {
    $('#taskProxy').prop('disabled', (index, value) => !value);
});

$('#taskProxy').val(localStorage.getItem('allproxy') || '');

$('#submit_btn').on('click', (event) => {
    var referer = $('taskReferer').val();
    var proxy = $('#setProxy').prop('checked') ? $('#taskProxy').val() : '';
    var url = $('#taskBatch').val().split('\n').filter(item => item === '' ?  '' : downWithAria2({'url': item, 'referer': referer, 'proxy': proxy}));
    $('#newTask_btn, #cancel_btn, #purdge_btn, #newTaskWindow').toggle();
    $('#taskReferer, #taskBatch').val('');
});

$('#active_btn, #waiting_btn, #stopped_btn').on('click', (event) => {
    var active = '#' + event.target.id;
    var activeQueue = active.replace('_btn', 'Queue');
    var inactive = ['#active_btn', '#waiting_btn', '#stopped_btn'].filter(item => item !== active).join(', ');
    var inactiveQueue = ['#allTaskQueue', '#activeQueue', '#waitingQueue', '#stoppedQueue'].filter(item => item !== activeQueue).join(', ');
    if ($(active).hasClass('checked')) {
        $('#allTaskQueue').show();
        $(activeQueue).hide();
    }
    else {
        $(inactive).removeClass('checked');
        $(activeQueue).show();
        $(inactiveQueue).hide();
    }
    $(active).toggleClass('checked');
});

$('#purdge_btn').on('click', (event) => {
    jsonRPCRequest({'method': 'aria2.purgeDownloadResult'});
});

$('#options_btn').on('click', (event) => {
    open('options.html', '_blank');
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
            $('#numActive').html(active);
            $('#numWaiting').html(waiting);
            $('#numStopped').html(stopped);
            $('#downloadSpeed').html(downloadSpeed);
            $('#uploadSpeed').html(uploadSpeed);
            $('#queueTabs, #taskManager').show();
            $('#networkStatus').hide();
            printTaskQueue(waiting, stopped);
        }, (error, rpc) => {
            $('#queueTabs, #taskManager').hide();
            $('#networkStatus').show().html(error);
        }
    );

    function printTaskQueue(globalWaiting, globalStopped) {
        jsonRPCRequest([
            {'method': 'aria2.tellActive'},
            {'method': 'aria2.tellWaiting', 'index': [0, globalWaiting]},
            {'method': 'aria2.tellStopped', 'index': [0, globalStopped]},
        ], (activeQueue, waitingQueue, stoppedQueue) => {
            activeQueue = activeQueue || [];
            waitingQueue = waitingQueue || [];
            stoppedQueue = stoppedQueue || [];
            var active = activeQueue.map(item => printTaskInfo(item));
            var waiting = waitingQueue.map(item => printTaskInfo(item));
            var stopped = stoppedQueue.map(item => printTaskInfo(item));
            $('#allTaskQueue').html([...active, ...waiting, ...stopped].join(''));
            $('#activeQueue').html(active.join(''));
            $('#waitingQueue').html(waiting.join(''));
            $('#stoppedQueue').html(stopped.join(''));
        });
    }

    function printTaskInfo(result) {
        var downloadSpeed = bytesToFileSize(result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        if (result.bittorrent) {
            if (result.bittorrent.info) {
                var taskName = result.bittorrent.info.name;
                var showButton = '<span id="show_btn" class="button">🔍</span>';
            }
            var connections = result.numSeeders + ' (' + result.connections + ')';
            var uploadSpeed = '⏫ ' + bytesToFileSize(result.uploadSpeed) + '/s';
        }
        else {
            var taskUrl = result.files[0].uris[0].uri;
            var copyButton = '<span id="copy_btn" class="button" uri="' + taskUrl + '">🖨️</span>';
        }
        taskName = taskName || result.files[0].path.split('/').pop() || taskUrl;
        connections = connections || result.connections;
        uploadSpeed = uploadSpeed || '';
        showButton = showButton || '';
        copyButton = copyButton || '';
        return  '<div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '" name="' + taskName + '">'
        +           '<div class="taskBody">'
        +               '<div class="title">' + taskName + '</div>'
        +               '<div><span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span></div>'
        +               '<div><span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '/s</span><span>' + uploadSpeed + '</span></div>'
        +           '</div>'
        +           '<div class="taskMenu"><span id="remove_btn" class="button">❌</span>' + showButton + copyButton + '</div>'
        +           '<div id="progress_btn" class="fancybar ' + result.status + 'Bar"><span id="progress_btn" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
        +       '</div>'
    }
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
