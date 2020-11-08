window.addEventListener('message', (event) => {
    gid = event.data;
    printTaskOption(gid);
    printTaskDetails(gid);
    taskManager = setInterval(() => printTaskDetails(gid), 1000);
})

function printTaskDetails(gid) {
    jsonRPCRequest(
        {'method': 'aria2.tellStatus', 'gid': gid},
        (result) => {
            var bittorrent = result.bittorrent;
            var complete = result.status === 'complete';
            var taskUrl = bittorrent ?  '' : result.files[0].uris[0].uri;
            var taskName = bittorrent && bittorrent.info ? bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
            document.getElementById('taskName').innerHTML = taskName;
            document.getElementById('taskName').className = 'button title ' + result.status;
            document.getElementById('optionDownload').disabled = complete;
            document.getElementById('optionUpload').disabled = !bittorrent || complete;
            document.getElementById('optionProxy').disabled = bittorrent || complete;
            var taskFiles = result.files.map(item => printFileInfo(item, bittorrent));
            document.getElementById('taskFiles').innerHTML = '<table>' + taskFiles.join('') + '</table>';
        }
    );

    function printFileInfo(info, bittorrent) {
        var fileUrl = info.uris.length > 0 ? info.uris[0].uri : '';
        var filename = (info.path || fileUrl).split('/').pop();
        var filePath = info.path.replace(/\//g, '\\');
        var fileSize = bytesToFileSize(info.length);
        var fileRatio = ((info.completedLength / info.length * 10000 | 0) / 100).toString() + '%';
        var clickEvent = bittorrent ? '' : 'copyFileUrl(\'' + fileUrl + '\')';
        return '<tr onclick="' + clickEvent + '"><td>' + info.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
    }
}

var taskOptions = ['optionDownload', 'optionUpload', 'optionProxy'];
var optionsType = ['max-download-limit', 'max-upload-limit', 'all-proxy'];
taskOptions.forEach((item, index) => document.getElementById(item).addEventListener('change', (event) => changeTaskOption(event.target.value, optionsType[index])));

function changeTaskOption(value, type, options) {
    options = options || {};
    options[type] = value;
    jsonRPCRequest({'method': 'aria2.changeOption', 'gid': gid, 'options': options}, () => printTaskOption(gid));
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {'method': 'aria2.getOption', 'gid': gid},
        (result) => {
            taskOptions.forEach((item, index) => { document.getElementById(item).value = result[optionsType[index]] || ''; });
        }
    );
}

document.getElementById('loadProxy').addEventListener('click', (event) => {
    if (!document.getElementById('optionProxy').disabled) {
        var allproxy = localStorage.getItem('allproxy') || '';
        changeTaskOption(allproxy, 'all-proxy');
    }
});

document.getElementById('taskName').addEventListener('click', (event) => {
    window.parent.window.postMessage({'remove': 'taskMgrWindow'});
    clearInterval(taskManager);
});

function copyFileUrl(url) {
    navigator.clipboard.writeText(url);
    showNotification(window['warn_url_copied'], url);
}

var taskManager;
var gid
