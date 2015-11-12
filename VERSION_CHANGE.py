#!/usr/bin/env python

import sys

file_list = ["index.html",
	     "add_competitor/index.html",
	     "add_control/index.html",
	     "do_stuff/index.html",
	     "results/index.html"]

def print_usage():
	print "\nThis changes the version numbers in HTML files' titles."
	print "Usage:", sys.argv[0], "<OLD VERSION NUMBER> <NEW VERSION NUMBER>\n"

if(len(sys.argv) != 3):
	print_usage()
	exit(1)

old_string = "SKORBELA " + str(sys.argv[1])
new_string = "SKORBELA " + str(sys.argv[2])

for file_path in file_list:
	print "processing", file_path
	file_handle = open(file_path, "r+")
	file_string = file_handle.read()
	file_handle.close()
	file_handle = open(file_path, "w")
	file_handle.write(file_string.replace(old_string, new_string))
	file_handle.close()
	

