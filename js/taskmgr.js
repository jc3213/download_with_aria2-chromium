$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status'), gid = taskInfo.attr('gid'), name = taskInfo.attr('name');
    if (event.target.id === 'show_btn') {
        clearInterval(taskManager);
        $('#showTaskFiles').show();
        printTaskFiles(gid);
        taskManager = setInterval(() => {
            printTaskFiles(gid);
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
                var taskName = result.bittorrent.info.name;
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
    clearInterval(taskManager);
    $('#showTaskFiles').hide();
});

var taskManager;
