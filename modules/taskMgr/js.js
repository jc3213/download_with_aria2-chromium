var gid;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data.gid;
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
                taskName = fileName || result.files[0].uris[0].uri;
                document.querySelector('#taskUris').style.display = 'block';
                document.querySelector('#taskAddUri').style.display = 'block';
                document.querySelector('#taskUris').innerHTML = printTaskUris(result.files[0].uris);
            }
            document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
            document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
            document.querySelector('#max-download-limit').disabled = completed;
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
            var status = file.selected ? 'active' : 'error';
            fileInfo += '<tr><td class="' + status + '">' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
        });
        return fileInfo + '</table>';
    }

    function printTaskUris(uris) {
        var uriInfo = '<table>';
        var url = [];
        var index = 1
        uris.forEach(uri => {
            if (!url.includes(uri.uri)) {
                var status = uri.status === 'used' ? 'active' : 'waiting';
                url.push(uri.uri);
                uriInfo += '<tr><td class="' + status + '">' + uri.uri + '</td></tr>';
            }
        });
        return uriInfo + '</table>';
    }
}

var taskOptions = [
    {id: 'max-download-limit', value: '0'},
    {id: 'max-upload-limit', value: '0'},
    {id: 'all-proxy', value: '' }
];
taskOptions.forEach(option => {
    document.getElementById(option.id).addEventListener('change', (event) => {
        changeTaskOption(option.id, event.target.value || option.value);
    });
});

function changeTaskOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeOption', gid, options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            taskOptions.forEach(item => {
                document.getElementById(item.id).value = options[item.id] || item.value;
            });
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
    var url = event.target.innerText;
    navigator.clipboard.writeText(url);
    showNotification(chrome.i18n.getMessage('warn_url_copied'), url);
});

document.querySelector('#taskAddUri > span').addEventListener('click', (event) => {
    var add = document.querySelector('#taskAddUri > input').value;
    if (add.match(/^https?:\/\/.*/)) {
        jsonRPCRequest(
            {method: 'aria2.changeUri', gid, add},
            (result) => {
                document.querySelector('#taskAddUri > input').value = '';
            }
        );
    }
});
