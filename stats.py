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



if __name__ == "__main__":
	
	#sys.stderr = open(sys.argv[0]+".err", "w");

	site = "http://" + os.environ["SERVER_NAME"] + os.path.dirname(os.environ["REQUEST_URI"]) + "/" 

	# Setup database if it doesn't exist
	try:
		f = open("stats.db", "r")
	except IOError:
		conn = sqlite3.connect("stats.db")
		c = conn.cursor()
		c.execute("CREATE TABLE stats (identity, start, runtime, steps, death, x, y, foxesSquished, foxesDazed, boxesSquished)")
		conn.commit()
		conn.close()
	else:
		f.close()

	# Get the cookie
	identity = ""
	try:
		http_cookie = os.environ["HTTP_COOKIE"]
		cookie = Cookie.SimpleCookie(http_cookie)
		identity = cookie["identity"].value
	except KeyError, Cookie.CookieError:
		identity = "<anonymous>"


	# Get CGI fields
	form = cgi.FieldStorage()
	fields = ["start", "runtime", "steps", "death", "x", "y", "foxesSquished", "foxesDazed", "boxesSquished"]


	values = []
	for f in fields:
		if form.has_key(f):
			values += [form[f].value]

	# Send response
	if len(values) == 0:
		print("Content-type: text/plain\n")
		print("# You are: %s\n" % identity);
		print("# Get the SQlite DB from: %s\n" % (site+"stats.db"))

		print("# identity\t" + "\t".join(fields)+"\n")
		conn = sqlite3.connect("stats.db")
		cursor = conn.cursor()
		for row in cursor.execute("SELECT * FROM stats"):
			s = ""
			for field in row:
				s += field + "\t"
			print(s)

		conn.close()
		sys.exit(0)
	elif len(values) != len(fields):
		print("Content-type: text/plain\n")
		#sys.stderr.write("Wrong number of fields\n");
		sys.exit(0)

	# Someone could just leave their browser on the page not actually playing.
	# So only record games >10s
	elif int(form["runtime"].value) < 10000:

		print("Content-type: text/plain\n")
		sys.exit(0)

	conn = sqlite3.connect("stats.db")
	cursor = conn.cursor()
	# Check size of DB
	cursor.execute("SELECT Count(*) FROM stats")
	count = cursor.fetchall()[0][0]

	# Delete earliest record if necessary
	if count > 5000:
		cursor.execute("DELETE FROM stats WHERE start = (SELECT MIN(start) FROM stats)")


	cursor.execute("INSERT INTO stats VALUES (?"+"".join([",?" for _ in xrange(len(fields))])+")", [identity] + values)
	
	conn.commit()
	conn.close()

	print("Content-type: text/plain\n")
	sys.exit(0)
