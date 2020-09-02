const nsfw = require('nsfw'),
    path = require('path'),
    fs = require('fs');

let mem;


class Watcher {

    constructor(dir, cb, opts) {
        let self = this;

        cb = typeof cb == 'function' ? cb : function(e) {
            console.log({ e });
        }

        self.opts = Object.assign({
            ignore_git: false,
            optimize_events: false
        }, opts);

        self.nsfw_actions = {
            0: "created",
            1: "deleted",
            2: "modified",
            3: "renamed"
        }


        if (self.opts.optimize_events) {
            // memoize common functions
            mem = mem || require('mem');

            self.compact_events = mem((o) => {

                let file_path;
                file_path = path.join(o.directory, o.file);

                return {
                    [file_path]: Object.assign(o, {
                        file_path,
                        action_name: self.nsfw_actions[o.action]
                    })
                }

            }, {
                cacheKey: arguments_ => JSON.stringify(arguments_[0])
            });

        }

        self.dir = path.resolve(dir);
        self.watch(cb);

        return self;
    }

    handle_events(events, cb) {

        let self = this;

        if (self.opts.optimize_events) {
            // optimize
            events = events
                .filter(o => {
                    // ignore the git folder
                    return !self.opts.ignore_git || (!/.\.git.?/.test(o.directory) && !/\.git/.test(o.file))
                })
                .map((o) => {
                    return self.compact_events(o)
                })
                .reduce((a, b) => Object.assign(a, b), {})

            //return as array
            events = Object.values(events)
        }

        if (events.length) cb(null, events);
        // else cb(null)

    }



    async watch(cb) {

        let self = this;

        if (fs.existsSync(self.dir)) {

            try {

                await nsfw(self.dir, events => {
                        self.handle_events(events, cb);
                    }, { debounceMS: 100 })
                    .then(function(watcher) {
                        watcher.start();
                        return watcher;
                    })
                    .then(function(watcher) {
                        //add watcher to our list
                        self.watcher = watcher;
                    })
                    .catch(cb)

            } catch (error) {
                cb(error);
            }
        } else {

            cb(new Error(`The directory "${self.dir}" does not exist!`));

        }

    }


    stop() {
        return this.watcher.stop()
    }

    safe_exit(a) {
        let self = this;
        // console.log(self.dir);
        // stop watcher
        self.watcher.stop();
        //exit process
        process.exit();
    }


}


// let watcher

function watch(dir, cb, opts) {

    // init watcher
    let watcher = new Watcher(dir, cb, opts);

    // manage safe exit
    process.on('uncaughtException', function(a) {
            watcher.safe_exit(a)
        })
        .on('SIGTERM', function(a) {
            watcher.safe_exit(a)
        })
        .on('SIGINT', function(a) {
            watcher.safe_exit(a)
        });
}

module.exports = watch;