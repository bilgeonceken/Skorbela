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

function get_competitors() {
    "use strict";
    var data = {"uid": window.uid, "action": "GET_COMPETITORS"};
    window.ws.send(JSON.stringify(data));
}

/* Returns an object with structure { category1 : [competitors], category2: [... } */
function sort_competitors(competitors) {
    "use strict";
    var out_object = {};

    competitors.forEach(function (competitor) {
        if (out_object.hasOwnProperty(competitor.category)) {
            out_object[competitor.category].push(competitor);
        } else {
            out_object[competitor.category] = [competitor];
        }
    });

    return out_object;
}

/* Builds a row for a competitor and returns it. */
function build_row_for_competitor(competitor) {
    "use strict";

    var row = document.createElement("tr"),
        idCell = document.createElement("td"),
        nameCell = document.createElement("td"),
        clubCell = document.createElement("td"),
        categoryCell = document.createElement("td"),
        scoreCell = document.createElement("td");

    idCell.appendChild(document.createTextNode(competitor.cid));
    nameCell.appendChild(document.createTextNode(competitor.name));
    clubCell.appendChild(document.createTextNode(competitor.club));
    categoryCell.appendChild(document.createTextNode(competitor.category));
    scoreCell.appendChild(document.createTextNode(competitor.score));

    row.appendChild(idCell);
    row.appendChild(nameCell);
    row.appendChild(clubCell);
    row.appendChild(categoryCell);
    row.appendChild(scoreCell);

    return row;
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
            category,
            competitors,
            tableContainer,
            header,
            table,
            tbody;

        /* If server is sending our unique ID, we established the connection. */
        if (action === "SEND_UID") {
            // Make the text green.
            window.uid = data.uid;
            document.getElementById("conn_status").innerHTML = "Connected - UID: " + window.uid;
            document.getElementById("conn_status").className = "green";
            /* 2 seconds later, the connection status will vanish. */
            window.setTimeout(function () {
                document.getElementById("conn_status").innerHTML = "";
            }, 2000);
            // Get competitors since we made the connection.
            get_competitors();

        } else if (action === "SEND_COMPETITORS") {
            /* First group the competitors according to their categories. */
            competitors = sort_competitors(data.competitors);
            /* Do not forget to empty the table container first- we are rebuilding the table. */
            tableContainer = document.getElementById("table-container");
            tableContainer.innerHTML = "";
            /* Now, for each category we build another fellow table. */
            for (category in competitors) {
                if (competitors.hasOwnProperty(category)) {
                    /* We need a header for the table first. */
                    header = document.createElement("h4");
                    header.appendChild(document.createTextNode(category));
                    tableContainer.appendChild(header);
                    table = document.createElement("table");
                    table.border = 1;
                    table.id = category;
                    table.innerHTML = "<thead> <tr> <th> ID </th> <th> NAME </th> <th> CLUB </th> <th> CATEGORY </th> <th> SCORE </th> </tr> </thead>";
                    tbody = document.createElement("tbody");
                    /* Iterate through every competitor and make a row for them. */
                    competitors[category].forEach(function (competitor) {
                        tbody.appendChild(build_row_for_competitor(competitor));
                    });
                    /* Finally, append the table to the table container. */
                    table.appendChild(tbody);
                    tableContainer.appendChild(table);
                }
            }
        }
    };

    /* Inform the user when the connection is closed. */
    window.ws.onclose = function () {
        document.getElementById("conn_status").innerHTML = "not connected";
        document.getElementById("conn_status").className = "red";
    };
}

