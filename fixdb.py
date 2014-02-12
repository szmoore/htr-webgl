#!/usr/bin/python

import helpers
import os
import sqlite3

if __name__ == "__main__":
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
					


