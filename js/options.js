function checkRPCResult(message) {
    var result = $('#aria2_result').html(message);
    setTimeout(() => {
        result.empty();
    }, 3000)
}

function captureHandler() {
    var checked = localStorage.getItem('capture') || '';
    if (checked === 'true') {
        $('#capture_filter').show(100);
        return true;
    }
    else {
        $('#capture_filter').hide(100);
        return false;
    }
}

function calcFileSize() {
    var number = $('#size_entry').val() || 0;
    var unit = $('#size_unit').val();
    if (number === 0) {
        var size = 0;
    }
    else {
        size = number * Math.pow(1024, unit);
    }
    localStorage.setItem('sizenumber', size);
}

function makePattern(entry, symbol) {
    if (entry === '') {
        return '';
    }
    entry = entry.split('\n').filter(item => item !== '');
    if (symbol) {
        entry = entry.map(item => symbol + item);
    }
    return entry.join('|').replace(/\./g, '\\.').replace(/\*/g, '[^ ]*');
}

$('#aria2_rpc').val(localStorage.getItem('aria2rpc') || '').on('change', (event) => {
    localStorage.setItem('aria2rpc', event.target.value);
});

$('#aria2_secret').val(localStorage.getItem('aria2secret') || '').on('change', (event) => {
    localStorage.setItem('aria2secret', event.target.value);
});

$('#aria2_check').on('click', (event) => {
    var xhr = new XMLHttpRequest();
    var rpc = $('#aria2_rpc').val() || 'http://localhost:6800/jsonrpc';
    var token = $('#aria2_secret').val();
    var json = {
        jsonrpc: 2.0,
        method: 'aria2.getVersion',
        id: '',
        params: [
            'token:' + token
        ]
    };
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (response.result) {
            checkRPCResult(response.result.version);
        }
        else if (response.error) {
            checkRPCResult('Auth Failure');
        }
    };
    xhr.onerror = (event) => {
        checkRPCResult('No Response');
    };
    xhr.send(JSON.stringify(json));
});

$('#capture_main').on('click', (event) => {
    localStorage.setItem('capture', event.target.checked);
    captureHandler();
}).attr('checked', captureHandler);

$('#size_entry').val(localStorage.getItem('sizeentry') || '').on('change', (event) => {
    localStorage.setItem('sizeentry', event.target.value);
    calcFileSize();
});

$('#size_unit').val(localStorage.getItem('sizeunit') || '2').on('change', (event) => {
    localStorage.setItem('sizeunit', event.target.value);
    calcFileSize();
});

$('#file_ext').val(localStorage.getItem('extlist') || '').on('change', (event) => {
    localStorage.setItem('extlist', event.target.value);
    localStorage.setItem('extpattern', makePattern(event.target.value, '.'));
});

$('#whitelist').val(localStorage.getItem('whitelist') || '').on('change', (event) => {
    localStorage.setItem('whitelist', event.target.value);
    localStorage.setItem('whitepattern', makePattern(event.target.value));
});

$('#blacklist').val(localStorage.getItem('blacklist') || '').on('change', (event) => {
    localStorage.setItem('blacklist', event.target.value);
    localStorage.setItem('blackpattern', makePattern(event.target.value));
});
