(function () {
    "use strict";



    WinJS.UI.Pages.define("/html/homePage.html", {
        ready: ready
    });
})();

var socket = io.connect('http://techblog.hilife-jp.info:3000/chat');
// my color assigned by the server
var myColor = false;
// my name sent to the server
var myName = false;

// This function is called whenever a user navigates to this page. It
// populates the page elements with the app's data.
function ready(element, options) {

    function initialize() {
        WinJS.UI.processAll();

        socket.on('connect', function (msg) {
            console.log("connet");
            document.getElementById("user").style.display = "block";
        });

        socket.on('message', function (data) {
            console.log(data);
            // try to parse JSON message. Because we know that the server always returns
            // JSON this should work without any problem but we should make sure that
            // the massage is not chunked or otherwise damaged.
            try {
                var json = JSON.parse(data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', data);
                return;
            }

            // NOTE: if you're not sure about the JSON structure
            // check the server source code above
            if (json.type === 'color') { // first response from the server with user's color
                myColor = json.data;
                document.getElementById("userLabel").style.color = myColor;
                var messageDiv = document.getElementById("message");
                messageDiv.style.display = "block";
                document.getElementById("messageInput").focus();
            } else if (json.type === 'history') { // entire message history
                // insert every single message to the chat window
                for (var i = 0; i < json.data.length; i++) {
                    addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
                }
            } else if (json.type === 'message') { // it's a single message
                var messageDiv = document.getElementById("message");
                messageDiv.style.display = "block";
                document.getElementById("messageInput").focus();
                addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time));
            } else {
                console.log('Hmm..., I\'ve never seen JSON like this: ', json);
            }

        });
    }

    function htmlDecode(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
    };

    function formatDate(dt) {
        return (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes());
    }

    function addMessage(author, message, color, dt) {
        dataList.push({
            author: htmlDecode(author),
            color: color,
            date: formatDate(dt),
            message: htmlDecode(message)
        });
    }

    var dataList = new WinJS.Binding.List();

    // Create a namespace to make the data publicly
    // accessible.
    var publicMembers =
        {
            itemList: dataList
        };
    WinJS.Namespace.define("WSChat", publicMembers);

    var listView = element.querySelector("#contentList").winControl;
    WinJS.UI.setOptions(listView, {
        itemDataSource: WSChat.itemList.dataSource,
        itemTemplate: element.querySelector("#messageTextTemplate"),
        layout: WinJS.UI.ListLayout
    });
    initialize();
}

function onUserClick(event) {
    var user = document.getElementById("userInput").value;
    var label = document.getElementById("userLabel");
    socket.emit('user', user);
    myName = user;
    label.innerText = myName;
    document.getElementById("user").style.display = "none";
}

function onSendClick(event) {
    var message = document.getElementById("messageInput").value;
    socket.emit('message', message);
}