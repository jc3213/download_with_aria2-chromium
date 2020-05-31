# What is this

- This extension is forked from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)

# Advantages

- New option window
  - You can check if your `JSON RPC URI` or `Secret Token` is correct or not in option window
  - Capture filters won't appear if `Capture` option is not checked
  - Capture filter `File Size` now have two settings, `number` and `unit`
  - If you want to turn off any of the capture filer, just keep it empty
- Bug fixes
  - Fixed capture, in the original code if `File Size` checkbox is disabled, other filters won't work
  - Fixed cookies, cookies should be concact with `' '` not `''`
- Code optimization
  - Moved from `DOM Object` to `jQuery`
  - Removed unnecessary `chrome` api usage
  - Removed unnecessary constructors
  - Better notification on `Aria2 JSON RPC` response
  - Priority of capture is `Blacklist` 1st, `Whitelist` 2nd, `File Extension` 3rd, `File Size` 4th
  - Better code readability and easier to maintain
  - Better performance

# Disadvantages

- No `Google Web Store`
  - This is because my country has blocked all `Google` services, and a `$5` fee is needed.
- No i18n support
  - The original code uses `i18n.js` which is binded to `fancysettings.js`, but all of these have been removed

# Firefox Quantum

- Add the code below to `manifest.json`
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
