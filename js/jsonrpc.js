function createJSON(method, gid, params) {
    var token = localStorage.getItem('token') || '';
    var json = {
        jsonrpc: 2.0,
        method: method,
        id: '',
        params: [
            'token:' + token
        ]
    };
    if (gid) {
        json.params.push(gid);
    }
    if (params) {
        json.params = [...json.params, ...params];
    }
    return json;
}

function jsonRPCRequest(json, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        var error = response.error;
        if (error) {
            return failure(chrome.i18n.getMessage('jsonrpc_auth_error'));
        }
        var result = response.result || response.map(item => item.result);
        if (result.length) {
            success(...result);
        }
        else {
            success(result);
        }
    };
    xhr.onerror = () => {
        failure(chrome.i18n.getMessage('jsonrpc_no_response'));
    };
    xhr.send(JSON.stringify(json));
}
