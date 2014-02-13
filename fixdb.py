#!/usr/bin/python

import helpers
import os
import sqlite3

if __name__ == "__main__":

	# Fix misordered rows
	# When I added the extra columns I was putting things in the wrong order.
	# Correct order: boxesSquished, foxesDazed, identity, death, level, start, steps, foxesSquished, x, y, runtime
	# Bad order: 
	badOrder = ["identity", "start", "runtime", "steps", "death", "x","y", "foxesSquished", "foxesDazed", "boxesSquished", "level"]
	# (I *thought* that was the order but it changed because python dictionaries are alphabetically ordered and I populated the columns from a dict -_-)
	os.system("cp stats.db stats.bk")
	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("SELECT * FROM stats WHERE foxesDazed > 1e12") # These rows have "start" where "foxesDazed" sould be.
	bad = c.fetchall()
	for row in bad:
		c.execute("DELETE FROM stats WHERE boxesSquished=?",(row[0],))
		c.execute("INSERT INTO stats("+",".join([str(f) for f in badOrder])+") VALUES ("+",".join(["?" for _ in badOrder])+")", row)
	conn.commit()
	conn.close()



	"""
	os.system("cp stats.db stats.bk")
	try:
		helpers.FixDB()
	except Exception, e:
		print(str(e))
		os.system("mv stats.bk stats.db")
	else:
		#Update with new player info
		print("Guessing best player stats")
		conn = sqlite3.connect("stats.db")
		c = conn.cursor()
		c.execute("SELECT identity, MIN(start), MAX(start), MAX(level) FROM stats GROUP BY identity")
		idents = c.fetchall()
		for i in idents:
			if i[0] == "<anonymous>":
				continue
			c.execute("SELECT * FROM players WHERE identity=?", (i[0],))
			match = c.fetchall()
			if len(match) <= 0:
				print("INSERT %s" % str(i))
				c.execute("INSERT INTO players(identity,created,lastContact,level) VALUES (?,?,?,?)",i)
		conn.commit()
		conn.close()
	"""
					


