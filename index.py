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


if __name__ == "__main__":
	print("Content-type: text/html")
	cookie_warn = False
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		identity = cookie["identity"].value
		print("\n")
	except KeyError, Cookie.CookieError:

		try:
			cookie = Cookie.SimpleCookie()
			cookie["identity"] = hashlib.md5(str(datetime.datetime.now())).hexdigest()
			print(cookie.output())
			cookie_warn = True
		except:
			# Couldn't set the cookie, don't bother warning them.
			cookie_warn = False

	try:
		print("\n")
		# Should I use a redirect instead? It is more typing? But I just typed this comment...
		game = open("game.html", "r")
		print(game.read())
		if cookie_warn:
			# Warn about cookies. No other websites EVER seem to do this but we will be nice.
			print("<script type=\"text/javascript\">alert(\"A cookie has been set!\\nYour player identity is: %s\\n\\nYou can use this at /stats.py to keep track of your scores.\\n\\nThe cookie can't be used to personally identify you.\\nIf you are still not OK with this, feel free to disable cookies.\\n\\nThe game will work exactly the same with or without cookies.\\nIf you do disable cookies, visit /game.html directly to avoid this message.\");</script>" % (cookie["identity"].value))
	except:
		print("<p> Something went wrong! Don't panic, this is just a hacky CGI script. The actual game is <a href=\"game.html\">here</a> </p>")
		sys.exit(0)

