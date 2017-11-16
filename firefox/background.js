/*! 
 *  \brief     JIRA Attachment Downloader
 *  \details   This extension allows the user to download all attachments of a JIRA ticket with one click.
 *  \author    Thomas Irgang
 *  \version   1.5
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var api = browser;

var name_pattern = 0;

/*! load file name pattern. */
function loadFileNamePattern() {
    api.storage.sync.get("name_pattern", (value) => {
        name_pattern = api.runtime.lastError ? 0 : value;
    });
}

function handleMessage(msg) {
    if(msg) {
        if(msg.kind == "download") {
            var url = msg.url;
            var domain = msg.domain;
            var ticket = msg.ticket;
            var summary = msg.summary;
            
            if(url) {
                download(url, domain, ticket, summary);
                api.runtime.sendMessage({kind: "dl_ok"});
            } else {
                api.runtime.sendMessage({kind: "dl_err"});
            }
            
        }
        if(msg.kind == "pattern") {
            name_pattern = msg.pattern;
            console.log("Pattern updated" + pattern);
        }
    }
}

/*! Generate subfolder path from ticket ID. */
function getSavePath(ticket, domain, summary) {
    if(ticket) {
        var ticket_parts = ticket.split("-");
        return ticket_parts[0] + "/" + ticket_parts[1] + "/";
    }
    return "attachments/";
}

/*! Get file name from URL. */
function getFile(url) {
    return decodeURI(url.substring(url.lastIndexOf('/')+1));
}

/*! Callback for finished downloads. */
function downloadStarted(id) {
    console.log("Download " + id + " started.");
}

/*! Download all visible checked links. */
function download(url, domain, ticket, summary) {
    path = getSavePath(ticket);
    var file = getFile(url);
    var save_name = path + file;
    
    api.downloads.download({"url": url, "filename": file}, downloadStarted);
}

api.runtime.onMessage.addListener(handleMessage);
loadFileNamePattern();

console.log("Background script started.");
