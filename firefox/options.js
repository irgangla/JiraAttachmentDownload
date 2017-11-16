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

/*! Load file name pattern form browser data store. */
function loadNamePattern() {
    api.storage.sync.get("name_pattern", (value) => {
        var pattern = api.runtime.lastError ? 0 : value;
        for (var i = 0; i < 3; i++) {
            var id = "pattern_" + i;
            document.getElementById(id).selected = (i == pattern);
        }
    });
}

/*! Save file name pattern to browser data store. */
function saveNamePattern() {
    var pattern = document.getElementById("pattern").value
    api.storage.sync.set({
        "name_pattern": pattern
    });
    api.runtime.sendMessage({
        "kind": "pattern",
        "pattern": pattern
    });
    console.log("New name pattern: " + pattern);

}

/*! Setup options page. */
function setup() {
    // register form callbacks
    document.getElementById('save').onclick = saveNamePattern;

    loadNamePattern();
};

/*! Init popup. */
window.onload = setup;
