var ws = new WebSocket("ws://localhost:31313/");
var uid = "0";

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
	}
	else if(action == "SEND_CATEGORIES"){
		categories = data.categories;
		// prepare our div's inner html
		div_value = "<select id=\"category_delete\">";
		for(i = 0; i < categories.length; i++){
			div_value = div_value + "<option>" + categories[i] + "</option>";
		}
		div_value += "</select>";
		document.getElementById("categories").innerHTML = categories;	
	}
}

function get_categories()
{
	data = { "uid" : uid, "action" : "GET_CATEGORIES" };
	ws.send(JSON.stringify(data));
}

function add_category()
{
	var hash = CryptoJS.SHA256(document.getElementById("password").value);
	var category = document.getElementById("category").value;
	data = { "hash" : hash.toString(CryptoJS.enc.Hex) , "uid" : uid,  "action" : "ADD_CATEGORY", "category" : category };
	ws.send(JSON.stringify(data));	
}

function reset_categories()
{
	var hash = CryptoJS.SHA256(document.getElementById("password").value);
	data = { "hash" : hash.toString(CryptoJS.enc.Hex) , "uid" : uid, "action" : "RESET_CATEGORIES" };
	ws.send(JSON.stringify(data));
}
