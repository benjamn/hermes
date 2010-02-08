(function(global, doc) {
    /**
    ** HERMES: Fleet-Footed, Fully-Sealed JavaScript Module System
    * ============================================================
    * License: MIT with one amendment. If you succeed in shrinking the
    *          compressed size of this file without impeding readability,
    *          notify bn@cs.stanford.edu. Using a more compressible
    *          version of this file without notification is considered
    *          poor sportsmanship and a violation of the license terms.
    */
    var create = "createElement",
        absolutizer = doc[create]("script"),
        head = doc.documentElement.firstChild,
        lib, first_id, // Set in global.use below.
        required = {},
        saved_use = global.use;

    function log() {
        try { global.console.log.apply(global.console, arguments) }
        catch (x) {}
    }
    
    global.use = function(script) {
        global.use = saved_use;
        lib = script.getAttribute("lib");
        first_id = script.getAttribute("require");
        lib && first_id && require(first_id);
    };

    function entry(id) {
        return entry[id="#"+id] || (entry[id] = {});
    }

    function raise(x) { throw x }

    function require(id) {
        log("requiring", id);
        var e = entry(id);
        if (!e.exports) {
            if (e.module) try {
                evaluate(id);
                log("completed", id);
                retry();
            } catch (x) {
                log("deferring", id, x);
                delete e.exports;
                x == e ? required[id] = e
                       : raise(x);
            } else if (!e.requested) {
                (required[id] = e).requested = 1;
                request(id);
            }
        }
        return e.exports;
    }

    function evaluate(id) {
        log("evaluating", id);
        entry(id).module(function(rel_id) {
            return (require(rel_id[0] == "."
                            ? (absolutizer.src = "/" + id + "/../" + rel_id,
                               absolutizer.src.split("/").slice(3).join("/"))
                            : rel_id) ||
                    raise(entry(id)));
        }, entry(id).exports = {});
    }

    function request(id) {
        log("requesting", id);
        var script = doc[create]("script");
        script.src = lib + "/" + id + ".min.js";
        try { script.addEventListener("load", receive, false) }
        catch (x) { script.attachEvent("onload", receive) }
        head.appendChild(script);
    }

    function retry() {
        var ids = required;
        required = {};
        for (var id in ids) {
            log("retrying", id);
            require(id);
        }
    }

    function receive() {
        var received = global.exports, id;
        global.exports = null;
        for (id in received) {
            log("received", id);
            entry(id).module = entry(id).module || received[id];
        }
        retry();
    }

})(window, document);
