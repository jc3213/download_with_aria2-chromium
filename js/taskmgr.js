document.querySelector('div.taskQueue').addEventListener('click', (event) => {
    var taskInfo;
    document.querySelectorAll('div.taskInfo').forEach(item => { if (item.contains(event.target)) taskInfo = item; });
    var status = taskInfo.getAttribute('status');
    var gid = taskInfo.getAttribute('gid');
    if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_btn') {
        toggleTask(status, gid);
    }
    else if (event.target.id === 'invest_btn') {
        document.querySelector('#taskDetails').style.display = 'block';
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
        return;
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
    else {
        return;
    }
    jsonRPCRequest({'method': method, 'gid': gid});
}

function printTaskDetails(gid) {
    jsonRPCRequest(
        {'method': 'aria2.tellStatus', 'gid': gid},
        (result) => {
            var taskUrl = !result.bittorrent ? result.files[0].uris[0].uri : '';
            var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
            document.querySelector('#taskName').innerHTML = '<div class="button ' + result.status + '">' + taskName + '</div>';
            var bittorrent = result.bittorrent;
            var complete = result.status === 'complete';
            document.querySelector('#optionDownload').setAttribute('gid', result.gid);
            document.querySelector('#optionDownload').disabled = complete;
            document.querySelector('#optionUpload').setAttribute('gid', result.gid);
            document.querySelector('#optionUpload').disabled = !bittorrent || complete;
            document.querySelector('#optionProxy').setAttribute('gid', result.gid);
            document.querySelector('#optionProxy').disabled = bittorrent || complete;
            var taskFiles = result.files.map(item => item = printFileInfo(item));
            document.querySelector('#taskFiles').innerHTML = '<table>' + taskFiles.join('') + '</table>';
        }
    );

    function printFileInfo(info) {
        var fileUrl = info.uris.length > 0 ? info.uris[0].uri : '';
        var filename = (info.path || fileUrl).split('/').pop();
        var filePath = info.path.replace(/\//g, '\\');
        var fileSize = bytesToFileSize(info.length);
        var fileRatio = ((info.completedLength / info.length * 10000 | 0) / 100).toString() + '%';
        return '<tr uri="' + fileUrl + '"><td>' + info.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
    }
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

var taskOptions = ['#optionDownload', '#optionUpload', '#optionProxy'];
var optionsCall = ['max-download-limit', 'max-upload-limit', 'all-proxy'];
taskOptions.forEach(item => document.querySelector(item).addEventListener('change', changeTaskOption));

function changeTaskOption(event) {
    var options = {};
    var gid = event.target.getAttribute('gid');
    var index = taskOptions.indexOf('#' + event.target.id);
    options[optionsCall[index]] = event.target.value;
    jsonRPCRequest({'method': 'aria2.changeOption', 'gid': gid, 'options': options}, () => printTaskOption(gid));
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {'method': 'aria2.getOption', 'gid': gid},
        (result) => {
            taskOptions.forEach((item, index) => document.querySelector(item).value = result[optionsCall[index]] || '');
        }
    );
}

document.querySelector('#taskName').addEventListener('click', (event) => {
    clearInterval(taskManager);
    document.querySelector('#taskName').innerHTML = '';
    document.querySelector('#taskFiles').innerHTML = '';
    document.querySelector('#taskDetails').style.display = 'none';
});

document.querySelector('#taskFiles').addEventListener('click', (event) => {
    var fileInfo;
    document.querySelectorAll('tr').forEach((item, index)=> { if (item.contains(event.target)) fileInfo = item; });
    var uri = fileInfo.getAttribute('uri');
    if (uri) {
        navigator.clipboard.writeText(uri);
        showNotification(window['warn_url_copied'], uri);
    }
});

var taskManager;
