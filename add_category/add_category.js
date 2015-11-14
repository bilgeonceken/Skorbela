function add_category()
{
	var ws = new WebSocket("ws://localhost:31313/");
	ws.onopen = function()
	{
		data = { "action" : "ADD_CATEGORY" ,
				 "category" : document.getElementById("category").value };
		ws.send(JSON.stringify(data));
		ws.close()
	}
}

function reset_categories()
{
	var ws = new WebSocket("ws://localhost:31313/");
	ws.onopen = function()
	{
		data = { "action" : "RESET_CATEGORY" };
		ws.send(JSON.stringify(data));
		ws.close()
	}
	
}
