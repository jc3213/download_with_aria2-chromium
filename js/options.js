function checkRPCResult(message) {
    var result = $('#aria2Result').html(message);
    setTimeout(() => {
        result.empty();
    }, 3000)
}

function captureOption() {
    var checked = JSON.parse(localStorage.getItem('capture')) || false;
    if (checked) {
        $('#capture').html('☒');
        $('#filters').show(100);
    }
    else {
        $('#capture').html('☐');
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
            checkRPCResult(result.version);
        },
        (error) => {
            checkRPCResult(error);
        }
    );
});

$('#aria2Show').on('click', (event) => {
    if ($('#aria2Show').hasClass('checked')) {
        $('#aria2Show').removeClass('checked');
        $('#token').attr('type', 'password');
    }
    else {
        $('#aria2Show').addClass('checked');
        $('#token').attr('type', 'text');
    }
});

$('#capture').on('click', (event) => {
    localStorage.setItem('capture', !(JSON.parse(localStorage.getItem('capture')) || false));
    captureOption();
}).ready(captureOption);

$('#sizeEntry').val(localStorage.getItem('sizeEntry') || 0).on('change', calcFileSize);

$('#sizeUnit').val(localStorage.getItem('sizeUnit') || 2).on('change', calcFileSize);

$('#fileExtList').val(localStorage.getItem('fileExtList') || '').on('change', makePattern);

$('#monitoredList').val(localStorage.getItem('monitoredList') || '').on('change', makePattern);

$('#ignoredList').val(localStorage.getItem('ignoredList') || '').on('change', makePattern);
