document.querySelectorAll('[i18n]').forEach(item => {
    var message = item.getAttribute('i18n');
    item.innerHTML = chrome.i18n.getMessage(message);
});

document.querySelectorAll('[i18n_title]').forEach(item => {
    var message = item.getAttribute('i18n_title');
    item.title = chrome.i18n.getMessage(message);
});

[
    'warn_aria2_version', 'warn_url_copied'
].forEach(item => window[item] = chrome.i18n.getMessage(item));
