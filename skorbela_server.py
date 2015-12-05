#! /usr/bin/env python3

from jsondb.db import Database
import simplejson as json
import string
import random

import asyncio
from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

# This holds clients and their unique ID's.
client_list = {} 
# Our database.
db = Database("db.json")
# Hash for authentication. By default the password is SHA256 of "31Seks31", but change this 
# as soon as you've finished testing.
pass_hash = 'e1ed02693ddaad40e1f2a249a0915b0bc694c4d20760ca1d95c045ede86ff8ba'

#
# Category handling functions. These handle the connection with jsondatabase.
# 

def get_categories():
	try:
		return db["categories"]
	except KeyError:
		return []

def send_categories(uid):
	try:
		data = {"action" : "SEND_CATEGORIES", "categories" : get_categories()}
		client_list[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
		return 0
	except KeyError:
		return 1

def add_category(category):
	try:
		categories = db["categories"]
		if not category in categories: # If not present, add it to the database.
			db["categories"] = db["categories"] + [category]
			return 0
		else:
			return 1
	except KeyError:
		db["categories"] = [category]

def reset_categories():
	db["categories"] = []

class MyServerProtocol(WebSocketServerProtocol):

	def onConnect(self, request):
		print("Client connecting: {0}".format(request.peer))
	
	def onOpen(self):
		print("WebSocket connection open.")
		# Assign the connection an unique ID.
		self.uid = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
		# Save the connection into the client_list.
		client_list[self.uid] = self
		# Inform the client about its UID.
		print("Assigned %s to the connection as the unique ID." % self.uid)
		data = {"action" : "SEND_UID", "uid" : self.uid}
		self.sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
			
	def	onMessage(self, payload, isBinary):
		try:
			data = json.loads(payload)
			action = data["action"]
			uid = data["uid"]

			if(action == "GET_CATEGORIES"):	# If someone wants categories, give them categories.
				send_categories(uid)
			if(action == "ADD_CATEGORY"): # If someone adds a category, send everyone the new categories.
				if data["hash"] == pass_hash:
					add_category(data["category"])
					for unique_id in client_list:
						send_categories(unique_id)
				else:
					print ("Invalid hash from UID = %s" % uid)
			if(action == "RESET_CATEGORIES"): # Also if someone resets all categories, send the empty list.
				if data["hash"] == pass_hash:
					reset_categories()
					for unique_id in client_list:
						send_categories(unique_id)				
				else:
					print ("Invalid hash from UID = %s" % uid)

		except json.scanner.JSONDecodeError: # If simplejson cries about non-JSON data,
			print("Non-JSON data received.")
		except KeyError:
			print("Bogus JSON object.")
		
		if isBinary:
			print("Binary message received: {0} bytes".format(len(payload)))
		else:
			print("Text message received: {0}".format(payload.decode('utf8')))

		# echo back message verbatim
		self.sendMessage(payload, isBinary)

	def onClose(self, wasClean, code, reason):
		# Remove the connection from websockets list.
		del client_list[self.uid]
		print(("WebSocket connection with ID %s closed: {0}" % self.uid).format(reason))
	
	
if __name__ == '__main__':

	factory = WebSocketServerFactory(u"ws://127.0.0.1:31313", debug=False)
	factory.protocol = MyServerProtocol

	loop = asyncio.get_event_loop()
	coro = loop.create_server(factory, '0.0.0.0', 31313)
	server = loop.run_until_complete(coro)
	
	try:
		loop.run_forever()
	except KeyboardInterrupt:
		pass
	finally:
		server.close()
		loop.close()
