#!/usr/bin/python

"""
	HtR handshake - if someone accepts the cookie they will GET this and set their nickname 
"""

import sys
import os
import cgi
import Cookie
import datetime
import hashlib
import sqlite3
import re

import helpers

def main(argv):
	identity = helpers.GetIdentity()
	nickname = helpers.GetNickname()
	
	
	if identity == "<anonymous>" or helpers.PlayerExists(identity) == False:
		return 0

	form = cgi.FieldStorage()
	timestamp = helpers.FloatNow();
	if "nickname" in form:
		nickname = form["nickname"].value
	print("Content-type: text/plain\r\n\r\n")

	conn = sqlite3.connect("stats.db")
	c = conn.cursor()
	c.execute("UPDATE players SET nickname=? WHERE identity=?", (nickname,identity))
	conn.commit()
	conn.close()
	return 0

if __name__ == "__main__":
	sys.exit(main(sys.argv))

