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
	d = ["data/adverts/"+str(x) for x in d if (x.split(".")[-1] in ["svg","png"])]
	
		
	for x in xrange(1,5):
		d += ["view.py?query=attempts&level=%d" % x]
	d.sort(key = lambda e : random.random())
	
	sys.stdout.write(json.dumps(d)+"\n")
	sys.exit(0)

