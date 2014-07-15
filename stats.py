#!/usr/bin/python

"""
	Record and/or return statistics about HtR deaths.
	Uses a Cookie to identify players.
"""

import sys
import os
import cgi
import Cookie
import sqlite3
#import cgitb
#cgitb.enable()
import datetime
import re
import helpers

def Sanity(fields):
	identity = helpers.GetIdentity()
	if identity == "<anonymous>":
		return "<anonymouse>"

	try:
		fields["level"] = int(fields["level"])
	except:
		return "Bad level"
	
	if fields["level"] < 0 or fields["level"] > 3:
		return "Bad level"

	try:
		fields["distanceMoved"] = float(fields["distanceMoved"])
	except:
		return "Bad distance"
		
	if fields["distanceMoved"] <= 5:
		return "Didn't move"

	#if fields["type"] not in ["SQUISHED", "STABBED", "EATEN", "MAULED", "NEXTLEVEL"]:
	#	return "Invalid Type"

	if not (re.match("^[a-zA-Z ]+$", fields["type"])):
		return "Invalid Type"
	if len(fields["type"]) > 100:
		return "Invalid Type"

	x = fields["x"]
	y = fields["y"]
	if x > 1 or x < -1 or y > 1 or y < -1:
		return "Invalid coords"

	last_active = helpers.LastContact(identity)
	if last_active == None:
		return str(identity) + " hasn't been active"
	start = fields["start"]
	runtime = fields["runtime"]
	#if start < last_active:
	#	return "Start before last active"
	now = helpers.FloatNow()
	if (start+runtime)/1e3 > (5+now/1e3): 
		return "Impossible runtime; start %f + runtime %f = %f > %f" % (start, runtime, start+runtime, now)
	return True

if __name__ == "__main__":
	
	#sys.stderr = open(sys.argv[0]+".err", "w");

	site = helpers.GetSite()

	# Setup database if it doesn't exist
	if helpers.DataBaseExists() == False:
		helpers.FixDB() # Should create it.

	# Get the cookie
	identity = helpers.GetIdentity()
	nickname = helpers.GetNickname()

	# Get CGI fields
	form = cgi.FieldStorage()
	fields = ["start", "runtime", "steps", "type", "x", "y", "foxesSquished", "bossesSquished", "level", "lives","distanceMoved"]


	values = {}
	for f in fields:
		if form.has_key(f):
			try:
				v = float(form[f].value)
			except:
				v = form[f].value
			values.update({ f : v })

	# Send response
	if len(values) == 0:
		print("Content-type: text/plain\n")
		print("# You are: %s\n" % identity);
		print("# Get the full SQlite DB from: %s\n" % (site+"/stats.db"))
		print("# Expecting plots? This is the wrong place. Visit: %s\n" %(site+"/view.py?query=highscores"))
		print("# TOP 100 Runs\n")
		print("# nickname\tidentity\t" + "\t".join(fields)+"\n")
		conn = sqlite3.connect("stats.db")
		cursor = conn.cursor()
		for row in cursor.execute("SELECT " + ", ".join(["nickname","identity"] + fields)+" FROM stats ORDER BY level DESC, runtime DESC LIMIT 100"):
			s = ""
			for field in row:
				s += str(field)[0:20] + "\t"
			print(s)

		conn.close()
		sys.exit(0)
	elif len(values) != len(fields):
		print("Content-type: text/plain\n")
		print("Wrong number of fields")
		for i in fields:
			if i not in values:
				print("Missing: %s" % str(i))
		#sys.stderr.write("Wrong number of fields\n");
		sys.exit(0)

	# Someone could just leave their browser on the page not actually playing.
	# So only record games >10s
	s = Sanity(values)
	if s != True:
		print("Content-type: text/plain\n")
		print(str(s))
		sys.stderr.write(str(s)+"\n")
		sys.exit(0)


	conn = sqlite3.connect("stats.db")
	cursor = conn.cursor()
	cursor.execute("UPDATE players SET lastContact=? WHERE identity=?", (helpers.FloatNow(), identity))
	cursor.execute("UPDATE players SET nickname=? WHERE identity=?", (nickname, identity))
	
	#if int(float(form["runtime"].value)) < 12000:
	#	print("Content-type: text/plain\n")
	#	sys.exit(0)


	# Check size of DB
	dbSize = os.path.getsize("stats.db")
	if dbSize > 1e10:
		# Delete record with lowest score
		cursor.execute("DELETE FROM stats WHERE runtime = (SELECT MIN(runtime) FROM stats) AND level = (SELECT MIN(level) FROM stats)")

	cursor.execute("INSERT INTO stats(identity, nickname, "+(",".join([str(f) for f in fields]) + ") VALUES (?,?") +"".join([",?" for _ in xrange(len(fields))])+")", [identity, nickname] + [values[f] for f in fields])


	# Get current Level
	cursor.execute("SELECT level FROM players WHERE identity = ?", (identity,))
	l = cursor.fetchall()
	if len(l) > 0 and l[0][0] < values["level"]:
		cursor.execute("UPDATE players SET level=? WHERE identity=?", (values["level"], identity))

	
	conn.commit()
	conn.close()

	print("Content-type: text/plain\n")
	sys.exit(0)
