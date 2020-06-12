$('[i18n]').each((index, element) => {
    $(element).html(chrome.i18n.getMessage(element.innerHTML));
});

$('#__i18n__ > span').each((index, element) => {
    window[element.id] = $(element).html();
});
