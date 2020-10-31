window.addEventListener('message', (event) => {
    gid = event.data.gid;
    status = event.data.status;
    updateFrameBody(event.data);
});

function updateFrameBody(result) {
    var taskUrl = !result.bittorrent ? result.files[0].uris[0].uri : '';
    var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
    var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
    document.getElementById('taskName').innerHTML = taskUrl || taskName;
    document.getElementById('completed').innerHTML = bytesToFileSize(result.completedLength);
    document.getElementById('estimate').innerHTML = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
    document.getElementById('total').innerHTML = bytesToFileSize(result.totalLength);
    document.getElementById('connect').innerHTML = result.bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
    document.getElementById('download').innerHTML = bytesToFileSize(result.downloadSpeed);
    document.getElementById('upload').innerHTML = result.bittorrent ? bytesToFileSize(result.uploadSpeed) + '/s' : '';
    document.getElementById('meter_btn').className = result.status + 'Bar';
    document.getElementById('meter').innerHTML = completeRatio;
    document.getElementById('meter').style.width = completeRatio;
    document.getElementById('meter').className = result.status;
    if (result.bittorrent || !['error', 'removed'].includes(result.status)) {
        document.getElementById('retry_btn').style.display = 'none';
    }
}

document.getElementById('remove_btn').addEventListener('click', (event) => {
    if (['active', 'waiting', 'paused'].includes(status)) {
        jsonRPCRequest({'method': 'aria2.forceRemove', 'gid': gid}, removeTask);
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        jsonRPCRequest({'method': 'aria2.removeDownloadResult', 'gid': gid}, removeTask);
    }

    function removeTask() {
        window.parent.window.postMessage({'method': 'close', 'id': gid});
    }
});

document.getElementById('invest_btn').addEventListener('click', (event) => {
    window.parent.window.postMessage({'method': 'manager', 'id': gid});
});

document.getElementById('retry_btn').addEventListener('click', (event) => {
    jsonRPCRequest([
            {'method': 'aria2.getFiles', 'gid': gid},
            {'method': 'aria2.getOption', 'gid': gid},
        ], (files, options) => {
            jsonRPCRequest({'method': 'aria2.removeDownloadResult', 'gid': gid}, () => {
                downWithAria2({'url': files[0].uris[0].uri, 'options': options});
            });
        }
    );
});

document.getElementById('meter_btn').addEventListener('click', (event) => {
    if (['active', 'waiting'].includes(status)) {
        jsonRPCRequest({'method': 'aria2.pause', 'gid': gid});
    }
    else if (status === 'paused') {
        jsonRPCRequest({'method': 'aria2.unpause', 'gid': gid});
    }
});

var gid;
var status;
