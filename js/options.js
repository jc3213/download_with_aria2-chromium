function saveOption(event) {
    localStorage.setItem(event.target.id, event.target.value);
}

function calcFileSize(event) {
    var number = $('#sizeEntry').val() || 0;
    var unit = $('#sizeUnit').val();
    if (number === 0) {
        var size = 0;
    }
    else {
        size = number * Math.pow(1024, unit);
    }
    localStorage.setItem('fileSize', size);
    saveOption(event);
}

function makePattern(event) {
    var pattern = event.target.value.split('\n').filter(item => item !== '');
    localStorage.setItem(event.target.id.replace('List', ''), JSON.stringify(pattern));
    saveOption(event);
}

[
    {'id': 'jsonrpc', 'value': 'http://localhost:6800/jsonrpc', 'change': saveOption},
    {'id': 'token', 'value': '', 'change': saveOption},
    {'id': 'sizeEntry', 'value': 0, 'change': calcFileSize},
    {'id': 'sizeUnit', 'value': 2, 'change': calcFileSize},
    {'id': 'fileExt', 'value': '', 'change': saveOption},
    {'id': 'monitoredList', 'value': '', 'change': makePattern},
    {'id': 'ignoredList', 'value': '', 'change': makePattern}
].map(item => $('#' + item.id).val(localStorage.getItem(item.id) || item.value).on('change', item.change));

$('#aria2Check').on('click', (event) => {
    jsonRPCRequest(
        createJSON('aria2.getVersion'),
        (result) => {
            showNotification(result.version, 'Aria2 version');
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

$('#aria2Show').on('click', (event) => {
    if ($('#aria2Show').hasClass('checked')) {
        $('#token').attr('type', 'password');
    }
    else {
        $('#token').attr('type', 'text');
    }
    $('#aria2Show').toggleClass('checked');
});

$('#capture').attr('checked', () => {
    var checked = JSON.parse(localStorage.getItem('capture')) || false;
    captureFilter(checked);
    return checked;
}).on('click', (event) => {
    captureFilter(event.target.checked);
    localStorage.setItem(event.target.id, event.target.checked);
});

function captureFilter(checked) {
    if (checked) {
        $('#filters').show(100);
    }
    else {
        $('#filters').hide(100);
    }
}
