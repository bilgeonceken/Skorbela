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
			// Get categories since we made the connection.
			get_categories();
			get_competitors();
		}
		else if(action == "SEND_CATEGORIES"){
			categories = data.categories;
			// Get our dropdown and append children to it.
			category_dropdown = document.getElementById("categories");
			// Empty the dropdown first.
			category_dropdown.innerHTML = "";
			for(i = 0; i < categories.length; i++){
				option = document.createElement("option");
				content = document.createTextNode(categories[i]);
				option.appendChild(content);
				category_dropdown.appendChild(option);
			}	
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
		}			
	}
}

function get_categories()
{
	data = { "uid" : uid, "action" : "GET_CATEGORIES" };
	ws.send(JSON.stringify(data));
}

function get_competitors()
{
	data = { "uid" : uid, "action" : "GET_COMPETITORS" };
	ws.send(JSON.stringify(data));
}

function add_competitor()
{
	var name = document.getElementById("name").value;
	var club = document.getElementById("club").value;
	var id = document.getElementById("id").value;
	var dropdown = document.getElementById("categories");
	var category = dropdown.options[dropdown.selectedIndex].text;
	var pass = document.getElementById("password").value;

	data = { "uid" : uid, "action" : "ADD_COMPETITOR", "name" : name, "club" : club, "id" : id, "category" : category, "password" : pass };
	ws.send(JSON.stringify(data));
}

function delete_competitor()
{
	var comp_to_delete = [];

	var pass = document.getElementById("password").value;
	// Loop over checkbox array to see which are checked.
	for(i = 0; i < cb_array.length; i++){
		if(cb_array[i].checked){
			comp_to_delete.push(cb_array[i].id);
		}
	}

	data = { "uid" : uid, "action" : "DELETE_COMPETITOR", "competitors" : comp_to_delete, "password" : pass };

	ws.send(JSON.stringify(data));
}
