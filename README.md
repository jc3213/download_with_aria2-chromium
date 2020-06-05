# What is this

- This extension is forked from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)
- Most of the codes have been rewritten completely


# Advantages

- Brand new option window
  - No dependency on `fancysettings.js`, `store.js` and other related library
  - You can check if your `JSON RPC URI` or `Secret Token` is correct or not on option window
  - Capture filters won't appear if the main `Capture` option is not checked
  - Capture filter `File Size` now have two settings, `number` and `unit`
  - Any of the capture filers can be turned off if you just keep them empty
- Optimized popup window
  - No dependency on `popuplib.min.js`
  - Show `Active`, `Waiting`, `Stopped` task counts
  - Show `Download`, `Upload` speed
  - Better `Progress` bar
  - Show notification if authentication fails or no response from `JSON RPC`
- Bug fixes
  - Fixed capture, if `File Size` checkbox is disabled, other filters won't work
  - Fixed cookies, cookies should be merged with `' '` not `''`
- Other optimization
  - New library `jQuery-3.5.1.js`
  - New icons
  - Removed unnecessary `chrome` api and `manifest` key usage
  - Better code readability and performance
  - Better notifications
  - Priority of capture `Blacklist` > `Whitelist` > `File Extension` > `File Size`
- Mozilla Quantum compatibility
  - Changed `chrome.downloads.onDeterminingFilename` api to `chrome.downloads.onCreated`
  - Changed manifest key `options_page` to `options_ui`


# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
  - My country has blocked all `Google` services
  - `Google` has a 5$ fee, and `Microsoft` has a $18 fee
- No i18n support
  - `i18n.js` has been removed altogether with `fancysettings.js`
  - No plan to implement i18n support

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
