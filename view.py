#!/usr/bin/python

import cgi
import Cookie
import sys
import os
import sqlite3
import datetime
import requests
import tempfile
import re
os.environ['MPLCONFIGDIR'] = tempfile.mkdtemp()
import matplotlib
matplotlib.use('Agg')
from pylab import *
from mpl_toolkits.basemap import Basemap

from scipy.stats import gaussian_kde

import helpers

def HighScores(form):
	# Access database
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()

	scoretype = "runtime"


	try:
		query = "SELECT nickname, identity, level, runtime, start FROM stats"
		things = []
		if "nickname" in form:
			query += " WHERE nickname=?"
			things += [form["nickname"].value]
			
		if "level" in form:
			if len(things) > 0:
				query += " AND "
			else:
				query += " WHERE "
			query += " level=?"
			things += [int(form["level"].value)]

		query += " ORDER BY level DESC, runtime DESC LIMIT 20"
		sys.stderr.write(query+"\n")
		c.execute(query, things)

	except Exception as e:
		print("Content-type: text/plain\n")
		print("Database access error.")
		print(str(e))
		return
		

	
	scores = c.fetchall()
	conn.close()

	print("Content-type: text/html\n")
	print("<html><head><title>High Scores</title></head><body>")
	print("<h1>High Scores</h1>")
	helpers.LinkToYou()
	print("<p><b><i><a href=\"index.py\">DO YOU HAVE WHAT IT TAKES?</a></i></b></p>")
	if len(scores) <= 0:
		print("<p> <b>THERE ARE NO HIGH SCORES! NOW IS YOUR CHANCE FOR <i>GLORY!!!!!</i></b> </p>")
		return
	print("<table width=\"100%\">")
	print("	<tr> <td><b>Nickname</b></td> <td> <b> Rank </b> </td> <td><b>Level</b></td> <td> <b>%s</b> </td> <td> <b>Date</b> </td> <td><b>ID</b></td> </tr>" % (scoretype,))
	for rank,score in enumerate(scores):
		nickname, ident, level, runtime, date = score
		print("<a name=\"%s\"></a>" % ident)
		try:
			ident = helpers.IdentifyYou(ident)
			
			runtime= float(runtime)/1e3
			date = helpers.ReadableDate(date)
			level = int(float(level))
		except:
			pass

		sys.stdout.write("<tr> ")
		for field in [nickname, rank, level, runtime, date,ident[0:20]]:
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
	level = 1
	if form.has_key("level"):
		level = int(float(form["level"].value))
	else:
		c.execute("SELECT MAX(level) FROM stats")
		level = c.fetchall()
		if len(level) > 0:
			level = level[0][0]
		else:
			level = 1

	
	c.execute("SELECT MAX(runtime) FROM stats WHERE level = ?", (level,))
	print("Content-type: text/plain\n")
	print(c.fetchall()[0][0])
	conn.close()

def PlayerList(form):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT identity, Count(*), MAX(level), SUM(runtime), SUM(foxesSquished), MIN(start), MAX(start) FROM stats GROUP BY identity ORDER by level DESC, SUM(runtime) DESC")
	players = c.fetchall()

	# Because I have no idea how to do this with an SQL query...
	for i, p in enumerate(players):
		players[i] = list(p)
		c.execute("SELECT MAX(runtime) FROM stats WHERE identity = ? AND level = ?", (p[0], p[2]))
		runtime = c.fetchone()[0]
		players[i].insert(3, runtime)

	
	fields = [[p[0], p[1], "false"] for p in [("identity" ,"Player"), ("attempts" , "Attempts"), ("level" , "Level"), ("bestTime", "Best Time"), ("totalTime" , "Total Time"), ("foxesKilled" , "Foxes Killed"), ("firstPlayed" , "First Played"), ("lastPlayed" , "Last Played")]]

	if form.has_key("order"):
		try:
			order = [f[0] for f in fields].index(form["order"].value)
		except ValueError:
			pass
		else:
			reverse = form.has_key("reverse") and form["reverse"].value == "true"
			fields[order][2] = "false" if reverse else "true"
			players.sort(key = lambda e : e[order], reverse=reverse)

	conn.close()
	print("Content-type: text/html\n")
	print("<h1>Players: %d</h1>" % (len(players),))
	if len(players) <= 0:
		print("<p> <b> NO ONE HAS PLAYED :-(</b> please. <a href=\"index.py\"make me happy.</a> </p>")
		return

	helpers.LinkToYou()

	print("<table width=\"100%\">")
	sys.stdout.write("<tr> ")

	for f in fields:
		sys.stdout.write("<td><a href=\"view.py?query=players&order=%s&reverse=%s\">%s</a></td> " % (f[0], f[2], f[1]))
	sys.stdout.write("<tr>\n")

	for p in players:
		ident, deaths, level, best, total, foxkills, first, last = p
		sys.stdout.write("<a name=\"%s\"></a>" % ident)
#		try:
		ident = helpers.IdentifyYou(ident)
		level = int(float(level))
		best = float(best)/1e3
		total = float(total)/1e3
		first = helpers.ReadableDate(first)
		last = helpers.ReadableDate(last)
#		except:
#			pass

		for field in [ident, deaths, level, best, total, foxkills, first, last]:
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
	c.execute("SELECT nickname, identity, start, runtime FROM stats WHERE start > ? GROUP BY nickname", (cutoff,))
	print("Content-type: text/plain\n")
	print(str(c.fetchall()))
	conn.close()

# The last person to play
def LastPlayer(form):
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT nickname, identity, start, runtime FROM stats ORDER by start DESC LIMIT 1")
	
	print("Content-type: text/html\n")
	print("<html><head><title>Last Player</title></head><body>")
	print("<h1> Last Player</h1>")
	p = c.fetchall()[0]
	print("<p> %s played for %s s at %s </p>" % (str(p[0]), str(round(p[3]/1e3)), str(helpers.ReadableDate(p[1]))))
	print("</body></html>")

	conn.close()

def GetAccesses():
	f = open("../../rabbitgame.access", "r")
	data = asarray([[datetime.datetime.strptime(l.split(" ")[5].strip("["), "%d/%b/%Y:%H:%M:%S"), l.split(" ")[0]] for l in f.readlines()])
	f.close()
	return data

def IPToXY(ip):
	try:
#	if True:
		#response = urllib.urlopen('http://api.hostip.info/get_html.php?ip=%s&position=true' % ip).read()	
		#y = float(re.search("Latitude: (\d+.\d+)").group(1))
		#x = float(re.search("Longitude: (\d+.\d+)").group(1))
		url = "{}/{}".format("http://ip-api.com/json/", ip)
		response = requests.get(url)
		response.raise_for_status()
		x = float(response.json()["lon"])
		y = float(response.json()["lat"])
		return [x,y]
	except:
		return None

def GraphAccessesMap(form):
	data = GetAccesses()
	if data.size == 0:
		print("Content-type: text/plain\n\nNo data\n")
		return

	m = Basemap(projection="mill", lon_0=120)
	m.drawcoastlines()
	m.drawparallels(arange(-90,90,30), labels=[1,0,0,0])
	m.drawmeridians(arange(m.lonmin, m.lonmax+30, 60), labels=[0,0,0,1])
	#m.drawmapboundary(fill_color="aqua")
	#m.fillcontinents(color="white", lake_color="aqua")
	last=500
	raw_xy = asarray([m(xy[0], xy[1]) for xy in [IPToXY(ip) for i,ip in enumerate(data[-last:,1]) if ip != data[-last:,1][i-1] or i==0] if xy != None])

	xy = vstack([raw_xy[:,0],raw_xy[:,1]])
	z = gaussian_kde(xy)(xy)
	idx = z.argsort()
	x,y,z = raw_xy[:,0][idx], raw_xy[:,1][idx], z[idx]



	m.scatter(x,y,c=z,marker='o')
	print("Content-type: image/png\n")
	savefig(sys.stdout, format="png")
	savefig("data/accessmap.svg", format="svg")

def GraphAccesses(form):
	data = GetAccesses()
	if data.size == 0:
		print("Content-type: text/plain\n\nNo data\n")
		return
	title("Access Events")
	xlabel("Date")
	ylabel("Count")
	plot(data[:,0], arange(data.shape[0]), '-x')
	gcf().autofmt_xdate()
	print("Content-type: image/png\n")
	savefig(sys.stdout, format="png")

def GraphPlayerCount(form):
	level = 0 if not form.has_key("level") else int(float(form["level"].value))
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	query = "SELECT MIN(created)/1000, level, nickname FROM players WHERE nickname != 'nemo' AND level >= ? GROUP BY nickname"
	args = [level]
	c.execute(query, args)
	results = asarray(c.fetchall())
	if results.size == 0:
		print("Content-type: text/plain\n\nNo data\n")
		conn.close()
		return
	x = asarray([datetime.datetime.fromtimestamp(int(float(d))) for d in results[:,0]])
	x.sort()
	y = arange(len(x))

	title("Players")
	xlabel("Date")
	ylabel("Count")
	plot(x, y, '-x')
	gcf().autofmt_xdate()
	print("Content-type: image/png\n")
	savefig(sys.stdout, format="png")
	conn.close()

def GraphEventLocations(form):
	level = None if not form.has_key("level") else int(float(form["level"].value))
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	query = "SELECT x,y FROM stats WHERE type LIKE '%Kill%'"
	if type(level) == int:
		query += " AND level = ?"
		args = [level]
	else:
		args = []
	c.execute(query, args)
	results = asarray(c.fetchall())
	if results.size == 0:
		print("Content-type: text/plain\n\nNo data\n")
		conn.close()
		return
	x = asarray([float(d) for d in results[:,0]])
	y = asarray([float(d) for d in results[:,1]])
	xy = vstack([x,y])
	z = gaussian_kde(xy)(xy)
	idx = z.argsort()
	x,y,z = x[idx], y[idx], z[idx]

	scatter(x,y,c=z,edgecolor='')
	xlim([-1,1])
	ylim([-1,1])
	print("Content-type: image/png\n")
	savefig(sys.stdout, format="png")
	conn.close()


def GraphLevelAttempts(form):
	level = 1 if not form.has_key("level") else int(float(form["level"].value))
	player = None if not form.has_key("player") else form["player"].value
	target = [0,194,150,208,165,0][level]

	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	args = [level]
	query = "SELECT runtime FROM stats WHERE level = ?"
	if player:
		query += " AND identity = ?"
		args += [player]
	c.execute(query, args)
	data = asarray(map(lambda e : e[0]/1e3, c.fetchall()))
	if len(data) == 0:
		print("Conent-type: text/plain\n")
		print("No data for level %d" % level)
		return
	
	m = mean(data)
	title("Level %d Attempts" % (level,))
	xlabel("Time (s)")
	ylabel("Attempts (total: %d)" % len(data))
	width = len(data)/max(1,(data.max()-data.min()))
	nBins = 40#int(50/width)
	a, b, c = hist(data,bins=nBins, color="green", alpha=0.5, edgecolor="darkgreen")
	axvline(x=m,color='darkred',ls='-');
	text(m+2,max(a),"mean = %d s"%m, color="darkred", rotation=270)
	axvline(x=target,color="darkblue")

	text(target+2,max(a), "TARGET = %d s" %target, color="darkblue", rotation=270)

	print("Content-type: image/png\n")
	savefig(sys.stdout, format="png")
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
		"last" : LastPlayer,
		"attempts" : GraphLevelAttempts,
		"playercount" : GraphPlayerCount,
		"accesslog" : GraphAccesses,
		"accessmap" : GraphAccessesMap,
		"deathloc" : GraphEventLocations
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


