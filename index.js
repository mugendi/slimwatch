const nsfw = require('nsfw'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

let mem, watchers = [];


class Watcher {

    constructor(dir, cb) {
        let self = this;

        cb = typeof cb == 'function' ? cb : function(e) {
            console.log({ e });
        }

        self.nsfw_actions = {
            0: "created",
            1: "deleted",
            2: "modified",
            3: "renamed"
        }


        self.dir = path.resolve(dir);
        self.watch(cb);

        return self;
    }

    handle_events(events, cb) {



        let self = this;

        events = events.map((o) => {
            o.action_name = self.nsfw_actions[o.action]
            return o
        })

        // Use Lodash to reduce duplicate events...
        let grp = _.groupBy(events, (o) => _.values(_.pick(o, 'action', 'directory', 'file', 'newFile')).join('-'));

        events = _.values(grp).map(_.first)

        // console.log(events);
        if (events.length) cb(null, events);

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


    async stop() {
        return await this.watcher.stop().catch(console.error)
    }

}




function watch(dir, cb) {

    let watcher = _.find(watchers, { dir });

    if (!watcher) {
        console.log(`Adding watcher for ${dir}`);
        // init watcher
        watcher = new Watcher(dir, cb);
        watchers.push(watcher);
    }

    // console.log(watchers.length, 'watchers...');

    return watcher;
}


function safe_exit(exitReason) {
    let self = this;

    // console.log({ exitReason });

    while (watchers.length) {
        w = watchers.shift();
        w.stop().catch(console.error)
    }

}

// manage safe exit
process.on('uncaughtException', function() {
        safe_exit('uncaughtException')
    })
    .on('SIGTERM', function() {
        safe_exit('SIGTERM')
    })
    .on('SIGINT', function() {
        safe_exit('SIGINT')
    });

module.exports = watch;