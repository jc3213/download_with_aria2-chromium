function captureOption() {
    var checked = JSON.parse(localStorage.getItem('capture')) || false;
    if (checked) {
        $('#filters').show(100);
    }
    else {
        $('#filters').hide(100);
    }
    return checked;
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
    localStorage.setItem(event.target.id, event.target.value);
}

function hostPattern(event) {
    var entry = event.target.value.split('\n').filter(item => item !== '');
    var pattern = JSON.stringify(entry);
    localStorage.setItem(event.target.id, event.target.value);
    localStorage.setItem(event.target.id.replace('List', ''), pattern);
}

$('#jsonrpc').val(localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#token').val(localStorage.getItem('token') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

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

$('#capture').attr('checked', captureOption).on('click', (event) => {
    localStorage.setItem('capture', event.target.checked);
    captureOption();
});

$('#sizeEntry').val(localStorage.getItem('sizeEntry') || 0).on('change', calcFileSize);

$('#sizeUnit').val(localStorage.getItem('sizeUnit') || 2).on('change', calcFileSize);

$('#fileExt').val(localStorage.getItem('fileExt') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#monitoredList').val(localStorage.getItem('monitoredList') || '').on('change', hostPattern);

$('#ignoredList').val(localStorage.getItem('ignoredList') || '').on('change', hostPattern);
