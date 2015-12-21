/*jslint
    "browser": true,
*/
/*global window, WebSocket */

//
// Category handling functions.
//

var ws, uid, errorTimeoutID;

function error(error_body) {
    "use strict";
    // Show error_body in error span for 3 seconds.
    clearTimeout(window.errorTimeoutID);

    var error_span = document.getElementById("error");
    error_span.innerHTML = "Error: " + error_body;

    window.errorTimeoutID = setTimeout(function () {
        error_span.innerHTML = "";
    }, 3000);
}

function get_categories() {
    "use strict";
    var data = {"uid" : window.uid, "action": "GET_CATEGORIES"};
    window.ws.send(JSON.stringify(data));
}

function add_category() {
    "use strict";
    var pass = document.getElementById("password").value,
        category = document.getElementById("category").value,
        data = {"password": pass, "uid": window.uid,  "action": "ADD_CATEGORY", "category": category};
    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    window.ws.send(JSON.stringify(data));
}

function delete_category() {
    "use strict";
    try {
        var dropdown = document.getElementById("category_delete"),
            category = dropdown.options[dropdown.selectedIndex].text,
            pass = document.getElementById("password").value,
            data = {"password": pass, "uid": window.uid, "action": "DELETE_CATEGORY", "category": category};
        if (pass === "") {
            error("Password field cannot be blank.");
            return;
        }
        window.ws.send(JSON.stringify(data));
    } catch (e) {
        /* TO-DO : Put a div in pages to display error messages. */
        error(e.name + ": " + e.message);
    }
}

function reset_categories() {
    "use strict";
    var pass = document.getElementById("password").value,
        data = {"password": pass, "uid": window.uid, "action": "RESET_CATEGORIES"};
    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    window.ws.send(JSON.stringify(data));
}

//
// Control handling functions.
//

function get_controls() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_CONTROLS"};
    window.ws.send(JSON.stringify(data));
}

function add_control() {
    "use strict";
    var pass = document.getElementById("password").value,
        control_number = document.getElementById("control_number").value,
        control_points = document.getElementById("control_points").value,
        data = {"password": pass, "uid": window.uid, "action": "ADD_CONTROL", "number": control_number, "points": control_points};
    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    window.ws.send(JSON.stringify(data));
}

function delete_control() {
    "use strict";
    try {
        var dropdown = document.getElementById("control_delete"),
            control = dropdown.options[dropdown.selectedIndex].value,
            pass = document.getElementById("password").value,
            data = {"password": pass, "uid": window.uid, "action": "DELETE_CONTROL", "number": control};
        if (pass === "") {
            error("Password field cannot be blank.");
            return;
        }
        window.ws.send(JSON.stringify(data));
    } catch (e) {
        error(e.name + ": " + e.message);
    }
}

function reset_controls() {
    "use strict";
    var pass = document.getElementById("password").value,
        data = { "password" : pass, "uid" : window.uid, "action" : "RESET_CONTROLS" };
    window.ws.send(JSON.stringify(data));
}

function connect(address) {
    "use strict";
    window.ws = new WebSocket(address);
    window.uid = "0";

    window.ws.onopen = function () {
        // If a connection is opened, make our red text yellow, we are waiting for the server to
        // send us our unique ID.
        document.getElementById("conn_status").innerHTML = "Connected - waiting for UID.";
        document.getElementById("conn_status").className = "yellow";
    };

    // What to do on server message
    window.ws.onmessage = function (evt) {
        // try to parse server's message
        var data = JSON.parse(evt.data),
            action = data.action,
            categories,
            div_value,
            controls,
            dropdown,
            option,
            content,
            i = 0;

        if (action === "SEND_UID") { // If server is sending our unique ID, we established the connection.
            // Make the text green.
            window.uid = data.uid;
            document.getElementById("conn_status").innerHTML = "Connected - UID: " + window.uid;
            document.getElementById("conn_status").className = "green";

            // Get categories since we made the connection.
            get_categories();
            get_controls();

        } else if (action === "SEND_CATEGORIES") {
            categories = data.categories;
            div_value = "<select id=\"category_delete\">";
            // If there are no categories, disable the delete-category button.
            if (categories.length === 0) {
                document.getElementById("delete_category").disabled = true;
            } else {
                document.getElementById("delete_category").disabled = false;
            }
            // prepare our div's inner html
            for (i = 0; i < categories.length; i += 1) {
                div_value = div_value + "<option>" + categories[i] + "</option>";
            }
            div_value += "</select>";
            document.getElementById("categories").innerHTML = div_value;

        } else if (action === "SEND_CONTROLS") {
            controls = data.controls;
            if (controls.length === 0) {
                document.getElementById("delete_control").disabled = true;
            } else {
                document.getElementById("delete_control").disabled = false;
            }
            document.getElementById("controls").innerHTML = "";
            dropdown = document.createElement("select");
            dropdown.id = "control_delete";
            for (i = 0; i < controls.length; i += 1) {
                option = document.createElement("option");
                option.value = controls[i].number;
                content = document.createTextNode("Control " +
                                                  controls[i].number +
                                                  ", " +
                                                  controls[i].points +
                                                  " pts");
                option.appendChild(content);
                dropdown.appendChild(option);
            }
            document.getElementById("controls").appendChild(dropdown);
        }
    };

    /* Inform the user when the connection is closed. */
    window.ws.onclose = function () {
        document.getElementById("conn_status").innerHTML = "not connected";
        document.getElementById("conn_status").className = "red";
    };
}
