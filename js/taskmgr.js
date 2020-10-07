$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status');
    var gid = taskInfo.attr('gid');
    var name = taskInfo.attr('name');
    if (event.target.id === 'show_btn') {
        $('#taskDetails').show();
        printTaskDetails(gid);
        taskManager = setInterval(() => printTaskDetails(gid), 1000);
    }
    else if (event.target.id === 'copy_btn') {
        getDownloadURLs(gid);
    }
    else if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_btn') {
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
        jsonRPCRequest([
                {'method': 'aria2.tellStatus', 'gid': gid},
                {'method': 'aria2.getOption', 'gid': gid},
            ],
            (result, option) => {
                var taskUrl = result.files[0].uris.length > 0 ? result.files[0].uris[0].uri : '';
                var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
                var decimal = result.files.length.toString().length;
                $('#taskName').html('<div class="title button ' + result.status + '">' + taskName + '</div>');
                $('#optionDownload').val(option['max-download-limit'] || 0);
                $('#optionUpload').val(option['max-upload-limit'] || 0).attr('disabled', !Object.keys(result).includes('bittorrent'));
                $('#optionProxy').val(option['all-proxy'] || '').attr('disabled', Object.keys(result).includes('bittorrent'));
                var taskFiles = result.files.map(item => item = '<table><tr><td>'
                +           multiDecimalNumber(item.index, decimal) + '</td><td title="' + item.path.replace(/\//g, '\\') + '">'
                +           item.path.split('/').pop() + '</td><td>'
                +           bytesToFileSize(item.length) + '</td><td>'
                +           ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%</td></tr></table>'
                );
                $('#taskFiles').html(taskFiles.join(''));
            }
        );
    }
});

$('#taskName').on('click', (event) => {
    clearInterval(taskManager);
    $('#taskName, #taskFiles').empty();
    $('#taskDetails').hide();
});

var taskManager;
