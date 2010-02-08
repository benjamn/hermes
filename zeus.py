#!/usr/bin/env python

import httplib, urllib
from os import path, environ as env
import re

_min_suffix = ".min.js"
_min_regexp = re.compile(re.escape(_min_suffix) + "$", re.I)
_preamble = "exports = {"
_template = """'%s': function(require, exports) {
%s
}"""
_separator = ","
_postamble = "};"

_require_regexp = re.compile(r"require\([\"'](?P<id>[\w\/\.]*?)[\"']\)", re.M)
_files = {}

def dep_closure(*ids):
    result = set(ids)
    while 1:
        count = 0
        ids = [id for id in result]
        for id in ids:
            before = len(result)
            result.update(deps(id))
            count += len(result) - before
        if count == 0:
            break
    return result

def wrap_modules(*ids):
    wms = [_template % (id, read_file(id))
           for id in dep_closure(*ids)]
    return ("/*\n" +
            str(dep_closure(*ids)) +
            "\n*/\n" +
            _preamble +
            _separator.join(wms) +
            _postamble)

def deps(id):
    content = read_file(id)
    result = set()
    for match in _require_regexp.finditer(content):
        req_id = match.group("id")
        if (req_id[0] == "."):
            req_id = path.normpath(path.join(id, "..", req_id))
        result.add(req_id)
    return result

def read_file(id):
    if id not in _files:
        try:
            content = open(id + ".js").read().strip()
        except:
            return "    // This module doesn't really exist, but, hey, you asked for it!"
        _files[id] = content
    return _files[id]

def get_relative_id():
    (dir, _) = path.split(env["SCRIPT_NAME"])
    uri = env["REQUEST_URI"]
    if uri.index(dir) == 0:
        uri = uri[len(dir):]
    return _min_regexp.sub("", uri[1:])

def render():
    id = get_relative_id()
    return wrap_modules(id)

print "Content-Type: application/javascript"
print "Status: 200 OK"
print
print render()
