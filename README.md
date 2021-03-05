# What is this

- This extension is completely rewritten from [chrome-aria2-integration](https://github.com/robbielj/chrome-aria2-integration) 

# Firefox Quantum

- Visit [Download with Aria2 Firefox](https://github.com/jc3213/download_with_aria2-firefox)

# Differences

<details>
    <summary><b>Easy-to-access options</b></summary>
    Ability to check for <b>JSONRPC URI</b> and <b>Secret Token</b>
    <br>Ability to modify <b>User Agent</b> for downloads
    <br>Ability to set <b>all-proxy</b> option for downloads automatically
    <br>Capture filters now have better logic, and better performance
    <br>Priority of filters: <b>Ignored Domains</b> > <b>Monitored Domains</b> > <b>File Extensions</b> > <b>File Sizes</b>
</details>

<details>
    <summary><b>Built-in task managers</b></summary>
    Indicate concurrent <b>active</b> download numbers over extension icon
    <br>Show <b>Active</b>, <b>Waiting</b>, <b>Stopped</b> task counts
    <br>Ability to filter task queues based on their status
    <br>Show global <b>Download</b>, <b>Upload</b> speed
    <br>Better <b>progress bar</b>, click to pause or unpause the task
    <br><b>Options</b> button to open <b>Options</b> instantly
    <br>Show error message if an error happens while contacting with <b>Aria2 jsonrpc</b>
    <br>Click <b>❌</b> to stop current task or remove download result
    <br>Click <b>🔍</b> to to open <b>taskDetails</b> window for more detailed infomations
    <br>Click <b>🌌</b> to restart <b>removed</b> or <b>error</b> non-bittorrent downloads
</details>

<details>
    <summary><b>Better performance and accessbility</b></summary>
    Pure <b>DOM</b> codes
    <br>Modularization Design
    <br>Native i18n supports
    <br>Better notifications
</details>

# How to use

<details>
    <summary><b>Popup.html</b></summary>
    <details>
        <summary><b>Top Menu</b></summary>
        <details>
            <summary><b>Tabs with Status</b></summary>
            <b>Active</b> - Filter only active downloads on <b>Task Manager</b>
            <br><b>Waiting</b> - Filter downloads those are paused or waiting in queue
            <br><b>Stopped</b> - Filter downloads stopped or completed
        </details>
        <b>New</b> - Toggle the <b>New Task Window</b>
        <br><b>Purdge</b> - Purdge all downloads that are completed or stopped
    </details>
    <details>
        <summary><b>Task Manager</b></summary>
        <b>❌</b> - Stop downloading task or remove stopped task from <b>Task Manager</b>
        <br><b>🔍</b> - Click to show current <b>Task Details</b>
        <br><b>🌌️</b> - Restart <b>removed</b> or <b>error</b> non-bittorrent downloads
        <br><b>Progress Bar</b> - Click to pause or unpause targeted download
    </details>
    <details>
        <summary><b>Bottom Menu</b></summary>
        <b>Download Speed</b> - Global download speed
        <br><b>Upload Speed</b> - Global updload speed
        <br><b>Option</b> - Open <b>Options Window</b>
    </details>
</details>

<details>
    <summary><b>Options Window</b></summary>
    <details>
        <summary><b>Basic</b></summary>
        <b>JSONRPC URI</b> - Url of your Aria2 jsonrpc
        <br><b>Secret Token</b> - Secret token of your Aria2 jsonrpc
    </details>
    <details>
        <summary><b>Advanced</b></summary>
        <b>User Agent</b> - You can modified user agent for every download
        <br><b>All Proxy</b> - Url of http or https protocol proxy services
        <br><b>Domains over Proxy</b> - Domains that needs a proxy service to download (auto-proxy profile)
    </details>
    <details>
        <summary><b>Download</b></summary>
        <details>
            <summary><b>Capture</b> - Ability to capture downloads from browser</summary>
            <b>File Size</b> - Filter downloads based on file size
            <br><b>File Extensions</b> - Filter downloads based on file extensions
            <br><b>Monitored Domains</b> - Capture downloads from listed domains
            <br><b>Ignored Domains</b> - Ignore downloads from listed domains
        </details>
    </details>
</details>

<details>
    <summary><b>New Task Window</b></summary>
    <b>Referer</b> - Change the referer of current download session
    <br><b>Download Url</b> - Input the urls of current download session
    <details>
        <summary><b>Use Proxy</b></summary>
        <b>checkbox</b> - Add <b>all-proxy</b> option to current download session (Only once)
        <br><b>textarea</b> - Change proxy service of current download session (Only once)
    </details>
    <b>Submit</b> - Create new download session with information provided
</details>

<details>
    <summary><b>Task Manager Window</b></summary>
    <b>Task Name</b> - Click to close <b>Task Details</b> window
    <br><b>Max Download Speed</b> - Ability to limit the max download speed of current download
    <br><b>Max Upload Speed</b> - Ability to limit the max upload speed of current download
    <br><b>Proxy Server</b> - Ability to change proxy server of current download
    <br><b>Load</b> - Load and set proxy server from options for current download
    <br><b>TaskFiles</b> - Files of current download, click to copy uri for non-bittorrent download
</details>

# Disadvantages

- Neither `Google Web Store`, nor `Microsoft Store` supports
    - My country has blocked all `Google` services
    - `Google` has a $5 fee, and `Microsoft` has a $18 fee
- Embedded `popup.html` may not be powerful enough for advanced users
    - Alternative [`Aria2 WebUI`](https://ziahamza.github.io/webui-aria2/) or [`Yet Another Aria2 Web Frontend`](http://binux.github.io/yaaw/demo/)
