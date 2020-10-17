var menuTabs = ['tabBasic', 'tabAdvanced', 'tabDownload'];
var menuQueues = ['menuBasic', 'menuAdvanced', 'menuDownload'];
menuTabs.forEach(item => document.getElementById(item).addEventListener('click', toggleTabs));

function toggleTabs(event) {
    var active = event.target.id;
    var index = menuTabs.indexOf(active);
    var activeTab = menuQueues[index];
    document.getElementById(active).classList.add('checked');
    document.getElementById(activeTab).style.display = 'block';
    menuTabs.forEach(item => { if (item !== active) document.getElementById(item).classList.remove('checked'); });
    menuQueues.forEach(item => { if (item !== activeTab) document.getElementById(item).style.display = 'none'; });
}

[
    {'id': 'jsonrpc', 'value': 'http://localhost:6800/jsonrpc'},
    {'id': 'token', 'value': ''},
    {'id': 'useragent', 'value': navigator.userAgent},
    {'id': 'allproxy', 'value': ''},
    {'id': 'proxied', 'value': ''},
    {'id': 'capture', 'value': 0, 'load': captureFilters, 'change': captureFilters},
    {'id': 'sizeEntry', 'value': 0, 'change': calcFileSize},
    {'id': 'sizeUnit', 'value': 2, 'change': calcFileSize},
    {'id': 'fileExt', 'value': ''},
    {'id': 'monitored', 'value': ''},
    {'id': 'ignored', 'value': ''}
].forEach(item => initiateOption(item));

function initiateOption(menuitem) {
    var setting = document.getElementById(menuitem.id);
    if (menuitem.load) {
        setting.addEventListener('load', menuitem.load)
    }
    if (menuitem.change) {
        setting.addEventListener('change', menuitem.change);   
    }
    if (menuitem.checkbox) {
        setting.setAttribute('checked', JSON.parse(localStorage.getItem(menuitem.id)) || menuitem.value);
        setting.addEventListener('change', event => localStorage.setItem(menuitem.id, event.target.checked));
    }
    else {
        setting.value = localStorage.getItem(menuitem.id) || menuitem.value
        setting.addEventListener('change', event => localStorage.setItem(menuitem.id, event.target.value));
    }
}

document.getElementById('aria2Check').addEventListener('click', (event) => {
    jsonRPCRequest(
        {'method': 'aria2.getVersion'},
        (result) => {
            showNotification(window['warn_aria2_version'], result.version);
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

document.getElementById('aria2Show').addEventListener('click', (event) => {
    if (event.target.classList.contains('checked')) {
        document.getElementById('token').setAttribute('type', 'password');
    }
    else {
        document.getElementById('token').setAttribute('type', 'text');
    }
    event.target.classList.toggle('checked');
});

function captureFilters() {
    var capture = (document.getElementById('capture').value | 0);
    if (capture === 1) {
        document.getElementById('captureFilters').style.display = 'block';
    }
    else {
        document.getElementById('captureFilters').style.display = 'none';
    }
}

function calcFileSize(event) {
    var number = (document.getElementById('sizeEntry').value | 0);
    var unit = (document.getElementById('sizeUnit').value | 0);
    var size = number * Math.pow(1024, unit);
    localStorage.setItem('fileSize', size);
}
