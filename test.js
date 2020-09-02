const watch = require(".");


const opts = { ignore_git: true, optimize_events: true }

watch(".", function(err, event) {
    if (err) console.error(err);
    else console.log(event)
}, opts);