document.querySelector('#manager').style.display = location.search === '?from=popup' ? 'none' : 'block';

document.querySelector('#export').addEventListener('click', (event) => {
    var blob = new Blob([JSON.stringify(storage)], {type: 'application/json; charset=utf-8'});
    var saver = document.querySelector('#saver');
    saver.href = URL.createObjectURL(blob);
    saver.download = 'downwitharia2_options-' + new Date().toLocaleString('ja').replace(/[\/\s:]/g, '_') + '.json';
    saver.click();
});

document.querySelector('#import').addEventListener('click', (event) => {
    document.querySelector('#reader').click();
});

document.querySelector('#reader').addEventListener('change', (event) => {
    var reader = new FileReader();
    reader.onload = () => {
        var json = JSON.parse(reader.result);
        chrome.storage.sync.set(json);
        location.reload();
    };
    reader.readAsText(event.target.files[0]);
});

document.querySelector('#aria2_btn').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.getVersion'},
        (result) => {
            openModuleWindow('aria2Wnd', '/modules/aria2Wnd/index.html?version=' + result.version);
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

document.querySelector('#show_btn').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.className === 'checked' ? 'password' : 'text');
    event.target.classList.toggle('checked');
});

chrome.storage.sync.get(null, (storage) => {
    document.querySelectorAll('[local]').forEach(local => {
        var option = {};
        local.value = local.id === 'fileSize' ? storage[local.id] / 1048576 : storage[local.id];
        local.addEventListener('change', (event) => {
            option[local.id] = local.id === 'fileSize' ? local.value * 1048576 : local.value;
            chrome.storage.sync.set(option);
        });
    });

    document.querySelectorAll('[gear]').forEach(gear => {
        var setting = gear.getAttribute('gear').split('&');
        var id = setting.shift();
        gear.style.display = setting.includes(storage[id]) ? 'block' : 'none';
        document.getElementById(id).addEventListener('change', (event) => {
            chrome.storage.sync.get(null, (storage) => {
                gear.style.display = setting.includes(storage[id]) ? 'block' : 'none';
            });
        });
    });
});

localStorage.clear();

