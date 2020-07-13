$('#addTask_btn, #cancel_btn').on('click', (event) => {
    $('#addTask_btn, #cancel_btn, #purdge_btn, #addTaskWindow').toggle();
    $('#taskReferer, #taskBatch').val('');
});

$('#submit_btn').on('click', (event) => {
    var url = $('#taskBatch').val().split('\n');
    var referer = $('taskReferer').val();
    var json = url.filter(item => item !== '').map(item => downWithAria2(item, referer));
    $('#addTask_btn, #cancel_btn, #purdge_btn, #addTaskWindow').toggle();
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

$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status'), gid = taskInfo.attr('gid'), name = taskInfo.attr('name');
    if (event.target.id === 'show_btn') {
        clearInterval(keepFilesAlive);
        $('#showTaskFiles').show();
        printTaskFiles(gid);
        keepFilesAlive = setInterval(() => {
            printTaskFiles(gid);
        }, 1000);
    }
    else if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_bar') {
        toggleTask(status, gid);
    }

    function removeTask(status, gid, name) {
        if (['active', 'waiting', 'paused'].includes(status)) {
            var method = 'aria2.forceRemove';
        }
        else if (['complete', 'error', 'removed'].includes(status)) {
            method = 'aria2.removeDownloadResult';
        }
        else {
            return console.log(status);
        }
        jsonRPCRequest({'method': method, 'gid': gid});
    }

    function toggleTask(status, gid, name) {
        if (['active', 'waiting'].includes(status)) {
            var method = 'aria2.pause';
        }
        else if (status === 'paused') {
            method = 'aria2.unpause';
        }
        else if (['complete', 'error', 'removed'].includes(status)) {
            method = 'aria2.removeDownloadResult';
        }
        else {
            return console.log(status);
        }
        jsonRPCRequest({'method': method, 'gid': gid});
    }

    function printTaskFiles(gid) {
        jsonRPCRequest(
            {'method': 'aria2.tellStatus', 'gid': gid},
            (result) => {
                try {
                    var taskName = result.bittorrent.info.name;
                }
                catch(error) {
                    taskName = result.files[0].path.split('/').pop();
                }
                var taskFiles = result.files.map((item, index) => item = '<tr><td>'
                +   multiDecimalNumber(index + 1, 3) + '</td><td style="text-align: left;">'
                +   item.path.split('/').pop() + '</td><td>'
                +   bytesToFileSize(item.length) + '</td><td>'
                +   ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%</td></tr>'
                );
                $('#showTaskFiles').html('<div id="showTask" class="title status button ' + result.status + '">' + taskName + '</div><hr>'
                +   '<div id="showFiles"><table>'
                +       '<tr><td>' + window['task_file_index'] + '</td><td>' + window['task_file_name'] + '</td><td>' + window['task_download_size'] + '</td><td>' + window['task_complete_ratio'] + '</td></tr>'
                +       taskFiles.join('')
                +   '</table></div>');
            }
        );
    }
});

$('#showTaskFiles').on('click', '#showTask', (event) => {
    clearInterval(keepFilesAlive);
    $('#showTaskFiles').hide();
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
            $('#globalHeader, #globalMenu').show();
            $('#globalError').hide();
            printTaskQueue(waiting, stopped);
        }, (error, rpc) => {
            $('#globalHeader, #globalMenu').hide();
            $('#globalError').show().html(error);
        }
    );

    function printTaskQueue(globalWaiting, globalStopped) {
        jsonRPCRequest([
            {'method': 'aria2.tellActive'},
            {'method': 'aria2.tellWaiting', 'params': [0, globalWaiting]},
            {'method': 'aria2.tellStopped', 'params': [0, globalStopped]},
        ], (activeQueue, waitingQueue, stoppedQueue) => {
            activeQueue = activeQueue || [];
            waitingQueue = waitingQueue || [];
            stoppedQueue = stoppedQueue || [];
            var active = activeQueue.map(item => printTaskInfo(item));
            var waiting = waitingQueue.map(item => printTaskInfo(item));
            var stopped = stoppedQueue.map(item => printTaskInfo(item));
            $('#allTaskQueue').html([...active, ...waiting, ...stopped].join('<hr>'));
            $('#activeQueue').html(active.join('<hr>'));
            $('#waitingQueue').html(waiting.join('<hr>'));
            $('#stoppedQueue').html(stopped.join('<hr>'));
        });
    }

    function printTaskInfo(result) {
        var downloadSpeed = bytesToFileSize(result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = secondsToHHMMSS((result.totalLength - result.completedLength) / result.downloadSpeed);
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        try {
            var taskName = result.bittorrent.info.name;
            var numSeeders = ' (' + result.numSeeders + ' ' + window['task_bit_seeders'] + ')';
            var uploadSpeed = ', ⇧: ' + bytesToFileSize(result.uploadSpeed) + '/s';
        }
        catch(error) {
            taskName = result.files[0].path.split('/').pop();
            numSeeders = '';
            uploadSpeed = '';
        }
        return '<div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '" name="' + taskName + '">'
        +          '<div><span class="title">' + taskName + '</span> <span id="show_btn" class="button">👁️</span> <span id="remove_btn" class="button">❌</span></div>'
        +          '<div>' + window['task_download_size'] + ': ' + completedLength + '/' + totalLength + ', ' + window['task_estimated_time'] + ': ' + estimatedTime + '</div>'
        +          '<div class="' + result.status + '_info">' + window['task_connections'] + ': ' + result.connections + numSeeders + ', ⇩: ' + downloadSpeed + '/s' + uploadSpeed + '</div>'
        +          '<div id="progress_bar" class="progress ' + result.status + '_bar"><span id="progress_bar" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
        +      '</div>'
    }
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
var keepFilesAlive;
