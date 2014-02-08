#!/usr/bin/python

import sys
import os
import cgi
#import cgitb
#cgitb.enable()


def print_html_form():
	print "content-type:text/html\n"
	print HTML_TEMPLATE % {"SCRIPT_NAME" : os.environ["SCRIPT_NAME"]}

if __name__ == "__main__":
	form = cgi.FieldStorage()
	if (not form.has_key("script") and not form.has_key("file")):
		print_html_form()
		sys.exit(0)
	print("Content-type:text/html\n")

	script = "" 
	if form.has_key("file") and form["file"].filename:
		script = form["file"].value

	if script == "":
		script = form["script"].value
	if script == "":
		print_html_form()
		print("<p><b><i>Nothing uploaded</i></b></p>")
		sys.exit(0)

	f = open("index.html")
	for line in f:
		print(line)

	print("<script type=\"text/javascript\">")
	print(script)
	print("</script>")

	print("<p align=center><a href=\"playai.py\">Upload AI</a></p>")

	f.close()


