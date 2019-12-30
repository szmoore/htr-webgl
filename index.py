#!/usr/bin/python

"""
	HtR Index - Set player ID cookie and then just load the game.
"""

import sys
import os
import cgi
import Cookie
import datetime
import hashlib
import sqlite3
import re

import helpers

def CheckDomain():
	site = "http://" + os.environ["SERVER_NAME"] + os.path.dirname(os.environ["REQUEST_URI"])
	server = os.environ["SERVER_NAME"]
	domain = ".".join(os.environ["SERVER_NAME"].split(".")[1:])

	if server == "www.rabbitgame.net":
		helpers.Redirect("http://rabbitgame.net")
		sys.exit(0)
	elif server != "rabbitgame" and server != "rabbitgame.net" and domain != "rabbitgame.net" and server not in ["localhost", "rabbitgame.ucc.asn.au", "rabbitgame.ucc.gu.uwa.edu.au"]:
		print("Content-type: text/html\n")
		print("<html><head><title>Humphrey The Rabbit Has Moved!</title></head><body>")
		print("<p> Humphrey The Rabbit has bounced to <a href=\"http://rabbitgame.net\">rabbitgame.net</a></p>")
		print("<p> But if that still takes you to the wrong place, go <a href=\"game.html\">here</a></p>")
		print("<p> Apologies for any inconvenience. </p>")
		print("<p> </p>")
		print("<p> <img src=\"data/fox/drawing1.svg\" alt=\"walking fox cartoon\" width=\"20%\"><img src=\"data/rabbit/drawing2.svg\" alt=\"scared rabbit cartoon\" width=\"10%\"> </p>")
		print("</table></body></html>")
		sys.exit(0)

def main(argv):
#	CheckDomain()
	
	returning_player = True
	identity = helpers.GetIdentity()
	
	
	
	if identity == "<anonymous>" or helpers.PlayerExists(identity) == False:
		returning_player = False
		identity = hashlib.md5(str(datetime.datetime.now())).hexdigest()
		helpers.AddPlayer(identity)
	else:
		helpers.PlayerVisits(identity)

	form = cgi.FieldStorage()
	timestamp = helpers.FloatNow();
	print("Content-type: text/html\r\n\r\n")
	
	game = open("game.html", "r")
	lines = game.readlines()
	game.close()
	for l in lines[0:-2]:
		print(str(l))
		
	print("<script type=\"text/javascript\">")
		
	try:
		print("g_serverTime = %f;" % timestamp)
		if identity != "<anonymouse>":
			print("g_identityCookie = \"%s\";" % identity)
	
		if "adblock" in form:
			print("g_adblockCookie = \"%s\";" % form["adblock"].value)

		if "touchBar" in form:
			print("g_touchBarCookie = \"%s\";" % form["touchBar"].value)

		if "moarlives" in form:
			print("g_startingLives = %s;" % str(form["moarlives"].value))	
		else:
			print("g_startingLives = 0;")
	
	except Exception as e:
		print("console.debug(\"Server database error: %s\")" % str(e))
	print("</script>")

	for l in lines[-2:]:
		print(str(l))

if __name__ == "__main__":
	main(sys.argv)

