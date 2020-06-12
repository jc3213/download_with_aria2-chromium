$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

$('#__i18n__ ').html((index, text) => {
    text.match(/\w+/g).map(item => window[item] = chrome.i18n.getMessage(item));
});
