# What is this

- This extension is a completely rewritten version of [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)

# Firefox Quantum

- Visit [Download with Aria2 for Firefox](https://github.com/jc3213/download_with_aria2-firefox)

# Differences

- Brand new option window
<details>
  You can check whether `JSONRPC URI` or `Secret Token` is correct or not <br />
  You can modify `User Agent` for download to bypass some restrictions <br />
  You can set `all-proxy` property for downloads manually or automatically <br />
  Capture filters now have better logic, and better user approach <br />
  Priority of filter `Ignored Domains` > `Monitored Domains` > `File Extensions` > `File Sizes` <br />
  Filter performance `File Size` > `Ignored Domains` = `Monitored Domains` = `File Extensions` 
</details>
- Brand new popup window
<details>
  Show `Active`, `Waiting`, `Stopped` task counts <br />
  Filter task queues based on their status <br />
  Show global `Download`, `Upload` speed <br />
  Better `Progress` bar, click to pause or unpause the task <br />
  `Options` button to open `options.html` instantly <br />
  Show error message on top when an error occurs <br />
  Click `📋` to copy download url to clipboard <br />
  Click `👁️` to show the all files of bit-torrent downloads
</details>
- Other optimization
<details>
  New library `jQuery-3.5.1.js` <br />
  New icons <br />
  Native i18n supports <br />
  Removed libraries `fancysettings.js`, `store.js`, `i18n.js`, and `popuplib.min.js` <br />
  Removed unnecessary `*.js`, `chrome` api and `manifest` key usage <br />
  Better notifications and performance
</details>

# How to use

- Options.html
  - `Basic`
      - `JSONRPC URI`: 
      - `Secret Token`: 
  - `Advanced`
      - `User Agent`:
      - `All Proxy`: 
      - `Domains over Proxy`: 
  - `Download`
      - `Capture`
          - `File Size`: 
          - `File Extensions`: 
          - `Monitored Domains`: 
          - `Ignored Domains`: 
- Popup.html
  - `New`: 
  - `Purdge`:  
  - `Option`: 
- `New Task Window` @ Popup.html
  - `Referer`: 
  - `Download Url`: 
  - `Use Proxy`
      - `checkbox`: 
      - `textarea`: 
- `Task Manager` @ Popup.html
  - `Progress Bar`: 
  - `❌ Button`: 
  - `👁️ Button`: 
  - `📋 Button`: 

# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
  - My country has blocked all `Google` services
  - `Google` has a 5$ fee, and `Microsoft` has a $18 fee
- Embedded `popup.html` may not be powerful enough for advanced users
  - Alternative [`Aria2 WebUI`](https://ziahamza.github.io/webui-aria2/) or [`Yet Another Aria2 Web Frontend`](http://binux.github.io/yaaw/demo/)
