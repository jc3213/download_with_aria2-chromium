$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

[
    'jsonrpc_error_auth', 'jsonrpc_error_net',
    'task_download_size', 'task_estimated_time', 'task_connections', 'task_bit_seeders'
].map(item => window[item] = chrome.i18n.getMessage(item));
