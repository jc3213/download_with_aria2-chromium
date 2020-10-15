$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status');
    var gid = taskInfo.attr('gid');
    if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_btn') {
        toggleTask(status, gid);
    }
    else if (event.target.id === 'invest_btn') {
        $('#taskDetails').show();
        printTaskOption(gid)
        printTaskDetails(gid);
        taskManager = setInterval(() => printTaskDetails(gid), 1000);
    }
    else if (event.target.id === 'retry_btn') {
        retryTask(gid);
    }
});

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
            var taskUrl = !result.bittorrent ? result.files[0].uris[0].uri : '';
            var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
            $('#taskName').html('<div class="button ' + result.status + '">' + taskName + '</div>');
            var bittorrent = result.bittorrent;
            var complete = result.status === 'complete';
            $('#optionDownload').attr({'gid': result.gid, 'disabled': complete});
            $('#optionUpload').attr({'gid': result.gid, 'disabled': !bittorrent || complete});
            $('#optionProxy').attr({'gid': result.gid, 'disabled': bittorrent || complete});
            var taskFiles = result.files.map(item => item = printFileInfo(item));
            $('#taskFiles').attr('uri', taskUrl).html('<table>' + taskFiles.join('') + '</table>');
        }
    );

    function printFileInfo(info) {
        var cellIndex = '<td>' + info.index + '</td>';
        var cellName = '<td title="' + info.path.replace(/\//g, '\\') + '">' + (info.path || info.uris[0].uri).split('/').pop() + '</td>';
        var cellSize = '<td>' + bytesToFileSize(info.length) + '</td>';
        var cellRatio = '<td>' + ((info.completedLength / info.length * 10000 | 0) / 100).toString() + '%</td>';
        return '<tr>' + cellIndex + cellName + cellSize + cellRatio + '</tr>';
    }
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {'method': 'aria2.getOption', 'gid': gid},
        (result) => {
            $('#optionDownload').val(result['max-download-limit']);
            $('#optionUpload').val(result['max-upload-limit']);
            $('#optionProxy').val(result['all-proxy'] || '');
        }
    );
}

function retryTask(gid) {
    jsonRPCRequest([
            {'method': 'aria2.getFiles', 'gid': gid},
            {'method': 'aria2.getOption', 'gid': gid},
        ], (files, options) => {
            jsonRPCRequest({'method': 'aria2.removeDownloadResult', 'gid': gid}, () => {
                downWithAria2({'url': files[0].uris[0].uri, 'options': options});
            });
        }
    );
}

$('#taskName').on('click', (event) => {
    clearInterval(taskManager);
    $('#taskName, #taskFiles').empty();
    $('#taskDetails').hide();
});

$('#taskFiles').on('click', (event) => {
    var uri = $('#taskFiles').attr('uri');
    if (uri) {
        navigator.clipboard.writeText(uri);
        showNotification(window['warn_url_copied'], uri);
    }
});

$('#optionDownload, #optionUpload, #optionProxy').on('change', (event) => {
    var options = {};
    var gid = $(event.target).attr('gid');
    var index = ['#optionDownload', '#optionUpload', '#optionProxy'].indexOf('#' + event.target.id);
    var call = ['max-download-limit', 'max-upload-limit', 'all-proxy'][index];
    options[call] = event.target.value;
    jsonRPCRequest({'method': 'aria2.changeOption', 'gid': gid, 'options': options}, () => printTaskOption(gid));
});

var taskManager;
