#!/usr/bin/python

"""
	Specify what adverts should be shown in what order in JSON format
"""

import sys
import os
import cgi
import random
import json

if __name__ == "__main__":
	sys.stdout.write("Content-type: application/json; charset=utf-8\r\n\r\n");
	d = os.listdir("data/adverts")
	#d += ["view.py?query=attempts&level=1"]
	#d += ["view.py?query=attempts&level=2"]
	
	
	d.sort(key = lambda e : random.random())
	for i in xrange(len(d)):
		d[i] = "data/adverts/"+d[i]
	#d.insert(0,"data/adverts/advertising.svg")
	sys.stdout.write(json.dumps(d)+"\n")
	sys.exit(0)

