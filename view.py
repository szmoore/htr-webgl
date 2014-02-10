#!/usr/bin/python

import cgi
import Cookie
import sys
import os
import sqlite3
import datetime

import helpers

def HighScores(form):
	# Access database
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()

	scoretype = "runtime"

	try:
		c.execute("SELECT identity, runtime, start FROM stats ORDER BY runtime DESC LIMIT 10")
		scores = c.fetchall()
		conn.close()
	except:
		print("Content-type: text/plain\n")
		print("Database access error.")
		return

	print("Content-type: text/html\n")
	print("<html><head><title>High Scores</title></head><body>")
	print("<h1>High Scores</h1>")
	print("<p><b><i><a href=\"index.py\">DO YOU HAVE WHAT IT TAKES?</a></i></b></p>")
	if len(scores) <= 0:
		print("<p> <b>THERE ARE NO HIGH SCORES! NOW IS YOUR CHANCE FOR <i>GLORY!!!!!</i></b> </p>")
		return
	print("<table width=\"100%\">")
	print("	<tr> <td><b>Rank</b></td> <td> <b> ID </b> </td> <td> <b>%s</b> </td> <td> <b>Date</b> </td> </tr>" % (scoretype,))
	for rank,score in enumerate(scores):
		ident, points, date = score
		ident = str(ident)
		if scoretype == "runtime":
			try:
				points = str(float(points)/1e3)
			except:
				pass

		date = str(date)
		date = str(datetime.datetime.fromtimestamp(float(date)/1e3))
		print("<tr> <td>%d</td> <td>%s</td> <td>%s</td> <td>%s</td>" % (rank+1, ident, points, date))


	print("</table>")
	print("</body></html>")




def ShowIdentity(form):
	print("Content-type: text/plain\n")
	print(helpers.GetIdentity())

if __name__ == "__main__":

	# Check for database
	if helpers.DataBaseExists() == False:
		print("Content-type: text/plain\n")
		print("Could not access the database at this time.")
		sys.exit(0)
	
	# Get cookie
	identity = helpers.GetIdentity()

	# Check query.
	form = cgi.FieldStorage()

	api = {
		"highscores" : HighScores,
		"identity" : ShowIdentity
	}

	if form.has_key("query") and form["query"].value in api:
		api[form["query"].value](form)
	else:
		print("Content-type: text/html\n")
		print("<html><head><title>View</title></head></html>")
		print("<body>")
		for i in api:
			f = str(api[i]).split(" ")[1]
			print("<p> <a href=\"view.py?query=%s\">%s</a></p>" % (i,f))
		print("</body>")
		print("</html>")


