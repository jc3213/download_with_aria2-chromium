$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});
