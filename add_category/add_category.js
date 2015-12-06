var ws, uid; // export die variables

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
			get_controls();
		}
		else if(action == "SEND_CATEGORIES"){
			categories = data.categories;
			// If there are no categories, disable the delete-category button.
			if (categories.length == 0){
				document.getElementById("delete_category").disabled = true;
			} else {
				document.getElementById("delete_category").disabled = false;
			}
			// prepare our div's inner html
			div_value = "<select id=\"category_delete\">";
			for(i = 0; i < categories.length; i++){
				div_value = div_value + "<option>" + categories[i] + "</option>";
			}
			div_value += "</select>";
			document.getElementById("categories").innerHTML = div_value;	
		}
		else if(action == "SEND_CONTROLS"){
			controls = data.controls;
			if(controls.length == 0){
				document.getElementById("delete_control").disabled = true;
			} else {
				document.getElementById("delete_control").disabled = false;
			}
			document.getElementById("controls").innerHTML = "";
			dropdown = document.createElement("select");
			dropdown.id = "control_delete";
			for(i = 0; i < controls.length; i++){
				option = document.createElement("option");
				option.value = controls[i].number;
				text = "Control " + controls[i].number + ", " + controls[i].points + " pts";
				content = document.createTextNode(text);
				option.appendChild(content);
				dropdown.appendChild(option);
			}
			document.getElementById("controls").appendChild(dropdown);
		}
	}
}

//
// Category handling functions.
//

function get_categories()
{
	data = { "uid" : uid, "action" : "GET_CATEGORIES" };
	ws.send(JSON.stringify(data));
}

function add_category()
{
	var pass = document.getElementById("password").value;
	var category = document.getElementById("category").value;
	data = { "password" : pass , "uid" : uid,  "action" : "ADD_CATEGORY", "category" : category };
	ws.send(JSON.stringify(data));	
}

function delete_category()
{
	try {
		var dropdown = document.getElementById("category_delete");
		var category = dropdown.options[dropdown.selectedIndex].text;
		var pass = document.getElementById("password").value;
		
		data = { "password" : pass, "uid" : uid, "action" : "DELETE_CATEGORY", "category" : category };
		ws.send(JSON.stringify(data));
	} catch (e) {
		/* TO-DO : Put a div in pages to display error messages. */
		alert("error " + e.name + ": " + e.message);
	}
}

function reset_categories()
{
	var pass = document.getElementById("password").value;
	data = { "password" : pass , "uid" : uid, "action" : "RESET_CATEGORIES" };
	ws.send(JSON.stringify(data));
}

//
// Control handling functions.
//

function get_controls()
{
	data = { "uid" : uid, "action" : "GET_CONTROLS" }
	ws.send(JSON.stringify(data));
}

function add_control()
{
	var pass = document.getElementById("password").value;
	var control_number = document.getElementById("control_number").value;
	var control_points = document.getElementById("control_points").value;
	data = { "password" : pass, "uid" : uid, "action" : "ADD_CONTROL", "number" : control_number, "points" : control_points };
	ws.send(JSON.stringify(data));
}

function delete_control()
{
	try {
		var dropdown = document.getElementById("control_delete");
		var control = dropdown.options[dropdown.selectedIndex].value;
		var pass = document.getElementById("password").value;

		data = { "password" : pass, "uid" : uid, "action" : "DELETE_CONTROL", "number" : control };
		ws.send(JSON.stringify(data));
	} catch(e) {
		alert("error " + e.name + ": " + e.message);
	}
}

function reset_controls()
{
	var pass = document.getElementById("password").value;
	data = { "password" : pass, "uid" : uid, "action" : "RESET_CONTROLS" };
	ws.send(JSON.stringify(data));
}
