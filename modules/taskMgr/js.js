window.addEventListener('message', (event) => {
    printTaskOption(event.data);
    printTaskDetails(event.data);
    taskManager = setInterval(() => printTaskDetails(event.data), 1000);
})

function printTaskDetails(gid) {
    jsonRPCRequest(
        {'method': 'aria2.tellStatus', 'gid': gid},
        (result) => {
            var taskUrl = result.bittorrent ?  '' : result.files[0].uris[0].uri;
            var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
            document.getElementById('taskName').innerHTML = '<div class="button ' + result.status + '">' + taskName + '</div>';
            var bittorrent = result.bittorrent;
            var complete = result.status === 'complete';
            document.getElementById('optionDownload').setAttribute('gid', result.gid);
            document.getElementById('optionDownload').disabled = complete;
            document.getElementById('optionUpload').setAttribute('gid', result.gid);
            document.getElementById('optionUpload').disabled = !bittorrent || complete;
            document.getElementById('optionProxy').setAttribute('gid', result.gid);
            document.getElementById('optionProxy').disabled = bittorrent || complete;
            var taskFiles = result.files.map(item => item = printFileInfo(item));
            document.getElementById('taskFiles').innerHTML = '<table>' + taskFiles.join('') + '</table>';
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

var taskOptions = ['optionDownload', 'optionUpload', 'optionProxy'];
var optionsCall = ['max-download-limit', 'max-upload-limit', 'all-proxy'];
taskOptions.forEach((item, index) => document.getElementById(item).addEventListener('change', (event) => changeTaskOption(event.target, optionsCall[index], {})));

function changeTaskOption(element, call, options) {
    var gid = element.getAttribute('gid');
    options[call] = element.value;
    jsonRPCRequest({'method': 'aria2.changeOption', 'gid': gid, 'options': options}, () => printTaskOption(gid));
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {'method': 'aria2.getOption', 'gid': gid},
        (result) => {
            taskOptions.forEach((item, index) => document.getElementById(item).value = result[optionsCall[index]] || '');
        }
    );
}

document.getElementById('taskName').addEventListener('click', (event) => {
    window.parent.window.postMessage('taskMgrWindow');
    clearInterval(taskManager);
});

document.getElementById('taskFiles').addEventListener('click', (event) => {
    var fileInfo;
    document.querySelectorAll('tr').forEach((item, index)=> { if (item.contains(event.target)) fileInfo = item; });
    var uri = fileInfo.getAttribute('uri');
    if (uri) {
        navigator.clipboard.writeText(uri);
        showNotification(window['warn_url_copied'], uri);
    }
});

var taskManager;
