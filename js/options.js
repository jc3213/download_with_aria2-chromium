var menuTabs = ['#tabBasic', '#tabAdvanced', '#tabDownload'];
var menuQueues = ['#menuBasic', '#menuAdvanced', '#menuDownload'];
menuTabs.forEach(item => document.querySelector(item).addEventListener('click', toggleTabs));

function toggleTabs(event) {
    var check = '#' + event.target.id;
    var active = check.replace('tab', 'menu');
    document.querySelector(check).classList.add('checked');
    document.querySelector(active).style.display = 'block';
    menuTabs.forEach(item => { if (item !== check) document.querySelector(item).classList.remove('checked') });
    menuQueues.forEach(item => { if (item !== active) document.querySelector(item).style.display = 'none' });
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
    var setting = document.querySelector('#' + menuitem.id);
    if (menuitem.load) {
        setting.addEventListener('load', menuitem.load)
    }
    if (menuitem.change) {
        setting.addEventListener('change', menuitem.change);   
    }
    if (menuitem.checkbox) {
        setting.setAttribute('checked', JSON.parse(localStorage.getItem(menuitem.id)) || menuitem.value);
        setting.addEventListener('change', event => localStorage.setItem(event.target.id, event.target.checked));
    }
    else {
        setting.value = localStorage.getItem(menuitem.id) || menuitem.value
        setting.addEventListener('change', event => localStorage.setItem(event.target.id, event.target.value));
    }
}

document.querySelector('#aria2Check').addEventListener('click', (event) => {
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

document.querySelector('#aria2Show').addEventListener('click', (event) => {
    if (event.target.classList.contains('checked')) {
        document.querySelector('#token').setAttribute('type', 'password');
    }
    else {
        document.querySelector('#token').setAttribute('type', 'text');
    }
    event.target.classList.toggle('checked');
});


function captureFilters() {
    var capture = (document.querySelector('#capture').value | 0);
    if (capture === 1) {
        document.querySelector('#captureFilters').style.display = 'block';
    }
    else {
        document.querySelector('#captureFilters').style.display = 'none';
    }
}

function calcFileSize(event) {
    var number = (document.querySelector('#sizeEntry').value | 0);
    var unit = (document.querySelector('#sizeUnit').value | 0);
    var size = number * Math.pow(1024, unit);
    localStorage.setItem('fileSize', size);
}
