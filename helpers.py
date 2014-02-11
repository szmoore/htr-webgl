#!/usr/bin/python

import sys
import os
import cgi
import Cookie
import sqlite3
import datetime

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

# Link to the player
def LinkToYou():
	you = GetIdentity()
	print("<p><b>You:</b> <a href=\"#%s\">%s</a> " % (you,you))	
	print(" - <a href=\"view.py?query=players\"> Player List</a></p>")

def IdentifyYou(ident):
	if ident == GetIdentity():
		return "<b><i>YOU</i></b>"
	return ident

def ReadableDate(timestamp):
	return datetime.datetime.fromtimestamp(float(timestamp)/1e3).strftime("%Y-%m-%d %H:%M")

