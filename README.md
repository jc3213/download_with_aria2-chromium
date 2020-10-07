# What is this

- This extension is a completely rewritten version of [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration)

# Firefox Quantum

- Visit [Download with Aria2 Firefox](https://github.com/jc3213/download_with_aria2-firefox)

# Differences

Options.html
<details>
  You can check whether <b>JSONRPC URI</b> or <b>Secret Token</b> is correct or not
  <br>You can modify <b>User Agent</b> for download to bypass some restrictions
  <br>You can set <b>all-proxy</b> property for downloads manually or automatically
  <br>Capture filters now have better logic, and better user accessbility
  <br>Priority of filter <b>Ignored Domains</b> > <b>Monitored Domains</b> > <b>File Extensions</b> > <b>File Sizes</b>
</details>
Popup.html
<details>
  Show <b>Active</b>, <b>Waiting</b>, <b>Stopped</b> task counts
  <br>Filter task queues based on their status
  <br>Show global <b>Download</b>, <b>Upload</b> speed
  <br>Advanced <b>Progress</b> bar, click to pause or unpause the task
  <br><b>Options</b> button to open <b>Options.html</b> instantly
  <br>Show error message on top when an error occurs
  <br>Click <b>📋</b> to copy the url of target download to clipboard
  <br>Click <b>👁️</b> to show the all files of bit-torrent downloads
</details>
Other optimization
<details>
    New library <b>jQuery-3.5.1.min.js</b>
    <br>New icons
    <br>Native i18n supports
    <br>Removed libraries <b>fancysettings.js</b>, <b>store.js</b>, <b>i18n.js</b>, and <b>popuplib.min.js</b>
    <br>Removed unnecessary <b>*.js</b>, <b>chrome</b> api and <b>manifest</b> key usage
    <br>Better notifications and performance
</details>

# How to use

Options.html
<details>
    <b>Basic</b>
    <details>
        <b>JSONRPC URI</b> - Url of your Aria2 jsonrpc
        <br><b>Secret Token</b> - Secret token of your Aria2 jsonrpc
    </details>
    <b>Advanced</b>
    <details>
        <b>User Agent</b> - You can modified user agent for every download
        <br><b>All Proxy</b> - Url of http or https protocol proxy services
        <br><b>Domains over Proxy</b> - Domains that needs a proxy service to download (auto-proxy profile)
    </details>
    <b>Download</b>
    <details>
        <b>Capture</b> - Ability to capture downloads from browser
        <details>
            <b>File Size</b> - Filter downloads based on file size
            <br><b>File Extensions</b> - Filter downloads based on file extensions
            <br><b>Monitored Domains</b> - Capture downloads from listed domains
            <br><b>Ignored Domains</b> - Ignore downloads from listed domains
        </details>
    </details>
</details>
Popup.html
<details>
    <b>Top Menu</b>
    <details>
        <b>Tabs with Status</b>
            <details>
            <b>Active</b> - Filter only active downloads on <b>Task Manager</b>
            <br><b>Waiting</b> - Filter downloads those are paused or still in queue
            <br><b>Stopped</b> - Filter downloads stopped or completed
            </details>
        <b>New</b> - Open <b>New Task Window</b>
            <details>
                <b>New Task Window</b>
                <details>
                    <b>Referer</b> - Change the referer of this download session
                    <br><b>Download Url</b> - Input the urls of this download session
                    <br><b>Use Proxy</b>
                    <details>
                        <b>checkbox</b> - Add <b>all-proxy</b> option to this download session (Only this time)
                        <br><b>textarea</b> - Change proxy service of this download session (Only this time)
                    </details>
                </details>
            </details>
        <br><b>Purdge</b> - Purdge all downloads that are completed or stopped
    </details>
    <b>Task Manager</b>
    <details>
        <b>❌</b> - Stop downloading task or remove stopped task from <b>Task Manager</b>
        <br><b>🔍</b> - Show options and files of seleted task
        <br><b>🖨️</b> - Copy url of targeted download to clipboard
        <br><b>Progress Bar</b> - Click to pause or unpause targeted download
    </details>
    <b>Bottom Menu</b>
    <details>
        <b>Download Speed</b> - Global download speed
        <br><b>Upload Speed</b> - Global updload speed
        <br><b>Option</b> - Open <b>Options.html</b>
    </details>
</details>

# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
  - My country has blocked all `Google` services
  - `Google` has a $5 fee, and `Microsoft` has a $18 fee
- Embedded `popup.html` may not be powerful enough for advanced users
  - Alternative [`Aria2 WebUI`](https://ziahamza.github.io/webui-aria2/) or [`Yet Another Aria2 Web Frontend`](http://binux.github.io/yaaw/demo/)
