function checkRPCResult(message) {
    var result = $('#aria2_result').html(message);
    setTimeout(() => {
        result.empty();
    }, 3000)
}

function captureHandler() {
    var checked = localStorage.getItem('capture') === 'true' ? true: false;
    if (checked) {
        $('#capture_filters').show(100);
        return true;
    }
    else {
        $('#capture_filters').hide(100);
        return false;
    }
}

function calcFileSize(event) {
    var number = $('#size_entry').val() || 0;
    var unit = $('#size_unit').val();
    if (number === 0) {
        var size = 0;
    }
    else {
        size = number * Math.pow(1024, unit);
    }
    localStorage.setItem('size_number', size);
    localStorage.setItem(event.target.id, event.target.value);
}

function makePattern(event) {
    var entry = event.target.value.split('\n').filter(item => item !== '');
    if (event.target.id === 'ext_list') {
        entry = entry.map(item => '.' + item);
    }
    var pattern = entry.join('|').replace(/\./g, '\\.').replace(/\*/g, '[^ ]*');
    localStorage.setItem(event.target.id, event.target.value);
    localStorage.setItem(event.target.id.replace('list', 'pattern'), pattern);
}

$('#aria2_rpc').val(localStorage.getItem('aria2_rpc') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#aria2_secret').val(localStorage.getItem('aria2_secret') || '').on('change', event => localStorage.setItem(event.target.id, event.target.value));

$('#aria2_check').on('click', (event) => {
    jsonRPCRequest(
        createJSON('aria2.getVersion'),
        (result) => {
            checkRPCResult(result.version);
        },
        (error) => {
            checkRPCResult(error);
        }
    );
});

$('#aria2_show').on('click', (event) => {
    if ($('#aria2_show').hasClass('checked')) {
        $('#aria2_show').removeClass('checked');
        $('#aria2_secret').attr('type', 'password');
    }
    else {
        $('#aria2_show').addClass('checked');
        $('#aria2_secret').attr('type', 'text');
    }
});

$('#capture_main').attr('checked', captureHandler).on('click', (event) => {
    localStorage.setItem('capture', event.target.checked);
    captureHandler();
});

$('#size_entry').val(localStorage.getItem('size_entry') || 0).on('change', calcFileSize);

$('#size_unit').val(localStorage.getItem('size_unit') || 2).on('change', calcFileSize);

$('#ext_list').val(localStorage.getItem('ext_list') || '').on('change', makePattern);

$('#mon_list').val(localStorage.getItem('mon_list') || '').on('change', makePattern);

$('#nor_list').val(localStorage.getItem('nor_list') || '').on('change', makePattern);
