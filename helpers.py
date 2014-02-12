#!/usr/bin/python

import sys
import os
import cgi
import Cookie
import sqlite3
import datetime

dbTables = {
	"stats" : {
		"identity" : "<anonymous>",
		"start" : datetime.datetime.now(),
		"runtime" : 0,
		"steps" : 0,
		"death" : "UNKNOWN",
		"x" : 0,
		"y" : 0,
		"foxesSquished" : 0,
		"foxesDazed" : 0,
		"boxesSquished" : 0,
		"level" : 1},

	"players" : {
		"identity" : "<anonymous>",
		"created" : 0, 
		"lastContact" : 0,
		"level" : 1,
	}
}


def GetIdentity():
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		return cookie["identity"].value
	except KeyError, Cookie.CookieError:
		return "<anonymous>"

def LastContact(ident):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT lastContact FROM players WHERE identity=?", (ident,))
	results = c.fetchall()
	conn.close()
	if (len(results) > 0):
		return results[0][0]
	return None


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

def FloatDate(date):
	return float(date.strftime("%s"))*1e3
def FloatNow():
	return FloatDate(datetime.datetime.now())

def FixDB():
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()

	for table in dbTables.keys():
		c.execute("PRAGMA table_info(%s)" % table)
		columns = c.fetchall()
		if len(columns) > 0:
			c.execute("SELECT * FROM %s" % table)
			results = c.fetchall()
			c.execute("DROP TABLE %s" % table) # :O
			conn.commit()
		else:
			results = []


		query = "CREATE TABLE %s %s" % (table, str(tuple(dbTables[table].keys())))
		c.execute(query)

		for r in results:
			fixed = {}
			fixed.update(dbTables[table])
			r = list(r)
			for i in xrange(len(r)):
				k = str(columns[i][1])
				try:
					fixed[k] = float(r[i])
				except ValueError:
					fixed[k] = r[i]

			insert = []
			for i in tuple(dbTables[table].keys()):
				insert += [fixed[i]]
			c.execute("INSERT INTO "+str(table)+" VALUES (?"+"".join([",?" for _ in xrange(len(fixed)-1)])+")", insert)

		conn.commit()
	conn.close()

def DumpDB():
	if DataBaseExists():
		conn = sqlite3.connect("stats.db")
		c = conn.cursor()
		c.execute("SELECT * FROM stats")
		print(str(c.fetchall()))
	else:
		print("[]")
