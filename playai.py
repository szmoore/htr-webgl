#!/usr/bin/python

import sys
import os
import cgi
#import cgitb
#cgitb.enable()


HTML_TEMPLATE = """
	<html>
		<head>
			<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
			<meta content="utf-8" http-equiv="encoding">
			<title>HtR AI Upload</title>
		</head>
		<body>
			<h1>HtR Customised AI</h1>
			<p> You can upload a function that will automatically play <a href="index.html">HtR</a> here. </p>
			<p></p>
			<p><b>Upload Text:</b></p>
			<textarea rows="20" cols="60" name="script" form="form">
/**
 * Implement this function to make a customised Humphrey
 * player - {x, y, vx, vy, ...} - Where the player is
 * foxes - [{x, y, vx, vy, ...}, ...] - All the foxes
 * boxes - [{x, y, vx, vy, ...}, ...] - All the boxes
 * Return true or false for {up, down, left, right}
 */
function AIStep(player, foxes, boxes)
{
    /** Sample - randomly press keys **/	
    var result = {
        up : (Math.random() > 0.5),
        down : (Math.random() > 0.5),
        left : (Math.random() > 0.5),
        right : (Math.random() > 0.5)
    };
    return result;
}</textarea>
			<form action="%(SCRIPT_NAME)s" method="POST"" id="form" enctype="multipart/form-data">
				<p> <b>Upload a File:</b> <input type="file" name="file"> <button type="reset">Reset</button> </p>
				<p> (Above text will be ignored if file is supplied)</p>
				<p> Or don't be lazy and just clone the <a href="https://github.com/szmoore/htr-webgl">GitHub repo</a></p>
				<input type="submit"> 
			</form>
			
		</body>
	</html>
"""

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


