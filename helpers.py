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
		"nickname" : "nemo",
		"ipaddr" : "",
		"start" : datetime.datetime.now(),
		"runtime" : 0,
		"steps" : 0,
		"type" : "UNKNOWN",
		"x" : 0,
		"y" : 0,
		"foxesSquished" : 0,
		"bossesSquished" : 0,
		"level" : 0,
		"lives" : 0,
		"distanceMoved" : 0},

	"players" : {
		"identity" : "<anonymous>",
		"nickname" : "nemo",
		"lastip" : "",
		"created" : 0, 
		"lastContact" : 0,
		"level" : 0,
		"visits" : 0
	}
}


def AddPlayer(identity):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("INSERT INTO players(identity,nickname,lastip,created,lastContact,level,visits) VALUES (?,?,?,?,?,0,0)", (identity, "nemo", os.environ["REMOTE_ADDR"], FloatNow(), FloatNow()))
	conn.commit()
	conn.close()
	
def PlayerVisits(identity):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	
	c.execute("SELECT visits FROM players WHERE identity=?", (identity,))
	visits = c.fetchall()[0][0]
	visits += 1
	c.execute("UPDATE players SET visits=? WHERE identity=?", (visits, identity))
	conn.commit()
	conn.close()

def GetIdentity():
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		return cookie["identity"].value
	except KeyError, Cookie.CookieError:
		return "<anonymous>"


def GetNickname():
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		return cookie["nickname"].value
	except KeyError, Cookie.CookieError:
		return "nemo"
		

def LastContact(ident):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT lastContact FROM players WHERE identity=?", (ident,))
	results = c.fetchall()
	conn.close()
	if (len(results) > 0):
		return results[0][0]
	return None
	

def PlayerExists(ident):
	return LastContact(ident) != None


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
				if k not in dbTables[table]:
					continue
				try:
					fixed[k] = float(r[i])
				except ValueError:
					fixed[k] = r[i]
			
			c.execute("INSERT INTO "+str(table)+"("+",".join(fixed.keys())+") VALUES (?"+"".join([",?" for _ in xrange(len(fixed)-1)])+")", fixed.values())

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

# Redirect a page
# http://stackoverflow.com/questions/5411538/how-to-redirect-from-an-html-page
def Redirect(url):
	print("Content-type: text/html\n")
	print("<html>")
	print("<head><meta http-equiv=\"refresh\" content=\"0;url=\"%s\">" % url)
	print("<script type=\"text/javascript\">")
	print("window.location.href = \"%s\"" % url)
	print("</script>")
	print("<title>Redirecting to %s ...</title>" % url)
	print("</head>")
	print("<body>If you are not redirected automatically, follow this link to <a href=\"%s\">%s</a></body></html>" % (url,url))
