var ws, uid; // export die variables
var cb_array = [];

function connect(address)
{
	ws = new WebSocket(address);
	uid = "0";

	ws.onopen = function()
	{
		// If a connection is opened, make our red text yellow, we are waiting for the server to
		// send us our unique ID.
		document.getElementById("conn_status").innerHTML = "Connected - waiting for UID.";
		document.getElementById("conn_status").className = "yellow";
	}
	ws.onmessage = function(evt) // What to do on server message
	{
		// try to parse server's message
		data = JSON.parse(evt.data);
	
		action = data.action;
	
		if(action == "SEND_UID"){ // If server is sending our unique ID, we established the connection.
			// Make the text green.
			uid = data.uid;
			document.getElementById("conn_status").innerHTML = "Connected - UID: " + uid;
			document.getElementById("conn_status").className = "green";
			// Get data since we made the connection.
			get_competitors();
			get_controls();
		} else if (action == "SEND_COMPETITORS") {
			competitors = data.competitors;
			// Get our table and restore its initial state.
			table = document.getElementById("competitors");
			table.innerHTML = "<thead> <tr> <th> SELECT </th> <th> ID </th> <th> NAME </th> <th> CLUB </th> <th> CATEGORY </th> <th> SCORE </th>	</tr> </thead>";
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
		} else if (action == "SEND_CONTROLS") {
			var controls = data.controls;
			var table = document.getElementById("controls");
			table.innerHTML = "";
			// the table will consist of two rows, prepare their headers
			row1 = document.createElement("tr");
			row1_header = document.createElement("td");
			row1_text = document.createTextNode("CONTROL NUMBER");
			row1_header.appendChild(row1_text);
			row1.appendChild(row1_header);
			//
			row2 = document.createElement("tr");
			row2_header = document.createElement("td");
			row2_text = document.createTextNode("PTS");
			row2_header.appendChild(row2_text);
			row2.appendChild(row2_header);			
			for(i = 0; i < controls.length; i++){
				controlnumber = document.createTextNode(controls[i].number);
				controlpoints = document.createTextNode(controls[i].points);
				cell_number = document.createElement("td");
				cell_pts = document.createElement("td");
				cell_number.appendChild(controlnumber);
				cell_pts.appendChild(controlpoints);
				row1.appendChild(cell_number);
				row2.appendChild(cell_pts);		
			}
			tbody = document.createElement("tbody");
			tbody.appendChild(row1);
			tbody.appendChild(row2);
			table.appendChild(tbody);
		}			
	}
}
function get_controls()
{
	data = { "uid" : uid, "action" : "GET_CONTROLS" }
	ws.send(JSON.stringify(data));
}

function get_competitors()
{
	data = { "uid" : uid, "action" : "GET_COMPETITORS" };
	ws.send(JSON.stringify(data));
}


