#!/usr/bin/python

import sys
import os
import cgi
#import cgitb
#cgitb.enable()

# yeah this is horribly inefficient... and terrible
# But I doubt HtR will get high enough load for it to be a problem.



if __name__ == "__main__":
	
	#sys.stderr = open(sys.argv[0]+".err", "w");

	form = cgi.FieldStorage()


	fields = ["death", "x", "y", "start", "runtime", "steps", "foxesSquished", "foxesDazed", "boxesSquished"]

	gotFields = 0 
	for f in fields:
		if form.has_key(f):
			gotFields += 1

	if gotFields == 0:
		#TODO: PLOT instead of spitting back raw data
		print("Content-type: text/plain\n")
		try:
			for line in open("stats.dat", "r"):
				print(line)
		except IOError:
			pass
		#sys.stderr.write("No fields\n")
		sys.exit(0)
	elif gotFields != len(fields):
		print("Content-type: text/plain\n")
		#sys.stderr.write("Wrong number of fields\n");
		sys.exit(0)

	# Someone could just leave their browser on the page not actually playing.
	# So only record games >10s
	elif int(form["runtime"].value) < 10000:

		print("Content-type: text/plain\n")
		sys.exit(0)

	try:
		try:
			counterFile = open("stats.count", "r");
			count = int(counterFile.read())
			counterFile.close()
		except IOError, TypeError:
			count = 0
		counterFile = open("stats.count", "w");
		counterFile.write(str(count+1))
		try:
			statsFile = open("stats.dat", "r")
			lines = statsFile.readlines()[-5000:] # Keep at most 5000 lines.
			lines[0] = ("#" + ("\t".join(fields))+"\n")
			statsFile.close()
			#sys.stderr.write("Open existing stats\n");
		except IOError:
			#sys.stderr.write("Open new stats\n");
			lines = ["#" + ("\t".join(fields))+"\n"]

		newRecord = ""
		for f in fields:
			newRecord += str(form[f].value) + "\t"
		newRecord += "\n"
		# Might be unethical to do this. Motivation was for geographic profiling of who plays it.
		#newRecord += str(os.environ["REMOTE_ADDR"]) + "\n"

		lines += [newRecord]

		statsFile = open("stats.dat", "w")
		for l in lines:
			statsFile.write(l)
		statsFile.close()
		#sys.stderr.write("Done\n");

	except IOError:
		pass

	print("Content-type: text/plain\n")
	sys.exit(0)
