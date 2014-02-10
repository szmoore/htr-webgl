#!/usr/bin/python

import sys
import os
import cgi
import Cookie
import sqlite3

def GetIdentity():
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		return cookie["identity"].value
	except KeyError, Cookie.CookieError:
		return "<anonymous>"

def GetSite():
	try:
		return "http://" + os.environ["SERVER_NAME"] + os.path.dirname(os.environ["REQUEST_URI"])
	except:
		return ""

def DataBaseExists():
	try:
		f = open("stats.db", "r")
	except IOError:
		return False
	else:
		f.close()
	return True


