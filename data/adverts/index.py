#!/usr/bin/python

"""
	List the contents of directory in JSON format
"""

import sys
import os
import cgi

import json

if __name__ == "__main__":
	sys.stdout.write("Content-type: application/json; charset=utf-8\r\n\r\n");
	d = []
	for f in os.listdir("."):
		if f not in ["index.py"]:
			d += [f]
			
	sys.stdout.write(json.dumps(d))
	sys.exit(0)

