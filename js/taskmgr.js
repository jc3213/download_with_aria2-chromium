$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status');
    var gid = taskInfo.attr('gid');
    var name = taskInfo.attr('name');
    if (event.target.id === 'option_btn') {
        $('#taskDetails').show();
        printTaskOption(gid);
        taskManager = setInterval(() => {
            printTaskOption(gid);
        }, 1000);
    }
    else if (event.target.id === 'copy_btn') {
        getDownloadURLs(gid);
    }
    else if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_bar') {
        toggleTask(status, gid);
    }

    function getDownloadURLs(gid) {
        var url = $(event.target).attr('uri');
        navigator.clipboard.writeText(url);
        showNotification(window['warn_url_copied'], url);
    }

    function removeTask(status, gid) {
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

    function toggleTask(status, gid) {
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

    function printTaskOption(gid) {
        jsonRPCRequest(
            {'method': 'aria2.tellStatus', 'gid': gid},
            (result) => {
                if (result.bittorrent) {
                    if (result.bittorrent.info) {
                        var taskName = result.bittorrent.info.name;
                    }
                    detailedTorrent(result);
                }
                else {
                    var taskUrl = result.files[0].uris[0].uri;
                    detailedDownload(result);
                }
                taskName = taskName || result.files[0].path.split('/').pop() || taskUrl;
                $('#taskName').html('<div class="title status button ' + result.status + '">' + taskName + '</div>');
            }
        );
    }

    function detailedTorrent(result) {
        var taskFiles = result.files.map(item => item = '<span class="fileInfo" index="' + item.index + '">'
        +           window['task_file_name'] + ': ' + item.path.split('/').pop() + '<br>'
        +           window['task_download_size'] + ': ' + bytesToFileSize(item.length) + '<br>'
        +           window['task_complete_ratio'] + ': ' + ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%'
        +           '</span>');
        $('#taskTorrent').html('<div class="torrentTracker">'
        +           result.bittorrent.announceList.join('<br>')
        +           '</div><hr><div class="torrentFiles">'
        +           taskFiles.join('<hr>')
        +           '</div>')
    }

    function detailedDownload(result) {
        $('#taskCommon').html();
    }
});

$('#taskName').on('click', (event) => {
    clearInterval(taskManager);
    $('#taskName, #taskCommon, #taskTorrent').empty();
    $('#taskDetails').hide();
});

var taskManager;
