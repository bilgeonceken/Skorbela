/*jslint
    "browser":true,
*/
/*global window, WebSocket */

var ws, uid; // export die variables
var cb_array = [];

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

function get_categories() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_CATEGORIES"};
    window.ws.send(JSON.stringify(data));
}

function get_competitors() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_COMPETITORS"};
    window.ws.send(JSON.stringify(data));
}

function add_competitor() {
    "use strict";
    var name = document.getElementById("name").value,
        club = document.getElementById("club").value,
        id = document.getElementById("id").value,
        dropdown = document.getElementById("categories"),
        category,
        pass = document.getElementById("password").value,
        data;
    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    if (dropdown.options[dropdown.selectedIndex] === undefined) {
        error("No category selected.");
        return;
    }
    category = dropdown.options[dropdown.selectedIndex].text;
    data = {"uid": uid, "action": "ADD_COMPETITOR", "name": name, "club": club, "id": id, "category": category, "password": pass};
    window.ws.send(JSON.stringify(data));
}

function delete_competitor() {
    "use strict";
    var comp_to_delete = [],
        pass = document.getElementById("password").value,
        i = 0,
        data;

    if (pass === "") {
        error("Password field cannot be blank.");
        return;
    }
    // Loop over checkbox array to see which are checked.
    for (i = 0; i < cb_array.length; i += 1) {
        if (cb_array[i].checked) {
            comp_to_delete.push(cb_array[i].id);
        }
    }

    data = {"uid": uid, "action": "DELETE_COMPETITOR", "competitors": comp_to_delete, "password": pass};
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

    /* What to do on server message. */
    window.ws.onmessage = function (evt) {
        // try to parse server's message
        var data = JSON.parse(evt.data),
            action = data.action,
            categories,
            category_dropdown,
            option,
            content,
            competitors,
            competitor,
            table,
            tbody,
            row,
            checkbox,
            cb_cell,
            id_cell,
            name_cell,
            club_cell,
            category_cell,
            score_cell,
            i = 0;

        /* If server is sending our unique ID, we established the connection. */
        if (action === "SEND_UID") {
            // Make the text green.
            window.uid = data.uid;
            document.getElementById("conn_status").innerHTML = "Connected - UID: " + window.uid;
            document.getElementById("conn_status").className = "green";
            // Get categories since we made the connection.
            get_categories();
            get_competitors();

        } else if (action === "SEND_CATEGORIES") {
            categories = data.categories;
            category_dropdown = document.getElementById("categories");
            // Empty the dropdown first.
            category_dropdown.innerHTML = "";
            for (i = 0; i < categories.length; i += 1) {
                option = document.createElement("option");
                content = document.createTextNode(categories[i]);
                option.appendChild(content);
                category_dropdown.appendChild(option);
            }
        } else if (action === "SEND_COMPETITORS") {
            competitors = data.competitors;
            // Get our table and restore its initial state.
            table = document.getElementById("competitors");
            table.innerHTML = "<thead> <tr> <th> SELECT </th> <th> ID </th> <th> NAME </th> <th> CLUB </th> <th> CATEGORY </th> <th> SCORE </th>    </tr> </thead>";
            // Append competitor data onto table's body.
            tbody = document.createElement("tbody");
            /* Iterate through every competitor and make a row for them. */
            for (i = 0; i < competitors.length; i += 1) {
                competitor = competitors[i];
                // create cells
                row = document.createElement("tr");
                // make our checkbox
                checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = competitor.cid;
                // We need to store the checkbox as well. We will loop over it later.
                cb_array.push(checkbox);
                // Make the checkbox cell.
                cb_cell = document.createElement("td");
                cb_cell.appendChild(checkbox);
                id_cell = document.createElement("td");
                id_cell.appendChild(document.createTextNode(competitor.cid));
                name_cell = document.createElement("td");
                name_cell.appendChild(document.createTextNode(competitor.name));
                club_cell = document.createElement("td");
                club_cell.appendChild(document.createTextNode(competitor.club));
                category_cell = document.createElement("td");
                category_cell.appendChild(document.createTextNode(competitor.category));
                score_cell = document.createElement("td");
                score_cell.appendChild(document.createTextNode(competitor.score));
                // Make row with cells.
                row.appendChild(cb_cell);
                row.appendChild(id_cell);
                row.appendChild(name_cell);
                row.appendChild(club_cell);
                row.appendChild(category_cell);
                row.appendChild(score_cell);
                // Add row to tbody.
                tbody.appendChild(row);
            }
            table.appendChild(tbody);
        }
    };

    /* Inform the user when the connection is closed. */
    window.ws.onclose = function () {
        document.getElementById("conn_status").innerHTML = "not connected";
        document.getElementById("conn_status").className = "red";
    };
}
