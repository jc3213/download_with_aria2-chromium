document.querySelectorAll('[tab]').forEach(tab => {
    var active = tab.getAttribute('tab');
    tab.addEventListener('click', (event) => {
        if (!tab.classList.contains('checkd')) {
            document.querySelectorAll('[panel]').forEach(panel => {
                var id = panel.getAttribute('panel');
                if (id === active) {
                    tab.className = 'checked';
                    panel.style.display = 'block';
                }
                else {
                    panel.style.display = 'none';
                    document.querySelector('[tab="' + id + '"]').removeAttribute('class');
                }
            });
        }
    });
});
