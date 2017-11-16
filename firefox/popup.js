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
/*!
This code is based on the samples from https://developer.chrome.com/extensions/samples. Especially code snippets from the download examples is reused.
*/
var api = browser;

/*! All links contained in the website. */
var all_links = [];
/*! All links displayed as download options. */
var visible_links = [];
/*! Number of triggered downloads. */
var downloads = 0;
/*! Number of running downloads. */
var downloads_running = 0;
/*! JIRA ticket key */
var key = "";
/*! JIRA ticket summary */
var summary = "";
/*! current domain */
var domain = "";

/*! Update popup to show all visible links. */
function showLinks() {
    var links_table = document.getElementById('links');

    // remove old links
    while (links_table.children.length > 1) {
        links_table.removeChild(links_table.children[links_table.children.length - 1])
    }

    // add links
    for (var i = 0; i < visible_links.length; ++i) {
        var row = document.createElement('tr');
        var col0 = document.createElement('td');
        var col1 = document.createElement('td');

        var checkbox = document.createElement('input');
        checkbox.checked = true;
        checkbox.type = 'checkbox';
        checkbox.id = 'check' + i;
        col0.appendChild(checkbox);

        col1.innerText = getFile(visible_links[i]);
        col1.style.whiteSpace = 'nowrap';
        col1.id = "file" + i;
        col1.onclick = function () {
            checkbox.checked = !checkbox.checked;
        }

        row.appendChild(col0);
        row.appendChild(col1);
        links_table.appendChild(row);
    }
}

/*! Enable all check boxes. */
function toggleAll() {
    var checked = document.getElementById('toggle_all').checked;
    for (var i = 0; i < visible_links.length; ++i) {
        document.getElementById('check' + i).checked = checked;
    }
}

/*! Get file name from URL. */
function getFile(url) {
    return decodeURI(url.substring(url.lastIndexOf('/') + 1));
}

/*! Trigger download all visible checked links. */
function downloadCheckedLinks() {
    console.log("download links " + domain + ", " + key + ", " + summary);
    for (var i = 0; i < visible_links.length; ++i) {
        if (document.getElementById('check' + i).checked) {
            api.runtime.sendMessage({
                "kind": "download",
                "url": visible_links[i],
                "domain": domain,
                "ticket": key,
                "summary": summary,
                "nr": i
            });
            downloads = downloads + 1;
        }
    }
}

/*! Callback for started downloads. */
function downloadStarted(success, index) {
    downloads = downloads - 1;

    if (downloads == 0) {
        console.log("All downloads started.");
    }

    if (success) {
        downloads_running = downloads_running + 1;
    }

    var file_element = document.getElementById("file" + index);
    if (file_element) {
        file_element.style.color = success ? "yellow" : "red";
    } else {
        console.log("Element for file " + index + " not found");
    }
}

/*! Callback for finished downloads. */
function downloadDone(url) {
    var index = indexForUrl(url);
    if (index >= 0) {
        downloads_running = downloads_running - 1;

        if (downloads_running == 0) {
            console.log("All downloads finished.");
            window.close();
        }

        var file_element = document.getElementById("file" + index);
        if (file_element) {
            file_element.style.color = "green";
        } else {
            console.log("Element for file " + index + " not found");
        }
    } else {
        console.log("Index not found for " + url);
    }
}

/*! Search index of download URL. */
function indexForUrl(url) {
    if (url) {
        for (var i = 0; i < visible_links.length; i++) {
            if (url == visible_links[i]) {
                return i;
            }
        }
    }
    return -1;
}

/*! Filter all links. Only show JIRA ticket attachments and apply user search expression. */
function filterLinks() {
    // get expression to identify external attachment links
    var external = document.getElementById('external').value;
    // expression to identify JIRA attachment links
    var attachment_filter = "/secure/attachment/";
    // merge external and internal attachment link expression
    if (external) {
        attachment_filter = attachment_filter + "|" + external;
    }
    // reduce links list to attachment links
    visible_links = all_links.filter(function (link) {
        return link.match(attachment_filter);
    });
    // apply negative filter, hide strange JIRA created links.
    var additional_filter = "fileNameUrlEncoded";
    visible_links = visible_links.filter(function (link) {
        return !link.match(additional_filter);
    });
    // apply user filter expression
    var filter_value = document.getElementById('filter').value;
    if (document.getElementById('regex').checked) {
        //apply regex
        visible_links = visible_links.filter(function (link) {
            return link.match(filter_value);
        });
    } else {
        //apply search terms split by ' '
        var terms = filter_value.split(' ');
        visible_links = visible_links.filter(function (link) {
            for (var termI = 0; termI < terms.length; ++termI) {
                var term = terms[termI];
                if (term.length != 0) {
                    var expected = (term[0] != '-');
                    if (!expected) {
                        term = term.substr(1);
                        if (term.length == 0) {
                            continue;
                        }
                    }
                    var found = (-1 !== link.indexOf(term));
                    if (found != expected) {
                        return false;
                    }
                }
            }
            return true;
        });
    }
    // update popup
    showLinks();
}

/*! Extract domain from URL. */
function getDomain(url) {
    if (url) {
        var url_parts = url.split("/");
        if (url_parts.length > 2) {
            var domain = url_parts[2];
            if (domain) {
                return domain;
            }
        }
    }
    return "";
}

/*! Get last used filter for external download links. */
function getExternalFilter(url, callback) {
    var domain = getDomain(url);
    api.storage.sync.get(domain, (items) => {
        callback(api.runtime.lastError ? null : items[domain]);
    });
}

/*! Save filter for external download links. */
function saveExternalFilter(url) {
    var domain = getDomain(url);
    var external = document.getElementById('external').value;
    var items = {};
    items[domain] = external;
    api.storage.sync.set(items);
}

/*! Get URL of current tab. */
function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    api.tabs.query(queryInfo, (tabs) => {
        if (tabs) {
            var tab = tabs[0];
            if (tab) {
                console.log("Tab: " + JSON.stringify(tab));
                var url = tab.url;
                console.log("URL: " + url);
                if (url) {
                    callback(url);
                }
            } else {
                console.warn("No tab found!");
                console.warn(tabs);
            }
        }
    });
}

/*! Update filter for external links. */
function updateExternal() {
    filterLinks();

    getCurrentTabUrl((url) => {
        if (url) {
            saveExternalFilter(url);
        }
    });
}

/*! Update popup info with current tab URL. */
function updateTabUrl(url) {
    domain = getDomain(url);
    if (document.getElementById('domain')) {
        document.getElementById('domain').value = domain;
    }

    getExternalFilter(url, (external) => {
        if (external) {
            if (document.getElementById('external')) {
                document.getElementById('external').value = external;
            }
        }
    });
}

/*! Callback for link extraction script. */
api.runtime.onMessage.addListener(function (msg) {
    if (msg) {
        if (msg.kind == "links") {
            var links = msg.data;
            for (var index in links) {
                all_links.push(links[index]);
            }
            all_links.sort();
            filterLinks();
            showLinks();
        } else if (msg.kind == "key") {
            key = msg.data;
            document.getElementById('ticket').value = key;
            document.getElementById('title').innerText = "JIRA Attachment Downloader";
            document.getElementById('content').style.display = "block";
        } else if (msg.kind == "summary") {
            summary = msg.data;
            document.getElementById("summary").value = summary;
        } else if (msg.kind == "dl_ok") {
            downloadStarted(true, msg["nr"]);
        } else if (msg.kind == "dl_err") {
            downloadStarted(false, msg["nr"]);
        } else if (msg.kind == "dl_succ") {
            console.log("Message: dl_succ");
            downloadDone(msg["url"]);
        }
    }
});

function closePopup() {
    window.close();
}

/*! Init popup. */
window.onload = function () {
    // register form callbacks
    if (document.getElementById('external')) {
        document.getElementById('external').onkeyup = updateExternal;
    }
    if (document.getElementById('filter')) {
        document.getElementById('filter').onkeyup = filterLinks;
    }
    if (document.getElementById('regex')) {
        document.getElementById('regex').onchange = filterLinks;
    }
    if (document.getElementById('toggle_all')) {
        document.getElementById('toggle_all').onchange = toggleAll;
    }
    if (document.getElementById('download0')) {
        document.getElementById('download0').onclick = downloadCheckedLinks;
    }
    if (document.getElementById('download1')) {
        document.getElementById('download1').onclick = downloadCheckedLinks;
    }
    if (document.getElementById('x')) {
        document.getElementById('x').onclick = closePopup;
    }

    setTimeout(function () {
        // get current tab URL
        getCurrentTabUrl((url) => {
            updateTabUrl(url);
        });
        // inject link extraction script in all frames of current tab
        api.windows.getCurrent(function (currentWindow) {
            api.tabs.query({
                    active: true,
                    windowId: currentWindow.id
                },
                function (activeTabs) {
                    api.tabs.executeScript(
                        activeTabs[0].id, {
                            file: 'send_links.js',
                            allFrames: true
                        });
                });
        });
    }, 150);
};
