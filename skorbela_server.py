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

# Where is our page updater? We'll need it.
# Since file-read while socket is open is blocking,
# we need to call child processes to do file-updates.
page_updater = "./page_updater.py"

# category handling functions
# those update add_competitor/index.html 
	
# take soup. find <select> tags. insert an <option>CATEGORY</option> tag between them.
def add_category(category):
	print "Calling my child to do the job."	
	args = [page_updater, "add", category]
	p = subprocess.Popen(args)

# clear between <select> tags.
def reset_categories():
	print "Calling my child to do the job."
	args = [page_updater, "reset"]
	p = subprocess.Popen(args)

# find the category option. destroy it.
def delete_category(category):
	print "Calling my child to do the job."
	args = [page_updater, "delete", category]
	p = subprocess.Popen(args)

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
			action = json_object["action"]
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
			else:
				self.log_message("Unknown action: %s", action)
		except ValueError:
			print self.log_message("Unknown data incoming: %s", message)

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
