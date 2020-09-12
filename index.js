const nsfw = require('nsfw'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

let mem;


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


    stop() {
        return this.watcher.stop()
    }

    safe_exit(a) {
        let self = this;
        // console.log(self.dir);
        // stop watcher
        self.watcher.stop();
    }


}


// let watcher

function watch(dir, cb) {

    // init watcher
    let watcher = new Watcher(dir, cb);

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

    return watcher;
}

module.exports = watch;