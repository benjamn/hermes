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
    var gebtn = "getElementsByTagName",
        head = doc[gebtn]("head").item(0),
        nodeName = "script",
        script, scripts = doc[gebtn](nodeName),
        i = scripts.length,
        attr = "require",
        lib_id,
        required = {};

    while (script = scripts.item(--i))
        if (lib_id = script.getAttribute(attr)) {
            lib_id = lib_id.split("#");
            script.removeAttribute(attr);
            break;
        }

    function log() {
        try { console.log.apply(console, arguments) }
        catch (x) {}
    }

    function entry(id) {
        return entry[id="#"+id] || (entry[id] = {});
    }

    function raise(x) { throw x }

    function require(id) {
        log("requiring", id);
        var e = entry(id);
        if (!e.exports) {
            if (e.module) try {
                log("evaluating", id);
                (1,e.module)(function(rel_id) {
                    return require(absolutize(rel_id, id)) || raise(e);
                }, e.exports = {});
                log("completed", id);
                retry();
            } catch (x) {
                log("deferring", id, x);
                delete e.exports;
                x == e ? required[id] = e
                       : raise(x);
            } else if (!e.requested) {
                (required[id] = e).requested = 1;
                log("requesting", id);
                var script = doc.createElement(nodeName);
                try { script.addEventListener("load", receive, false) }
                catch (x) {
                    script.attachEvent("onreadystatechange", function() {
                        /loaded|complete/.test(script.readyState) && receive();
                    });
                }
                script.src = lib_id[0] + "/" + id + ".min.js";
                head.appendChild(script);
            }
        }
        return e.exports;
    }

    function absolutize(rel_id, abs_id) {
        if (/^\./.test(rel_id)) {
            rel_id = abs_id + "/../" + rel_id;
            while (rel_id != (abs_id = rel_id.replace(/(\/)\.?\/|[^\/]+\/\.\.\//, "$1")))
                rel_id = abs_id;
        }
        return rel_id;
    }

    function retry() {
        var id, ids = required;
        required = {};
        for (id in ids) {
            log("retrying", id);
            require(id);
        }
    }

    function receive() {
        var id, ids = global["exports"];
        global["exports"] = null;
        for (id in ids) {
            log("received", id);
            entry(id).module = entry(id).module || ids[id];
        }
        retry();
    }

    require(lib_id[1]);

})(window, document);
