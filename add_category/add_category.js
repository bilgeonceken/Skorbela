function add_category()
{
	var hash = CryptoJS.SHA256(document.getElementById("password").value);
	var ws = new WebSocket("ws://localhost:31313/");
	ws.onopen = function()
	{
		data = { "hash" : hash.toString(CryptoJS.enc.Hex) ,
				 "action" : "ADD_CATEGORY" ,
				 "category" : document.getElementById("category").value };
		ws.send(JSON.stringify(data));
		ws.close()
	}
}

function reset_categories()
{
	var hash = CryptoJS.SHA256(document.getElementById("password").value);
	var ws = new WebSocket("ws://localhost:31313/");
	ws.onopen = function()
	{
		data = { "hash" : hash.toString(CryptoJS.enc.Hex) , 
				 "action" : "RESET_CATEGORY" };
		ws.send(JSON.stringify(data));
		ws.close()
	}
	
}
