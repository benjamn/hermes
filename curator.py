#!/home/newmanb/local/bin/python

import httplib, urllib
from os import chdir, path, environ as env
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

def is_valid(id):
    return path.normpath(id) == id and id[0] != "/"

def read_file(id):
    if not is_valid(id):
        return "    // Invalid module ID"
    if id not in _files:
        _files[id] = open(id + ".js").read().strip()
    return _files[id]

def deps(id):
    result = set()
    try:
        content = read_file(id)
    except:
        return result
    for match in _require_regexp.finditer(content):
        req_id = match.group("id")
        if (req_id[0] == "."):
            req_id = path.normpath(path.join(id, "..", req_id))
        if is_valid(req_id):
            result.add(req_id)
    return result

def dep_closure(*ids):
    result = set(ids)
    while 1:
        increase = 0
        ids = [id for id in result]
        for id in ids:
            before = len(result)
            result.update(deps(id))
            increase += len(result) - before
        if increase == 0:
            break
    return result

def wrap_modules(*ids):
    wms = []
    closure = dep_closure(*ids)
    for id in closure:
        try:
            content = read_file(id)
            wms.append(_template % (id, content))
        except:
            pass
    return ("/*\n" +
            str(closure) +
            "\n*/\n" +
            _preamble +
            _separator.join(wms) +
            _postamble)

def longest_common_prefix(str1, str2):
    limit = min(len(str1), len(str2))
    for i in range(limit):
        if str1[i] != str2[i]:
            return i
    return limit

def cgi_get_id():
    (dir, _) = path.split(env["SCRIPT_NAME"])
    uri = env["REQUEST_URI"].split("#")[0]
    uri = uri[longest_common_prefix(dir + "/", uri):]
    return _min_regexp.sub("", uri)

def argv_get_id():
    from sys import argv
    return argv[1]

def respond():
    try:
        id = cgi_get_id()
        print "Content-Type: application/javascript"
        print "Status: 200 OK"
        print
    except:
        chdir(path.dirname(__file__))
        id = argv_get_id()
    print wrap_modules(id.strip())

respond()
