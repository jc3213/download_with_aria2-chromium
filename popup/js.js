window.addEventListener('message', (event) => {
    if (event.data.method === 'close') {
        document.getElementById(event.data.id).remove();
    }
    else if (event.data.method === 'manager') {
        var gid = event.data.id;
        openModuleWindow({'name': 'taskMgr', 'id': 'taskMgrWindow', 'load': (event) => event.target.contentWindow.postMessage(gid)});
    }
});

var modules = [
    {'button': 'newTask_btn', 'name': 'newTask', 'id': 'newTaskWindow'}, 
    {'button': 'options_btn', 'name': 'options', 'id': 'optionsWindow'}
];
modules.forEach(item => document.getElementById(item.button).addEventListener('click', (event) => initialModules(event.target, item)));

function initialModules(element, module) {
    if (element.classList.contains('checked')) {
        document.getElementById(module.id).remove();
    }
    else {
        openModuleWindow(module)
    }
    element.classList.toggle('checked');
}

function openModuleWindow(module) {
    var iframe = document.createElement('iframe');
    iframe.id = module.id;
    iframe.src = '/modules/' + module.name + '/index.html';
    document.body.appendChild(iframe);
    if (module.load) {
        iframe.addEventListener('load', module.load);
    }
    if (module.parent) {
        module.parent.appendChild(iframe);
    }
    else {
        document.body.appendChild(iframe);
    }
}

var taskTabs = ['active_btn', 'waiting_btn', 'stopped_btn'];
var taskQueues = ['activeQueue', 'waitingQueue', 'stoppedQueue'];
taskTabs.forEach((item, index) => document.getElementById(item).addEventListener('click', (event) => toggleTaskQueue(event.target, item, taskQueues[index])));

function toggleTaskQueue(element, active, activeTab) {
    if (element.classList.contains('checked')) {
        taskQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'block'; });
    }
    else {
        document.getElementById(activeTab).style.display = 'block';
        taskTabs.forEach(item => { if (item !== active) document.getElementById(item).classList.remove('checked'); });
        taskQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'none'; });
    }
    element.classList.toggle('checked');
}

document.getElementById('purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({'method': 'aria2.purgeDownloadResult'});
});

function printMainFrame() {
    jsonRPCRequest(
        {'method': 'aria2.getGlobalStat'},
        (result) => {
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var active = (result.numActive | 0);
            var waiting = (result.numWaiting | 0);
            var stopped = (result.numStopped | 0);
            printTaskQueue(waiting, stopped);
            document.getElementById('numActive').innerHTML = active;
            document.getElementById('numWaiting').innerHTML = waiting;
            document.getElementById('numStopped').innerHTML = stopped;
            document.getElementById('downloadSpeed').innerHTML = downloadSpeed;
            document.getElementById('uploadSpeed').innerHTML = uploadSpeed;
            document.getElementById('queueTabs').style.display = 'block';
            document.getElementById('menuTop').style.display = 'block';
            document.getElementById('networkStatus').style.display = 'none';
        }, (error, rpc) => {
            document.getElementById('queueTabs').style.display = 'none';
            document.getElementById('menuTop').style.display = 'none';
            document.getElementById('networkStatus').innerHTML = error;
            document.getElementById('networkStatus').style.display = 'block';
        }
    );

    function printTaskQueue(globalWaiting, globalStopped) {
        jsonRPCRequest([
            {'method': 'aria2.tellActive'},
            {'method': 'aria2.tellWaiting', 'index': [0, globalWaiting]},
            {'method': 'aria2.tellStopped', 'index': [0, globalStopped]},
        ], (activeQueue, waitingQueue, stoppedQueue) => {
            activeQueue.forEach(item => printTaskInfo(item, document.getElementById('activeQueue')));
            waitingQueue.forEach(item => printTaskInfo(item, document.getElementById('waitingQueue')));
            stoppedQueue.forEach(item => printTaskInfo(item, document.getElementById('stoppedQueue')));
        });
    }

    function printTaskInfo(result, parent) {
        if (document.getElementById(result.gid)) {
            document.getElementById(result.gid).contentWindow.postMessage(result);
        }
        else {
            openModuleWindow({'name': 'template', 'id': result.gid, 'parent': parent, 'load': (event) => event.target.contentWindow.postMessage(result)});
        }
    }
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
