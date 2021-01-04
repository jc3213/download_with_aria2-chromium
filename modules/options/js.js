var menuTabs = [
    {button: 'tabBasic', queue: 'menuBasic'},
    {button: 'tabAdvanced', queue: 'menuAdvanced'},
    {button: 'tabDownload', queue: 'menuDownload'}
];
menuTabs.forEach(active => {
    document.getElementById(active.button).addEventListener('click', (event) => {
        document.getElementById(active.button).classList.add('checked');
        document.getElementById(active.queue).style.display = 'block';
        menuTabs.forEach(item => { if (item.queue !== active.queue) {document.getElementById(item.queue).style.display = 'none'; document.getElementById(item.button).classList.remove('checked');} });
    });
});

var settings = new Map([
    ['jsonrpc'],
    ['token'],
    ['useragent'],
    ['allproxy'],
    ['proxied'],
    ['capture', {change: captureFilters, onload: captureFilters}],
    ['sizeEntry', {change: calcFileSize}],
    ['sizeUnit', {change: calcFileSize}],
    ['fileExt'],
    ['monitored'],
    ['ignored']
]).forEach((property, id) => {
    var menu = document.getElementById(id);
    menu.value = localStorage[id];
    menu.addEventListener('change', (event) => { localStorage[id] = event.target.value; });
    if (property) {
        if (property.change) {
            menu.addEventListener('change', property.change);
        }
        if (typeof property.onload === 'function') {
            property.onload();
        }
    }
});

document.getElementById('aria2Check').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.getVersion'},
        (result) => {
            showNotification(chrome.i18n.getMessage('warn_aria2_version'), result.version);
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
    var capture = document.getElementById('capture').value | 0;
    if (capture === 1) {
        document.getElementById('captureFilters').style.display = 'block';
    }
    else {
        document.getElementById('captureFilters').style.display = 'none';
    }
}

function calcFileSize(event) {
    var number = document.getElementById('sizeEntry').value | 0;
    var unit = document.getElementById('sizeUnit').value | 0;
    var size = number * Math.pow(1024, unit);
    localStorage['fileSize'] = size;
}
