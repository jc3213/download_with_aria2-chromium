# What is this

- This extension is forked from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)
- Nearly all codes have been completely rewritten


# Advantages

- Brand new option window
  - You can check whether `JSONRPC URI` or `Secret Token` is correct or not on `options.html`
  - Capture filters won't appear if the main `Capture` option is not checked
  - Capture filter `File Size` have two settings, `number` and `unit`
  - Priority of capture `Ignored Host` > `Monitored Host` > `File Extension` > `File Size`
- Brand new popup window
  - Show `Active`, `Waiting`, `Stopped` task counts
  - Filter task queues based on their status
  - Show global `Download`, `Upload` speed
  - Better `Progress` bar, click to pause and unpause the task
  - `Options` button to open `options.html` instantly
  - Show notification on authentication failure or network error
  - Ability to list the files of target download task
- Bug fixes
  - Fixed capture, if `File Size` checkbox is disabled, other filters won't work
  - Fixed cookies, cookies should be merged with `' '` not `''`
- Other optimization
  - New library `jQuery-3.5.1.js`
  - New icons
  - Removed `fancysettings.js`, `store.js`, `popuplib.min.js`
  - Removed unnecessary `inject.js`
  - Removed unnecessary `chrome` api and `manifest` key usage
  - Better code readability and performance
  - Better notifications
  - Better i18n


# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
  - My country has blocked all `Google` services
  - `Google` has a 5$ fee, and `Microsoft` has a $18 fee

# Firefox Quantum

- Add the manifest keys below to `manifest.json`
```javascript
    "applications": {
        "gecko": {
            "id": "firefox@downwitharia2",
            "strict_min_version": "58.0"
        }
    },
    "developer": {
       "name": "jc3213",
       "url": "https://github.com/jc3213/download_with_aria2"
    }
```
- Don't use `Capture` function, and remove all related codes, because it's broken on firefox
- `webRequest` maybe a more accurate and less buggy work around
- `webRequest` it may have conflicts with other extensions and is more complicated
- Read [Issue #1](https://github.com/jc3213/download_with_aria2/issues/1) for more details
