document.querySelectorAll('[i18n]').forEach(item => {
    var message = item.getAttribute('i18n');
    var i18n = chrome.i18n.getMessage(message);
    var textNode = document.createTextNode(i18n);
    item.appendChild(textNode);
});

document.querySelectorAll('[i18n_title]').forEach(item => {
    var message = item.getAttribute('i18n_title');
    var i18n = chrome.i18n.getMessage(message);
    item.title = i18n;   
});

[
    'warn_aria2_version', 'warn_url_copied'
].forEach(item => window[item] = chrome.i18n.getMessage(item));
