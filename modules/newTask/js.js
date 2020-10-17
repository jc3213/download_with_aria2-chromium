document.getElementById('setProxy').addEventListener('click', (event) => {
    document.getElementById('taskProxy').disabled = !document.getElementById('taskProxy').disabled;
});

document.getElementById('submit_btn').addEventListener('click', (event) => {
    var referer = document.getElementById('taskReferer').value;
    var proxy = document.getElementById('setProxy').checked ? document.getElementById('taskProxy').value : '';
    var url = document.getElementById('taskBatch').value.split('\n').forEach(item => { if (item !== '') downWithAria2({'url': item, 'referer': referer, 'proxy': proxy}) });
    window.parent.window.postMessage('newTaskWindow');
});

window.addEventListener('load', (event) => {
    document.getElementById('taskReferer').value = '';
    document.getElementById('taskBatch').value = '';
    document.getElementById('setProxy').checked = false;
    document.getElementById('taskProxy').value = localStorage.getItem('allproxy') || '';
    document.getElementById('taskProxy').disabled = true;
});
