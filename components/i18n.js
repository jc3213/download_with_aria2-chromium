document.querySelectorAll('[i18n]').forEach(item => item.innerHTML = chrome.i18n.getMessage(item.innerHTML));

document.querySelectorAll('[i18n_title]').forEach(item => item.title = chrome.i18n.getMessage(item.title));

[
    'warn_aria2_version', 'warn_url_copied'
].forEach(item => window[item] = chrome.i18n.getMessage(item));
