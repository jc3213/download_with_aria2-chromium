function importSettings(textJSON, update = true) {
    var options = JSON.parse(textJSON);
    Object.keys(options).forEach(key => {
        if (localStorage[key] && update) {
            return;
        }
        localStorage[key] = options[key];
    });
};

function exportSettings(callback) {
    var options = JSON.stringify(localStorage);
    var blob = new Blob([options], {type: 'application/json; charset=utf-8'});
    if (typeof callback === 'function') {
        callback(blob);
    }
}
