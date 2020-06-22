# What is this

- This extension is forked from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)
- All codes have been completely rewritten

# Firefox Quantum

- Visit [Download with Aria2 for Firefox](https://github.com/jc3213/download_with_aria2-firefox/)

# Advantages

- Brand new option window
  - You can check whether `JSONRPC URI` or `Secret Token` is correct or not on `options.html`
  - Capture filters won't appear if the main `Capture` option is not checked
  - Capture filter `File Size` have two settings, `number` and `unit`
  - Priority of filter `Ignored Hosts` > `Monitored Hosts` > `File Extensions` > `File Sizes`
  - Filter performance `File Size` > `File Extensions` > `Ignored Hosts` = `Monitored Hosts`
- Brand new popup window
  - Show `Active`, `Waiting`, `Stopped` task counts
  - Filter task queues based on their status
  - Show global `Download`, `Upload` speed
  - Better `Progress` bar, click to pause or unpause the task
  - `Options` button to open `options.html` instantly
  - Show error message on top when an error occurs
  - Click `👁️` to show the all files of the select task with details
- Other optimization
  - New library `jQuery-3.5.1.js`
  - New icons
  - Full i18n supports
  - Removed libraries `fancysettings.js`, `store.js`, `i18n.js`, and `popuplib.min.js`
  - Removed unnecessary `*.js`, `chrome` api and `manifest` key usage
  - Better code readability, coding logic and performance
  - Better notification based on `JSONRPC` response

# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
  - My country has blocked all `Google` services
  - `Google` has a 5$ fee, and `Microsoft` has a $18 fee
