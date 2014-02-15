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
					


