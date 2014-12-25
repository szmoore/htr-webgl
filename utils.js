/**
 * @file utils.js
 * @brief Miscellaneous utilities
 */

// Deal with lack of Function.prototype.bind
Function.prototype.bind=Function.prototype.bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}var a=Array.prototype.slice,f=a.call(arguments,1),e=this,c=function(){},d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};
 
 
function SetCookie(cname,cvalue,exdays)
{
	if (!exdays)
		exdays = 3650;
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function GetCookie(cname)
{
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++)
	{
		var c = ca[i].trim();
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
}  

function HttpGet(theUrl, callback)
{
	var xmlHttp = null;

	xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", theUrl, true);
	xmlHttp.send( null );
	if (typeof(callback) === "function")
	{
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			{
				callback(xmlHttp.responseText);
			}
		}
	}
}

function HttpPost(theUrl, post, callback)
{
	// Send results to the stat collecting script
	var xmlHttp = new XMLHttpRequest(); // IE<7 won't WebGL anyway, screw compatibility
		
	if (typeof(callback) === "function")
	{
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			{
				callback(xmlHttp.responseText);
			}
		}
	}
	else
	{
		xmlHttp.onreadystatechange = function() {}
	}
	
	var request = "";
	for (var p in post)
	{
		if (request) request += "&";
		request += String(p) + "="+String(post[p]);
	}
	xmlHttp.open("POST", theUrl, true); //POST just because its BIG
	xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlHttp.setRequestHeader("Content-length", request.length);
	xmlHttp.setRequestHeader("Connection", "close");
	xmlHttp.send(request);		
}


// Hacks to stop Android from breaking with long clicks
// http://stackoverflow.com/questions/3413683/disabling-the-context-menu-on-long-taps-on-android
function absorbEvent_(event)
{
	var e = event || window.event;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
	return false;
}

 // Le sigh date formatting
String.prototype.toHHMMSS = function () 
{
	var sec_num = parseInt(this, 10); // don't forget the second param
	var hours   = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours   < 10) {hours   = "0"+hours;}
	if (minutes < 10) {minutes = "0"+minutes;}
	if (seconds < 10) {seconds = "0"+seconds;}
	var time    = hours+':'+minutes+':'+seconds;
	return time;
}

