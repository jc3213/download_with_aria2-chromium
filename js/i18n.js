$('[i18n]').each((index, element) => {
    element.innerHTML = chrome.i18n.getMessage(element.innerHTML);
});
