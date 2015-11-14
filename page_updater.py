#!/usr/bin/env python

import sys
from bs4 import BeautifulSoup

add_competitor_index_path = "add_competitor/index.html"

print "Hello! I am the page-updater, a child of skorbela-server."

command = sys.argv[1]

if(len(sys.argv) > 2): category = sys.argv[2]
else: category = ""

print "I was called with command=",command,"category=",category

if command == "add":
	# Get soup.
	file_handle = open(add_competitor_index_path, "r")
	soup = BeautifulSoup(file_handle)
	
	# Seek <select> tag and put an <option>CATEGORY</option> between the select tags.
	new_tag = soup.new_tag("option")
	new_tag.string = str(category)
	dropdown_list = soup.body.select("select")[0]
	dropdown_list.append(new_tag)
	
	file_handle.close()
	
	# Clear and write to file.
	file_handle = open(add_competitor_index_path, "w")
	file_handle.write(str(soup))
	file_handle.close()

if command == "reset":
	# Get soup.
	file_handle = open(add_competitor_index_path, "r")
	soup = BeautifulSoup(file_handle)

	# Seek <select> tag and clear everything in it.
	dropdown_list = soup.body.select("select")[0]
	dropdown_list.clear()

	# Clear and write to file.
	file_handle = open(add_competitor_index_path, "w")
	file_handle.write(str(soup))
	file_handle.close()

if command == "delete":
	# Get soup.
	file_handle = open(add_competitor_index_path, "r")
	soup = BeautifulSoup(file_handle)

	# Seek <select> tag, seek the category <option> tag and decompose it.
	dropdown_list = soup.body.select("select")[0]
	soup.find_all("option", text=category)[0].decompose()

	# Clear and write to file.
	file_handle = open(add_competitor_index_path, "w")
	file_handle.write(str(soup))
	file_handle.close()

	

