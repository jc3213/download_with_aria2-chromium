# What is this

- This extension is forked from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)
- Nearly all codes have been completely rewritten

# Advantages

- Brand new option window
  - You can check whether `JSONRPC URI` or `Secret Token` is correct or not on `options.html`
  - Capture filters won't appear if the main `Capture` option is not checked
  - Capture filter `File Size` have two settings, `number` and `unit`
  - Priority of capture `Ignored Host` > `Monitored Host` > `File Extension` > `File Size`
  - Filter performance `File Size` > `File Extension` = `Ignored Host` = `Monitored Host`
- Brand new popup window
  - Show `Active`, `Waiting`, `Stopped` task counts
  - Filter task queues based on their status
  - Show global `Download`, `Upload` speed
  - Better `Progress` bar, click to pause and unpause the task
  - `Options` button to open `options.html` instantly
  - Show notification on authentication failure or network error
  - Ability to list the files of the target download task
- Bug fixes
  - Fixed capture, if `File Size` checkbox is unchecked, other filters won't work
  - Fixed cookies, `array.prototype.join()` is better than `string1` + `string2`
- Other optimization
  - New library `jQuery-3.5.1.js`
  - New icons
  - Removed libraries `fancysettings.js`, `store.js`, `popuplib.min.js`, `i18n.js`
  - Removed unnecessary `*.js`, `chrome` api and `manifest` key usage
  - Better code readability, coding logic and performance
  - Better notifications
  - Full i18n supports

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
- Don't use `Capture` function, and remove all related codes, it is broken on firefox
- `webRequest` may be a more accurate and less buggy work around
- `webRequest` may have conflicts with other extensions and is more complicated
- Read [Issue #1](https://github.com/jc3213/download_with_aria2/issues/1) for more details
