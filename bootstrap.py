#!/usr/bin/env python3
"""
Copies Skorbela files into www directory of the webserver
and minifies Skorbela's JS.
"""
import sys
import glob
import socket
import hashlib
import subprocess

from subprocess import PIPE

def main():
    "Copy -> minify -> alter connect addresses."
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

    html_list = ["add_category/index.html",
                 "add_competitor/index.html",
                 "calculate_score/index.html",
                 "results/index.html"]

    print("[BOOTSTRAP] Where is your www directory? (default: /var/www/html/")
    www_directory = input()
    if www_directory == "":
        www_directory = "/var/www/html"

    print("[BOOTSTRAP] What would you like as the password?")
    password = input()
    with open("./skorbela_server.py", "r") as f_handle:
        py_string = f_handle.read()
    lines = py_string.split("\n")
    for line in lines:
        if line.startswith("PASS_HASH"):
            index = lines.index(line)
            new_line = "\nPASS_HASH = \"" + hashlib.sha256(password.encode('utf-8')).hexdigest() + "\"\n"
            py_string = "\n".join(lines[:index]) + new_line + "\n".join(lines[index+1:])
    with open("./skorbela_server.py", "w") as f_handle:
        f_handle.write(py_string)

    print("[BOOTSTRAP] Copying files...")
    subprocess.call(["mkdir", "-pv", www_directory + "/Skorbela/"])
    for file_path in file_list:
        new_path = www_directory + "/Skorbela/" + file_path
        args = ["cp", "--parents", "-v", file_path, www_directory + "/Skorbela/"]
        subprocess.call(args)

    print("[BOOTSTRAP] Checking if you have UglifyJS installed...")
    try:
        uglifyjs = subprocess.Popen(["uglifyjs"])
    except FileNotFoundError:
        print("[BOOTSTRAP] You don't have UglifyJS - please install it.")
        sys.exit(1)
    else:
        uglifyjs.terminate()

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
            with open(new_path, 'wb') as f_handle:
                f_handle.write(output)
    except RuntimeError:
        print("[BOOTSTRAP] Error: UglifyJS exited with non-0 exit code.")
        print("[BOOTSTRAP] stderr of UglifyJS:\n" + err)

    print("[BOOTSTRAP] Altering pages' onload connect addresses...")
    websocket_address = "ws://" + socket.getfqdn() + ":31313"
    for html_file in html_list:
        html_file = www_directory + "/Skorbela/" + html_file
        with open(html_file, 'r') as f_handle:
            html_string = f_handle.read()
        html_string = html_string.replace("ws://localhost:31313", websocket_address)
        with open(html_file, 'w') as f_handle:
            f_handle.write(html_string)

if __name__ == "__main__":
    main()
