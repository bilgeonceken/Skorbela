function add_competitor()
{
	var ws = new WebSocket("ws://localhost:31313/");
	ws.onopen = function()
	{
		data = { "action" : "ADD_COMPETITOR" ,
				 "name" : document.getElementById("name").value };
		ws.send(JSON.stringify(data));
		ws.close();	
	};	
}
