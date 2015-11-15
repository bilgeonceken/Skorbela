#main program and imports for standalone purpose	   
import sys
import threading
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import ssl
from bs4 import BeautifulSoup
from base64 import b64encode
import simplejson as json
import subprocess

# I don't want a .pyc file there.
sys.dont_write_bytecode = True
from HTTPWebSocketsHandler import HTTPWebSocketsHandler

port = 31313
credentials = ""
pass_hash = 'e1ed02693ddaad40e1f2a249a0915b0bc694c4d20760ca1d95c045ede86ff8ba'

# Where is our page updater? We'll need it.
# Since file-read while socket is open is blocking,
# we need to call child processes to do file-updates.
page_updater = "./page_updater.py"

# category handling functions
# those update add_competitor/index.html 

def add_category(category):
	print "Calling my child to do the job."	
	args = [page_updater, "add", category]
	p = subprocess.Popen(args)

def reset_categories():
	print "Calling my child to do the job."
	args = [page_updater, "reset"]
	p = subprocess.Popen(args)

def delete_category(category):
	print "Calling my child to do the job."
	args = [page_updater, "delete", category]
	p = subprocess.Popen(args)

# password handling functions

def change_password(old_hash, new_hash):
	if(pass_hash == old_hash):
		pass_hash = new_hash
	else:	
		raise ValueError("Invalid password")

#
# main connection handler
# 
class ConnectHandler(HTTPWebSocketsHandler):
	def on_ws_message(self, message):
		if message is None:
			message = ''

		try:
			json_object = json.loads(message)
			print "JSON object received:", json_object
			print "action:", json_object["action"]
			print "hash:", json_object["hash"]
			incoming_hash = json_object["hash"]
			action = json_object["action"]

			if(incoming_hash == pass_hash):
				if(action == "ADD_CATEGORY"):
					add_category(json_object["category"])
				elif (action == "RESET_CATEGORY"):
					reset_categories()
				elif (action == "ADD_COMPETITOR"):
					pass
				elif (action == "ADD_CONTROL"):
					pass
				elif (action == "CALCULATE_SCORE"):
					pass
				elif (action == "CHANGE_PASSWORD"):
					try:
						change_password(json_object["old_hash"], json_object["new_hash"])				
					except ValueError:
						self.log_message("Password change attempt with invalid password: %s", json.dumps(json_object))
				else:
					self.log_message("Unknown action: %s", action)
			else:
				self.log_message("Invalid hash: %s", incoming_hash)

		except ValueError:
			self.log_message("Unknown data incoming: %s", message)

	def on_ws_connected(self):
		self.log_message('%s','websocket connected')

	def on_ws_closed(self):
		self.log_message('%s','websocket closed')

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
	"""Handle requests in a separate thread."""
   
def _ws_main():
	try:
		server = ThreadedHTTPServer(('', port), ConnectHandler)
		server.daemon_threads = True
		server.auth = b64encode(credentials)
		print('started http server at port %d' % (port,))
		server.serve_forever()
	except KeyboardInterrupt:
		print('^C received, shutting down server')
		server.socket.close()

if __name__ == '__main__':
	_ws_main()
