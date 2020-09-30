$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status');
    var gid = taskInfo.attr('gid');
    var name = taskInfo.attr('name');
    if (event.target.id === 'show_btn') {
        $('#taskDetails').show();
        printTaskDetails(gid);
        taskManager = setInterval(() => {
            printTaskDetails(gid);
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

    function printTaskDetails(gid) {
        jsonRPCRequest(
            {'method': 'aria2.tellStatus', 'gid': gid},
            (result) => {
                $('#taskName').html('<div class="taskName status button ' + result.status + '">' + result.bittorrent.info.name + '</div>');
                var taskFiles = result.files.map((item, index) => item = '<tr><td>'
                +           multiDecimalNumber(item.index, result.files.length.toString().length) + '</td><td title="' + item.path.replace(/\//g, '\\') + '">'
                +           item.path.split('/').pop() + '</td><td>'
                +           bytesToFileSize(item.length) + '</td><td>'
                +           ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%</td></tr>'
                );
                $('#taskOption').html(result.bittorrent.announceList.join('<br>'));
                $('#taskFiles').html(taskFiles.join(''));
            }
        );
    }
});

$('#taskName').on('click', (event) => {
    clearInterval(taskManager);
    $('#taskName, #taskOption, #taskFiles').empty();
    $('#taskDetails').hide();
});

var taskManager;
