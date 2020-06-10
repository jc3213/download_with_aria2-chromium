function createJSON(method, gid, params) {
    var token = localStorage.getItem('aria2_secret') || '';
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

function jsonRPCRequest(json, onload, onerror) {
    var xhr = new XMLHttpRequest();
    var rpc = localStorage.getItem('aria2_rpc') || 'http://localhost:6800/jsonrpc';
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        var error = response.error;
        if (error) {
            return onerror(error.message);
        }
        if (typeof onload !== 'function') {
            return;
        }
        var result = response.result || response.map(item => item.result);
        if (result.length) {
            onload(...result);
        }
        else {
            onload(result);
        }
    };
    xhr.onerror = () => {
        onerror('No Response');
    };
    xhr.send(JSON.stringify(json));
}
