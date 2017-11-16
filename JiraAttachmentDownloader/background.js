/*! 
 *  \brief     JIRA Attachment Downloader
 *  \details   This extension allows the user to download all attachments of a JIRA ticket with one click.
 *  \author    Thomas Irgang
 *  \version   1.6
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var api = chrome;

/*! Name pattern for save files. */
var name_pattern = 0;

/*! load file name pattern. */
function loadFileNamePattern() {
    api.storage.sync.get("name_pattern", (value) => {
        name_pattern = api.runtime.lastError ? 0 : value;
    });
}

/*! Callback for download requests. */
function handleMessage(msg) {
    if (msg) {
        console.log("Message: " + msg.kind);
        if (msg["kind"] == "download") {
            var url = msg["url"];
            var domain = msg["domain"];
            var ticket = msg["ticket"];
            var summary = msg["summary"];
            var nr = msg["nr"];

            console.log("Download " + nr + ": " + url);

            if (url) {
                download(url, domain, ticket, summary);
                api.runtime.sendMessage({
                    "kind": "dl_ok",
                    "nr": nr
                });
            } else {
                console.log("Can not download. Invalid URL! " + nr);
                api.runtime.sendMessage({
                    "kind": "dl_err",
                    "nr": nr
                });
            }

        } else if (msg["kind"] == "pattern") {
            console.log("Pattern updated: " + msg["pattern"]);
            name_pattern = msg["pattern"];
        }
    }
}

/*! Generate file name for download. */
function getSaveName(ticket, domain, summary, file) {
    var ticket_id = ticket;
    var project = "unknown";
    var save_name = file;

    var ticket_parts = ticket.split("-");
    if (ticket_parts.length > 1) {
        ticket_id = ticket_parts[1];
        project = ticket_parts[0];
    }

    if (name_pattern == 0) {
        save_name = project + "/" + ticket_id + "/" + file;
    } else if (name_pattern == 1) {
        save_name = project + "/" + ticket_id + "-" + summary + "/" + file;
    } else if (name_pattern == 2) {
        save_name = ticket + "_" + file;
    }

    return save_name;
}

/*! Get file name from URL. */
function getFile(url) {
    return decodeURI(url.substring(url.lastIndexOf('/') + 1));
}

/*! Callback for finished downloads. */
function downloadStarted(id) {
    console.log("Download " + id + " started.");
}

/*! Download all visible checked links. */
function download(url, domain, ticket, summary) {
    var save_name = getSaveName(ticket, domain, summary, getFile(url));
    console.log(url + " -> " + save_name);
    api.downloads.download({
        "url": url,
        "filename": save_name,
        "conflictAction": "overwrite"
    }, downloadStarted);
}


/*! Callback for download status change. */
function handleChanged(delta) {
    if (delta.state && delta.state.current === "complete") {
        api.downloads.search({
                "id": delta.id
            },
            downloadFinished);
    }
}

/*! Download was finished, update popup. */
function downloadFinished(items) {
    if (items && items.length > 0) {
        var item = items[0];
        var url = items[0].url;
        api.runtime.sendMessage({
            "kind": "dl_succ",
            "url": url
        });
        console.log(url + " was downloaded as " + items[0].filename);
    }
}

api.downloads.onChanged.addListener(handleChanged);

api.runtime.onMessage.addListener(handleMessage);

loadFileNamePattern();

console.log("Background script started.");
