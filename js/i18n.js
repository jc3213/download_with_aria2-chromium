$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

[
    'task_download_size', 'task_estimated_time', 'task_connections', 'task_bit_seeders',
    'task_file_index', 'task_file_name', 'task_complete_ratio'
].map(item => window[item] = chrome.i18n.getMessage(item));
