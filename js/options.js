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

function makePattern(event) {
    var entry = event.target.value.split('\n').filter(item => item !== '');
    if (event.target.id === 'fileExtList') {
        entry = entry.map(item => '.' + item);
    }
    var pattern = entry.join('|').replace(/\./g, '\\.').replace(/\*/g, '[^ ]*');
    localStorage.setItem(event.target.id, event.target.value);
    localStorage.setItem(event.target.id.replace('List', ''), pattern);
}

$('#jsonrpc').val(localStorage.getItem('jsonrpc') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#token').val(localStorage.getItem('token') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#aria2Check').on('click', (event) => {
    jsonRPCRequest(
        createJSON('aria2.getVersion'),
        (result) => {
            showNotification(result.version);
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

$('#fileExtList').val(localStorage.getItem('fileExtList') || '').on('change', makePattern);

$('#monitoredList').val(localStorage.getItem('monitoredList') || '').on('change', makePattern);

$('#ignoredList').val(localStorage.getItem('ignoredList') || '').on('change', makePattern);
