function checkRPCResult(message) {
    var result = $('#aria2_rpc_result').html(message);
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
    var number = $('#capture_size_value > input').val() || 0;
    var unit = $('#capture_size_unit > select').val();
    if (number === 0) {
        var size = 0;
    }
    else {
        size = number * Math.pow(1024, unit);
    }
    localStorage.setItem('sizenumber', size);
}

function makePattern(entry) {
    if (entry === '') {
        return '';
    }
    return entry.split(/\n/).filter(item => item !== '').join('|').replace(/\./g, '\\.').replace(/\*/g, '[^ ]*');
}

$('#aria2_rpc_value > input').val(localStorage.getItem('aria2rpc') || '').on('change', (event) => {
    localStorage.setItem('aria2rpc', event.target.value);
});

$('#aria2_secret_value > input').val(localStorage.getItem('aria2secret') || '').on('change', (event) => {
    localStorage.setItem('aria2secret', event.target.value);
});

$('#aria2_rpc_check').on('click', (event) => {
    var xhr = new XMLHttpRequest();
    var rpc = $('#aria2_rpc_value > input').val() || 'http://localhost:6800/jsonrpc';
    var token = $('#aria2_secret_value > input').val();
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

$('#capture_main_value > input').on('click', (event) => {
    localStorage.setItem('capture', event.target.checked);
    captureHandler();
}).attr('checked', captureHandler);

$('#capture_size_value > input').val(localStorage.getItem('sizeentry') || '').on('change', (event) => {
    localStorage.setItem('sizeentry', event.target.value);
    calcFileSize();
});

$('#capture_size_unit > select').val(localStorage.getItem('sizeunit') || '2').on('change', (event) => {
    localStorage.setItem('sizeunit', event.target.value);
    calcFileSize();
});

$('#capture_ext_value > textarea').val(localStorage.getItem('extlist') || '').on('change', (event) => {
    localStorage.setItem('extlist', event.target.value);
    localStorage.setItem('extpattern', makePattern(event.target.value));
});

$('#capture_white_value > textarea').val(localStorage.getItem('whitelist') || '').on('change', (event) => {
    localStorage.setItem('whitelist', event.target.value);
    localStorage.setItem('whitepattern', makePattern(event.target.value));
});

$('#capture_black_value > textarea').val(localStorage.getItem('blacklist') || '').on('change', (event) => {
    localStorage.setItem('blacklist', event.target.value);
    localStorage.setItem('blackpattern', makePattern(event.target.value));
});
