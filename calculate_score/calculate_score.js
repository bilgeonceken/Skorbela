/*jslint
    "browser": true,
*/
/*global window, WebSocket */

var ws, uid, errorTimeoutID; // export die variables
var checkbox_array = [];
var competitor_id_array = [];

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

function get_controls() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_CONTROLS"};
    window.ws.send(JSON.stringify(data));
}

function get_competitors() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_COMPETITORS"};
    window.ws.send(JSON.stringify(data));
}

function link_controls() {
    "use strict";
    var competitor_id = document.getElementById("competitor_id").value,
        pass = document.getElementById("password").value,
        controls_to_link,
        data,
        i = 0;
    // First check if the competitor id exists.
    if (competitor_id_array.indexOf(competitor_id) < 0) {
        error("Nonexistent competitor ID.");
        return;
    }
    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    // Prepare the array of controls to link with the competitor.
    controls_to_link = [];
    for (i = 0; i < checkbox_array.length; i += 1) {
        if (checkbox_array[i].checked) {
            controls_to_link.push(checkbox_array[i].id);
        }
    }

    data = {"uid": uid, "action": "LINK_CONTROLS", "cid": competitor_id, "controls": controls_to_link, "password": pass};

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

    window.ws.onmessage = function (evt) {
        // try to parse server's message
        var data = JSON.parse(evt.data),
            action = data.action,
            competitors,
            controls,
            table,
            row1,
            row1_header,
            row1_span,
            row1_text,
            row2,
            row2_header,
            row2_span,
            row2_text,
            row3,
            row3_header,
            row3_span,
            row3_text,
            controlnumber,
            controlpoints,
            cell_number,
            cell_pts,
            controlchb,
            cell_chb,
            tbody,
            i = 0;

        if (action === "SEND_UID") { // If server is sending our unique ID, we established the connection.
            // Make the text green.
            window.uid = data.uid;
            document.getElementById("conn_status").innerHTML = "Connected - UID: " + window.uid;
            document.getElementById("conn_status").className = "green";
            // Get data since we made the connection.
            get_controls();
            get_competitors();
        } else if (action === "SEND_COMPETITORS") {
            // We only need the competitors' IDs. Store them in a global array.
            competitors = data.competitors;

            competitor_id_array = [];
            for (i = 0; i < competitors.length; i += 1) {
                competitor_id_array.push(competitors[i].cid);
            }
        } else if (action === "SEND_CONTROLS") {
            // If we get control data, we build our control table.
            controls = data.controls;
            table = document.getElementById("controls");
            table.innerHTML = "";
            // the table will consist of three rows, prepare their headers
            row1 = document.createElement("tr");
            row1_header = document.createElement("td");
            row1_span = document.createElement("span");
            row1_span.className = "table_header";
            row1_text = document.createTextNode("CONTROL NUMBER");
            row1_span.appendChild(row1_text);
            row1_header.appendChild(row1_span);
            row1.appendChild(row1_header);
            //row2 contains points
            row2 = document.createElement("tr");
            row2_header = document.createElement("td");
            row2_span = document.createElement("span");
            row2_span.className = "table_header";
            row2_text = document.createTextNode("PTS");
            row2_span.appendChild(row2_text);
            row2_header.appendChild(row2_span);
            row2.appendChild(row2_header);
            //row3 contains checkboxes
            row3 = document.createElement("tr");
            row3_header = document.createElement("td");
            row3_span = document.createElement("span");
            row3_span.className = "table_header";
            row3_text = document.createTextNode("SELECT");
            row3_span.appendChild(row3_text);
            row3_header.appendChild(row3_span);
            row3.appendChild(row3_header);
            for (i = 0; i < controls.length; i += 1) {
                // Prepare control number and points.
                controlnumber = document.createTextNode(controls[i].number);
                controlpoints = document.createTextNode(controls[i].points);
                cell_number = document.createElement("td");
                cell_pts = document.createElement("td");
                cell_number.appendChild(controlnumber);
                cell_pts.appendChild(controlpoints);
                // Prepare the checkbox.
                controlchb = document.createElement("input");
                controlchb.type = "checkbox";
                controlchb.id = controls[i].number;
                cell_chb = document.createElement("td");
                cell_chb.appendChild(controlchb);
                checkbox_array.push(controlchb);
                // Append to rows.
                row1.appendChild(cell_number);
                row2.appendChild(cell_pts);
                row3.appendChild(cell_chb);
            }
            tbody = document.createElement("tbody");
            tbody.appendChild(row1);
            tbody.appendChild(row2);
            tbody.appendChild(row3);
            table.appendChild(tbody);
        }
    };

    window.ws.onclose = function () {
        document.getElementById("conn_status").innerHTML = "not connected";
        document.getElementById("conn_status").className = "red";
    };
}
