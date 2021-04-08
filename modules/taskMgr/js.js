var gid;
var url;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data.gid;
    url = event.data.url;
    printTaskOption();
    printTaskManager();
    taskManager = setInterval(printTaskManager, 1000);
})

function printTaskManager() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid},
        (result) => {
            var fileName = result.files[0].path ? result.files[0].path.match(/[^\/]+$/)[0] : '';
            var completed = result.status === 'complete';
            if (result.bittorrent) {
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
                document.querySelector('#taskFiles').style.display = 'block';
                document.querySelector('#taskFiles').innerHTML = printTaskFiles(result.files);
            }
            else {
                taskName = fileName || task.files[0].uris[0].uri;
                document.querySelector('#taskUris').style.display = 'block';
                document.querySelector('#taskUris > div').innerHTML = printTaskUris(result.files[0].uris);
            }
            document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
            document.querySelector('#max-download-limit').disabled = completed;
            document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
            document.querySelector('#max-upload-limit').disabled = !result.bittorrent || completed;
            document.querySelector('#all-proxy').disabled = completed;
            document.querySelector('#taskName').innerText = taskName;
            document.querySelector('#taskName').className = 'button title ' + result.status;
        }
    );

    function printTaskFiles(files) {
        var fileInfo = '<table>';
        files.forEach(file => {
            var filename = file.path.match(/[^\/]+$/)[0];
            var filePath = file.path.replace(/\//g, '\\');
            var fileSize = bytesToFileSize(file.length);
            var fileRatio = ((file.completedLength / file.length * 10000 | 0) / 100) + '%';
            fileInfo += '<tr><td>' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
        });
        return fileInfo + '</table>';
    }

    function printTaskUris(uris) {
        var uriInfo = '<div><table>';
        var uriUsed = [];
        uris.forEach(uri => {
            if (uri.status === 'used' && !uriUsed.includes(uri.uri)) {
                uriUsed.push(uri.uri);
                uriInfo += '<tr><td>' + uri.uri + '</td></tr>';
            }
        });
        return uriInfo + '</table></div>';
    }
}

var taskOptions = [
    {id: 'max-download-limit', value: '0'},
    {id: 'max-upload-limit', value: '0'},
    {id: 'all-proxy', value: '' }
];
taskOptions.forEach(item => document.getElementById(item.id).addEventListener('change', (event) => changeTaskOption(item.id, event.target.value || item.value)));

function changeTaskOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeOption', gid, options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            taskOptions.forEach(item => { document.getElementById(item.id).value = options[item.id] || item.value; });
        }
    );
}

document.querySelector('#loadProxy').addEventListener('click', (event) => {
    if (!document.querySelector('#all-proxy').disabled) {
        changeTaskOption('all-proxy', localStorage['allproxy']);
    }
});

document.querySelector('#taskName').addEventListener('click', (event) => {
    parent.window.postMessage({id: 'taskMgrWindow'});
});

document.querySelector('#taskUris').addEventListener('click', (event) => {
    if (event.target.tagName === 'TD') {
        var url = event.target.innerText;
        navigator.clipboard.writeText(url);
        showNotification(chrome.i18n.getMessage('warn_url_copied'), url);
    }
    else if (event.target.tagName === 'SPAN') {
        // TODO: Add new uri to download
    }
});
