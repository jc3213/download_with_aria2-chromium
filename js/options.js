function saveOption(event) {
    localStorage.setItem(event.target.id, event.target.value);
}

[
    {'id': 'jsonrpc', 'value': 'http://localhost:6800/jsonrpc', 'change': saveOption},
    {'id': 'token', 'value': '', 'change': saveOption},
    {'id': 'sizeEntry', 'value': 0, 'change': calcFileSize},
    {'id': 'sizeUnit', 'value': 2, 'change': calcFileSize},
    {'id': 'fileExt', 'value': '', 'change': saveOption},
    {'id': 'monitored', 'value': '', 'change': saveOption},
    {'id': 'ignored', 'value': '', 'change': saveOption}
].map(item => $('#' + item.id).val(localStorage.getItem(item.id) || item.value).on('change', item.change));

$('#aria2Check').on('click', (event) => {
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
