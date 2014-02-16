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


if __name__ == "__main__":

	site = "http://" + os.environ["SERVER_NAME"] + os.path.dirname(os.environ["REQUEST_URI"])

	if os.environ["SERVER_NAME"] not in ["rabbitgame.net", "dev.rabbitgame.net"]:
		if os.environ["SERVER_NAME"] == "www.rabbitgame.net":
			helpers.Redirect("http://rabbitgame.net")
			sys.exit(0)
	elif ".".join(os.environ["SERVER_NAME"].split(".")[1:]) != "rabbitgame.net":
		print("Content-type: text/html\n")
		print("<html><head><title>Humphrey The Rabbit Has Moved!</title></head><body>")
		print("<p> Humphrey The Rabbit has bounced to <a href=\"http://rabbitgame.net\">rabbitgame.net</a></p>")
		print("<p> But if that still takes you to the wrong place, go <a href=\"game.html\">here</a></p>")
		print("<p> Apologies for any inconvenience. </p>")
		print("<p> </p>")
		print("<p> <img src=\"data/fox/drawing1.svg\" alt=\"walking fox cartoon\" width=\"20%\"><img src=\"data/rabbit/drawing2.svg\" alt=\"scared rabbit cartoon\" width=\"10%\"> </p>")
		print("</table></body></html>")
		sys.exit(0)

	print("Content-type: text/html")
	cookie_warn = False
	returning_player = True
	identity = helpers.GetIdentity()
	if identity == "<anonymous>":
		returning_player = False
		try:
			cookie = Cookie.SimpleCookie()
			cookie["identity"] = hashlib.md5(str(datetime.datetime.now())).hexdigest()
			identity = cookie["identity"].value
			expires = datetime.datetime.now() + datetime.timedelta(days=10000)
			cookie["identity"]["expires"] = expires.strftime('%a, %d %b %Y %H:%M:%S')
			print(cookie.output())
			cookie_warn = True
		except:
			# Couldn't set the cookie, don't bother warning them.
			cookie_warn = False

	form = cgi.FieldStorage()
	timestamp = helpers.FloatNow();
	level = 1
	print("\n")
	game = open("game.html", "r")
	lines = game.readlines()
	game.close()
	for l in lines[0:-2]:
		print(str(l))
	print("<script type=\"text/javascript\">")
	print("serverTime = %f;" % timestamp)

	if (helpers.DataBaseExists()):
		conn = sqlite3.connect("stats.db")
		c = conn.cursor()
		if returning_player == True:
			c.execute("SELECT level FROM players WHERE identity=?",(identity,))
			maxLevel = c.fetchone()
			if level != None:
				maxLevel= maxLevel[0]
				c.execute("UPDATE players SET lastContact=? WHERE identity=?", (timestamp,identity))

		if cookie_warn or level == None:
			c.execute("INSERT INTO players(identity,created,lastContact,level) VALUES (?,?,?,1)", (identity,timestamp,timestamp))

		conn.commit()
		conn.close()

	if form.has_key("level"):
		maxLevel = min(int(float(level)), int(float(form["level"].value)))
		level = maxLevel

	print("maxLevel = %d;" % maxLevel)
	print("level = %d;" % level)
	print("</script>")


	if cookie_warn:
		# Warn about cookies. No other websites EVER seem to do this but we will be nice.
		print("<script type=\"text/javascript\">alert(\"A cookie has been set!\\nYour player identity is: %s\\n\\nYou can use this at %s/view.py to keep track of your scores.\\n\\nThe cookie can't be used to personally identify you.\\nIf you are still not OK with this, feel free to disable cookies.\\n\\nThe game will work exactly the same with or without cookies.\\nVisit %s/game.html directly to avoid this message.\");</script>" % (cookie["identity"].value, site,site))
	
	for l in lines[-2:]:
		print(str(l))

