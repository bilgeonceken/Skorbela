#!/usr/bin/env python3
"""
Copies Skorbela files into www directory of the webserver
and minifies Skorbela's JS.
"""
import sys
import glob
import socket
import subprocess

from subprocess import PIPE

file_list = glob.glob("add_category/*") +\
            glob.glob("add_competitor/*") +\
            glob.glob("calculate_score/*") +\
            glob.glob("results/*") +\
            glob.glob("style/*") +\
            glob.glob("images/*") +\
            ["index.html"]

js_list = ["add_category/add_category.js",
           "add_competitor/add_competitor.js",
           "calculate_score/calculate_score.js",
           "results/results.js"]

print("[BOOTSTRAP] Where is your www directory? (default: /var/www/html/")
www_directory = input()
if www_directory == "":
    www_directory = "/var/www/html"

print("[BOOTSTRAP] Copying files...")
subprocess.call(["mkdir", "-pv", www_directory + "/Skorbela/"])
for file_path in file_list:
    new_path = www_directory + "/Skorbela/" + file_path
    args = ["cp", "--parents", "-v", file_path, www_directory + "/Skorbela/"]
    cp = subprocess.call(args)

print("[BOOTSTRAP] Checking if you have UglifyJS installed...")
try:
    a = subprocess.Popen(["uglifyjs"])
except FileNotFoundError:
    print("[BOOTSTRAP] You don't have UglifyJS - please install it.")
    sys.exit(1)
finally:
    a.terminate()

print("[BOOTSTRAP] Minifying JS...")
try:
    for js_file in js_list:
        args = ["uglifyjs", js_file, "-m", "-c"]
        uglifyjs = subprocess.Popen(args, stdin=PIPE, stdout=PIPE, stderr=PIPE)
        output, err = uglifyjs.communicate()
        returncode = uglifyjs.wait()
        if returncode != 0:
            raise RuntimeError
        new_path = www_directory + "/Skorbela/" + js_file
        js_file_handle = open(new_path, 'wb')
        js_file_handle.write(output)
        js_file_handle.close()
except RuntimeError:
    print("[BOOTSTRAP] Error: UglifyJS exited with non-0 exit code.")   
