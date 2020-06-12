$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

[
    'jsonrpc_error_auth',
    'jsonrpc_error_net'
].map(item => window[item] = chrome.i18n.getMessage(item));
