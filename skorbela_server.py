#! /usr/bin/env python3
"""
Skorbela-server: The server part of Skorbela, a score-o score tracking system.
This server listens on a websocket connection and alters its database based on
the actions given by clients.
"""
import string
import socket
import random
import hashlib
import asyncio

import txaio

import simplejson as json

from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
from jsondb.db import Database

# Tell txaio to use asyncio, not Twisted.
txaio.use_asyncio()

# This holds clients and their unique ID's.
CLIENT_LIST = {}
# Our database.
DB_HANDLE = Database("db.json")
# Hash for authentication. By default the password is SHA256 of "31Seks31", but change this
# as soon as you've finished testing.
PASS_HASH = "e1ed02693ddaad40e1f2a249a0915b0bc694c4d20760ca1d95c045ede86ff8ba"

def check_hash(password):
    "Checks if the hash given by client is valid."
    return hashlib.sha256(password.encode('utf-8')).hexdigest() == PASS_HASH

#
# Category handling functions. These handle the connection with jsondatabase.
#

def get_categories():
    if DB_HANDLE["categories"] is not None:
        return DB_HANDLE["categories"]
    else:
        return []

def send_categories(uid):
    data = {"action" : "SEND_CATEGORIES", "categories" : get_categories()}
    CLIENT_LIST[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
    return 0

def add_category(category):
    # If the categories key in database is present..
    if DB_HANDLE["categories"] is not None:
        categories = DB_HANDLE["categories"]
        if category not in categories: # If not present, add it to the database.
            DB_HANDLE["categories"] = DB_HANDLE["categories"] + [category]
            return 0
        else:
            return 1
    else:
        DB_HANDLE["categories"] = [category]

def delete_category(category):
    if DB_HANDLE["categories"] is not None:
        categories = DB_HANDLE["categories"]
        # Filter our category out of the category list.
        DB_HANDLE["categories"] = [cat for cat in categories if cat != category]
    else:
        DB_HANDLE["categories"] = []

def reset_categories():
    DB_HANDLE["categories"] = []

#
# Competitor handling functions.
#

def get_competitors():
    if DB_HANDLE["competitors"] is not None:
        # Sort competitors by their CID's.
        return sorted(DB_HANDLE["competitors"], key=lambda comp: comp["cid"])
    else:
        return []

def send_competitors(uid):
    data = {"action" : "SEND_COMPETITORS", "competitors" : get_competitors()}
    CLIENT_LIST[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
    return 0

# ID parameter is cid to not interfere with python's id keyword.
def add_competitor(name, club, cid, category):
    if DB_HANDLE["competitors"] is not None:
        competitors = DB_HANDLE["competitors"]
        # We check for competitor's ID in the database.
        if cid in [a["cid"] for a in competitors]:
            # find the competitor with given cid
            competitor = [a for a in competitors if a["cid"] == cid][0]
            competitor["name"] = name
            competitor["category"] = category
            competitor["club"] = club
            # Overwrite the database with the new competitor.
            index = competitors.index(competitor)
            DB_HANDLE["competitors"] = competitors[:index] + [competitor] + competitors[index+1:]
        else:
            # If the given cid is not in the database, create new competitor.
            competitor = {"name" : name, "club" : club, "cid" : cid,
                          "category" : category, "controls" : [], "score" : 0}
            DB_HANDLE["competitors"] = competitors + [competitor]
        return 0
    else:
        competitor = {"name" : name, "club" : club, "cid" : cid,
                      "category" : category, "controls" : [], "score" : 0}
        DB_HANDLE["competitors"] = [competitor]
        return 0

# Delete_competitor takes a list of CIDs as parameter.
def delete_competitor(cids):
    if DB_HANDLE["competitors"] is not None:
        competitors = DB_HANDLE["competitors"]
        DB_HANDLE["competitors"] = [comp for comp in competitors if comp["cid"] not in cids]
    else:
        DB_HANDLE["competitors"] = []

#
# Control handling functions.
#

def get_controls():
    if DB_HANDLE["controls"] is not None:
        # Sort controls by their numbers.
        return sorted(DB_HANDLE["controls"], key=lambda cont: cont["number"])
    else:
        return []

def send_controls(uid):
    data = {"action" : "SEND_CONTROLS", "controls" : get_controls()}
    CLIENT_LIST[uid].sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)
    return 0


def add_control(number, points):
    if DB_HANDLE["controls"] is not None:
        controls = DB_HANDLE["controls"]
        if number in [a["number"] for a in controls]:
            # Find the control with given number.
            control = [a for a in controls if a["number"] == number][0]
            control["points"] = points
            # Overwrite the database with new number.
            index = controls.index(control)
            DB_HANDLE["controls"] = controls[:index] + [control] + controls[index+1:]
        else:
            control = {"number" : number, "points" : points}
            DB_HANDLE["controls"] = controls + [control]
        return 0
    else:
        control = {"number" : number, "points" : points}
        DB_HANDLE["controls"] = [control]
        return 0

def delete_control(number):
    if DB_HANDLE["controls"] is not None:
        controls = DB_HANDLE["controls"]
        DB_HANDLE["controls"] = [cont for cont in controls if cont["number"] != number]
    else:
        DB_HANDLE["controls"] = []

def reset_controls():
    DB_HANDLE["controls"] = []

#
# Function to link controls with competitors.
#

def link_controls(control_numbers, cid):
    try:
        # Get competitor and its index.
        competitors = DB_HANDLE["competitors"]
        competitor = [comp for comp in competitors if comp["cid"] == cid][0]
        index = competitors.index(competitor)
        # Get the controls with the given numbers while adding up the competitor's score.
        controls = DB_HANDLE["controls"]
        controls_to_link = []
        competitor["score"] = 0 # first zero out the score
        for control_number in control_numbers:
            control = [cont for cont in controls if cont["number"] == control_number][0]
            print(control)
            competitor["score"] += int(control["points"])
            controls_to_link.append(control)
        # Put the competitor back with its controls linked.
        competitor["controls"] = controls_to_link
        DB_HANDLE["competitors"] = competitors[:index] + [competitor] + competitors[index+1:]
    except IndexError: # If any list overflow occurs, take it gracefully.
        return 1

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
        # Save the connection into the CLIENT_LIST.
        CLIENT_LIST[self.uid] = self
        # Inform the client about its UID.
        print("Assigned %s to the connection as the unique ID." % self.uid)
        data = {"action" : "SEND_UID", "uid" : self.uid}
        self.sendMessage(json.dumps(data).encode('utf-8'), isBinary=False)

    def onMessage(self, payload, isBinary):
        try:
            data = json.loads(payload)
            action = data["action"]
            uid = data["uid"]

            if action == "GET_CATEGORIES": # If someone wants categories, give them categories.
                send_categories(uid)
            elif action == "GET_COMPETITORS":
                send_competitors(uid)
            elif action == "GET_CONTROLS":
                send_controls(uid)
            elif ("ADD" in action) or ("DELETE" in action) or \
                 ("RESET" in action) or ("LINK" in action):
                if check_hash(data["password"]): # Validate password.
                    if "CATEGORY" in action or "CATEGORIES" in action:
                        if action == "ADD_CATEGORY":
                            add_category(data["category"])
                        elif action == "DELETE_CATEGORY":
                            delete_category(data["category"])
                        elif action == "RESET_CATEGORIES":
                            reset_categories()
                        # Send everyone the new category list.
                        for unique_id in CLIENT_LIST:
                            send_categories(unique_id)
                    elif "COMPETITOR" in action:
                        if action == "ADD_COMPETITOR":
                            add_competitor(name=data["name"], cid=data["id"],
                                           category=data["category"], club=data["club"])
                        elif action == "DELETE_COMPETITOR":
                            delete_competitor(cids=data["competitors"])
                        for unique_id in CLIENT_LIST:
                            send_competitors(unique_id)
                    elif "LINK" in action:
                        link_controls(control_numbers=data["controls"], cid=data["cid"])
                        for unique_id in CLIENT_LIST:
                            send_competitors(unique_id)
                    elif "CONTROL" in action:
                        if action == "ADD_CONTROL":
                            add_control(number=data["number"], points=data["points"])
                        elif action == "DELETE_CONTROL":
                            delete_control(data["number"])
                        elif action == "RESET_CONTROLS":
                            reset_controls()
                        for unique_id in CLIENT_LIST:
                            send_controls(unique_id)
                    else:
                        print("Unknown action from UID = %s" % uid)
                else:
                    print("Invalid password from UID = %s" % uid)

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
        if self.uid:
            del CLIENT_LIST[self.uid]
            print(("WebSocket connection with ID %s closed: {0}" % self.uid).format(reason))
        else:
            print("Some websocket connection was closed.")


if __name__ == '__main__':
    factory = WebSocketServerFactory(u"ws://" + socket.getfqdn() + ":31313", debug=False)
    factory.protocol = MyServerProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, socket.getfqdn(), 31313)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()
