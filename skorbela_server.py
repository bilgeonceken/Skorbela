#! /usr/bin/env python3

from jsondb.db import Database
import simplejson as json
import string
import random
import hashlib
import txaio


import asyncio
from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

txaio.use_asyncio()
# This holds clients and their unique ID's.
client_list = {} 
# Our database.
db = Database("db.json")
# Hash for authentication. By default the password is SHA256 of "31Seks31", but change this 
# as soon as you've finished testing.
pass_hash = 'e1ed02693ddaad40e1f2a249a0915b0bc694c4d20760ca1d95c045ede86ff8ba'

def check_hash(password):
	global pass_hash
	if hashlib.sha256(password.encode('utf-8')).hexdigest() == pass_hash:
		return True
	else:
		return False	

#
# Category handling functions. These handle the connection with jsondatabase.
# 

def get_categories():
	if not db["categories"] is None:
		return db["categories"]
	else:
		return []

def send_categories(uid):
	data = {"action" : "SEND_CATEGORIES", "categories" : get_categories()}
	client_list[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
	return 0

def add_category(category):
	# If the categories key in database is present..
	if not db["categories"] is None: 		
		categories = db["categories"]
		if not category in categories: # If not present, add it to the database.
			db["categories"] = db["categories"] + [category]
			return 0
		else:
			return 1
	else:
		db["categories"] = [category]

def delete_category(category):
	if not db["categories"] is None:
		categories = db["categories"]
		# Filter our category out of the category list.
		db["categories"] = [cat for cat in categories if cat != category]
	else:
		db["categories"] = []

def reset_categories():
	db["categories"] = []

#
# Competitor handling functions.
#

def get_competitors():
	if not db["competitors"] is None:
		# Sort competitors by their CID's.
		return sorted(db["competitors"], key=lambda comp: comp["cid"])
	else:
		return []

def send_competitors(uid):
	data = { "action" : "SEND_COMPETITORS", "competitors" : get_competitors() }
	client_list[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
	return 0

# ID parameter is cid to not interfere with python's id keyword.
def add_competitor(name, club, cid, category):
	if not db["competitors"] is None:
		competitors = db["competitors"]
		# We check for competitor's ID in the database.
		if cid in [a["cid"] for a in competitors]:
			# find the competitor with given cid
			competitor = [a for a in competitors if a["cid"] == cid][0]
			competitor["name"] = name
			competitor["category"] = category
			competitor["club"] = club
			# Overwrite the database with the new competitor.
			index = competitors.index(competitor)
			db["competitors"] = competitors[:index] + [competitor] + competitors[index+1:]
		else:
			# If the given cid is not in the database, create new competitor.
			competitor = {"name" : name, "club" : club, "cid" : cid, "category" : category, "controls" : [], "score" : 0}
			db["competitors"] = competitors + [competitor]
		return 0
	else:
		competitor = {"name" : name, "cid" : cid, "club" : club, "category" : category, "controls" : [], "score" : 0}
		db["competitors"] = [competitor]
		return 0

# Delete_competitor takes a list of CIDs as parameter.
def delete_competitor(cids):
	if not db["competitors"] is None:
		competitors = db["competitors"]
		db["competitors"] = [comp for comp in competitors if not comp["cid"] in cids]
	else:
		db["competitors"] = []

#
# Control handling functions.
#

def get_controls():
	if not db["controls"] is None:
		# Sort controls by their numbers.
		return sorted(db["controls"], key=lambda cont: cont["number"])
	else:
		return []

def send_controls(uid):
	data = { "action" : "SEND_CONTROLS", "controls" : get_controls() }
	client_list[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
	return 0


def add_control(number, points):
	if not db["controls"] is None:
		controls = db["controls"]
		if number in [a["number"] for a in controls]:
			# Find the control with given number.
			control = [a for a in controls if a["number"] == number][0]
			control["points"] = points
			# Overwrite the database with new number.	
			index = controls.index(control)
			db["controls"] = controls[:index] + [control] + controls[index+1:]
		else:
			control = {"number" : number, "points" : points}
			db["controls"] = controls + [control]
		return 0
	else:
		control = {"number" : number, "points" : points}
		db["controls"] = [control]
		return 0

def delete_control(number):
	if not db["controls"] is None:
		controls = db["controls"]
		db["controls"] = [cont for cont in controls if cont["number"] != number]
	else:
		db["controls"] = []

def reset_controls(number):
	db["controls"] = []


#
#
#		

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
			elif(action == "GET_COMPETITORS"):
				send_competitors(uid)
			elif(action == "GET_CONTROLS"):
				send_controls(uid)
			elif ("ADD" in action) or ("DELETE" in action) or ("RESET" in action):
				if check_hash(data["password"]): # Validate password.
					if "CATEGORY" in action:
						if action == "ADD_CATEGORY":
							add_category(data["category"])
						elif action == "DELETE_CATEGORY":
							delete_category(data["category"])
						elif action == "RESET_CATEGORIES":
							reset_categories()
						# Send everyone the new category list.
						for unique_id in client_list:
							send_categories(unique_id)
					elif "COMPETITOR" in action:
						if action == "ADD_COMPETITOR":	
							add_competitor(name=data["name"], cid=data["id"], category=data["category"], club=data["club"])
						elif action == "DELETE_COMPETITOR":
							delete_competitor(cids=data["competitors"])
						for unique_id in client_list:
							send_competitors(unique_id)
					elif "CONTROL" in action:
						if action == "ADD_CONTROL":
							add_control(number=data["number"], points=data["points"])
						elif action == "DELETE_CONTROL":
							delete_control(data["number"])
						elif action == "RESET_CONTROLS":
							reset_controls()
						for unique_id in client_list:
							send_controls(unique_id)
				else:
					print ("Invalid password from UID = %s" % uid)

		except json.scanner.JSONDecodeError: # If simplejson cries about non-JSON data,
			print("Non-JSON data received.")
		except KeyError:
			print("Bogus JSON object.")
		
		if isBinary:
			print("Binary message received: {0} bytes".format(len(payload)))
		else:
			print("Text message received: {0}".format(payload.decode('utf8')))

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
