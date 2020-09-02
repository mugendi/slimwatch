# Performant File Watching

If you have attempted watching huge folders or thousands of files via NodeJs, then you know how much a pain it is.

Node is just bad at that!

[NSFW](https://github.com/Axosoft/nsfw) solves this issue by using a native module to watch files ensuring a consistent API and minimal footprint.

This wrapper simply helps you use NSFW effectively by managing things like:

- Wrapping the watcher in a class for easy use
- Managing graceful exit to ensure all watchers are stopped
- Collapsing duplicate events into a single array of only unique events
- Enables you to ignore ".git" folders 
- Automatic directory resolution as NSFW only works with absolute paths
- Adds more information to the returned arrays


## How to use

```javascript

const watch = require("slimwatch");

const opts = { 
    ignore_git: true, 
    optimize_events: true 
}

watch("/YOUR-DIR", function(err, event) {
    if (err) console.error(err);
    else console.log(event)
}, opts);

```

Whenever changes occur, the callback is called with an array listing all the changes as shown below.

```json

[
  {
    action: 2,
    directory: '/home/node/slimwatch', 
    file: 'index.js',
    file_path: '/home/node/slimwatch/index.js',
    action_name: 'modified'
  }
]

```

Enjoy performant file watching! :-)