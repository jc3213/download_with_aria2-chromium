$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

$('[i18n_title]').each((index, element) => {
    $(element).attr('title', chrome.i18n.getMessage(element.title));
});

[
    'task_download_size', 'task_estimated_time', 'task_connections', 'task_bit_seeders',
    'warn_aria2_version', 'warn_url_copied'
].map(item => window[item] = chrome.i18n.getMessage(item));
