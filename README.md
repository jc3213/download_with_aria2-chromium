# What is this

- This extension is a completely rewritten version of [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)

# Firefox Quantum

- Visit [Download with Aria2 for Firefox](https://github.com/jc3213/download_with_aria2-firefox)

# Differences

Options.html
<details>
  You can check whether <b>JSONRPC URI</b> or <b>Secret Token</b> is correct or not <br/>
  You can modify <b>User Agent</b> for download to bypass some restrictions <br/>
  You can set <b>all-proxy</b> property for downloads manually or automatically <br/>
  Capture filters now have better logic, and better user approach <br/>
  Priority of filter <b>Ignored Domains</b> > <b>Monitored Domains</b> > <b>File Extensions</b> > <b>File Sizes</b> <br/>
  Filter performance <b>File Size</b> > <b>Ignored Domains</b> = <b>Monitored Domains</b> = <b>File Extensions</b>
</details>
Popup.html
<details>
  Show <b>Active</b>, <b>Waiting</b>, <b>Stopped</b> task counts <br/>
  Filter task queues based on their status <br/>
  Show global <b>Download</b>, <b>Upload</b> speed <br/>
  Better <b>Progress</b> bar, click to pause or unpause the task <br/>
  <b>Options</b> button to open <b>Options.html</b> instantly <br/>
  Show error message on top when an error occurs <br/>
  Click <b>📋</b> to copy download url to clipboard <br/>
  Click <b>👁️</b> to show the all files of bit-torrent downloads
</details>
Other optimization
<details>
  New library <b>jQuery-3.5.1.js</b> <br/>
  New icons <br/>
  Native i18n supports <br/>
  Removed libraries <b>fancysettings.js</b>, <b>store.js</b>, <b>i18n.js</b>, and <b>popuplib.min.js</b> <br/>
  Removed unnecessary <b>*.js</b>, <b>chrome</b> api and <b>manifest</b> key usage <br/>
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
