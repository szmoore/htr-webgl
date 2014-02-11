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
	helpers.LinkToYou()
	print("<p><b><i><a href=\"index.py\">DO YOU HAVE WHAT IT TAKES?</a></i></b></p>")
	if len(scores) <= 0:
		print("<p> <b>THERE ARE NO HIGH SCORES! NOW IS YOUR CHANCE FOR <i>GLORY!!!!!</i></b> </p>")
		return
	print("<table width=\"100%\">")
	print("	<tr> <td><b>Rank</b></td> <td> <b> ID </b> </td> <td> <b>%s</b> </td> <td> <b>Date</b> </td> </tr>" % (scoretype,))
	for rank,score in enumerate(scores):
		ident, points, date = score
		print("<a name=\"%s\"></a>" % ident)
		try:
			ident = helpers.IdentifyYou(ident)
			points = float(points)/1e3
			date = helpers.ReadableDate(date)
		except:
			pass

		sys.stdout.write("<tr> ")
		for field in [rank, ident, points, date]:
			sys.stdout.write("<td>%s</td> " % str(field))
		sys.stdout.write("</tr>\n")

	print("</table>")
	print("</body></html>")




def ShowIdentity(form):
	print("Content-type: text/plain\n")
	print(helpers.GetIdentity())

def TopScore(form):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT MAX(runtime) FROM stats")
	print("Content-type: text/plain\n")
	print(c.fetchall()[0][0])
	conn.close()

def PlayerList(form):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT identity, Count(*), MAX(runtime), SUM(runtime), SUM(foxesSquished), MIN(start), MAX(start) FROM stats GROUP by IDENTITY ORDER by SUM(runtime) DESC")
	players = c.fetchall()
	conn.close()
	print("Content-type: text/html\n")
	print("<h1>Players: %d</h1>" % (len(players),))
	if len(players) <= 0:
		print("<p> <b> NO ONE HAS PLAYED :-(</b> please. <a href=\"index.py\"make me happy.</a> </p>")
		return

	helpers.LinkToYou()

	print("<table width=\"100%\">")
	sys.stdout.write("<tr> ")
	for field in ["Player", "Deaths", "Best Time", "Total Time", "Foxes Killed", "First Played", "Last Played"]:
		sys.stdout.write("<td><b>%s</b></td> " % field)
	sys.stdout.write("<tr>\n")

	for p in players:
		ident, deaths, best, total, foxkills, first, last = p
		sys.stdout.write("<a name=\"%s\"></a>" % ident)
#		try:
		ident = helpers.IdentifyYou(ident)
		best = float(best)/1e3
		total = float(total)/1e3
		first = helpers.ReadableDate(first)
		last = helpers.ReadableDate(last)
#		except:
#			pass

		for field in [ident, deaths, best, total, foxkills, first, last]:
			sys.stdout.write("<td>%s</td> " % str(field))
		sys.stdout.write("</tr> \n")

	print("</table>")
	print("</body></html>")

# Players that played in the last 10 minutes
def ActivePlayers(form):
	if form.has_key("since"):
		mins = float(form["since"].value)
	else:
		mins = 10
	cutoff = (float(datetime.datetime.now().strftime("%s")) - 60*mins)*1e3
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT identity, start, runtime FROM stats WHERE start > ? GROUP BY identity", (cutoff,))
	print("Content-type: text/plain\n")
	print(str(c.fetchall()))
	conn.close()

# The last person to play
def LastPlayer(form):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT identity, start, runtime FROM stats ORDER by start DESC LIMIT 1")
	
	print("Content-type: text/html\n")
	print("<html><head><title>Last Player</title></head><body>")
	print("<h1> Last Player</h1>")
	p = c.fetchall()[0]
	print("<p> %s played for %s s at %s </p>" % (str(p[0]), str(round(p[2]/1e3)), str(helpers.ReadableDate(p[1]))))
	print("</body></html>")

	conn.close()



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
		"identity" : ShowIdentity,
		"topscore" : TopScore,
		"players" : PlayerList,
		"active" : ActivePlayers,
		"last" : LastPlayer
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


