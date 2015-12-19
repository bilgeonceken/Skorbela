var ws, uid, errorTimeoutID; // export die variables
var checkbox_array = [];
var competitor_id_array = [];

function connect(address)
{
    ws = new WebSocket(address);
    uid = "0";

    ws.onopen = function()
    {
		// If a connection is opened, make our red text yellow, we are waiting for the server to
		// send us our unique ID.
		document.getElementById("conn_status").innerHTML = "Connected - waiting for UID...";
		document.getElementById("conn_status").className = "yellow";
    }
    ws.onmessage = function(evt) // What to do on server message
    {
        // try to parse server's message
        data = JSON.parse(evt.data);    
        action = data.action;

		if(action == "SEND_UID") { // If server is sending our unique ID, we established the connection.
			// Make the text green.
			uid = data.uid;
			document.getElementById("conn_status").innerHTML = "Connected";
			document.getElementById("conn_status").className = "green";
            // It will vanish later.
            setTimeout(function () {
                document.getElementById("conn_status").innerHTML = "";
            }, 1000);
			// Get competitors since we made the connection.
			get_competitors();
		} else if (action == "SEND_COMPETITORS") {
            competitors = data.competitors;
            // Get our table and restore its initial state.
            table = document.getElementById("competitors");
            table.innerHTML = "<thead> <tr> <th> SELECT </th> <th> ID </th> <th> NAME </th> <th> CLUB </th> <th> CATEGORY </th> <th> SCORE </th>    </tr> </thead>";
            // Append competitor data onto table's body.
            tbody = document.createElement("tbody");
            for(i = 0; i < competitors.length; i++){
                competitor = competitors[i];
                // create cells
                row = document.createElement("tr")
                // make our checkbox
                checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = competitor.cid;
                // We need to store the checkbox as well. We will loop over it later.
                checkbox_array.push(checkbox);
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
    }
}

function get_competitors()
{
    data = { "uid" : uid, "action" : "GET_COMPETITORS" }
    ws.send(JSON.stringify(data));
}

function error(error_body)
{
    // Show error_body in error span for 3 seconds.
    clearTimeout(errorTimeoutID);

    error_span = document.getElementById("error");
    error_span.innerHTML = "Error: " + error_body;

    errorTimeoutID = setTimeout( function() { error_span.innerHTML = ""; }, 3000 );
}
