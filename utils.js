/**
 * @file utils.js
 * @brief Miscellaneous utilities
 */

// Deal with lack of Function.prototype.bind
Function.prototype.bind=Function.prototype.bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}var a=Array.prototype.slice,f=a.call(arguments,1),e=this,c=function(){},d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};


var cookies = {};

function SetCookie(cname,cvalue,exdays)
{
	if (!exdays) {
		if (cvalue === "") {
			exdays = -1;
		} else {
			exdays = 3650;
		}
	}
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
	if (exdays > 0) {
		cookies[cname] = cvalue;
	} else {
		delete cookies[cname];
	}
}

function GetCookie(cname)
{
	var name = cname + "=";
	var ca = document.cookie.split(';');
	var cvalue = "";
	for(var i=0; i<ca.length; i++)
	{
		var c = ca[i].trim();
		if (c.indexOf(name)==0) {
			cvalue = c.substring(name.length,c.length);
		}
	}
	if (cvalue !== "") {
		cookies[cname] = cvalue;
	}
	return cvalue;
}

function ClearCookie(cname) {
	// By setting expiry to a date in the past, we clear it
	console.debug("Clear cookie", cname)
	SetCookie(cname, "",-1); 
}

function ClearAllCookies() {
	Object.values(cookies).filter(element => typeof(element) === "string")
	.forEach(cname => ClearCookie(cname));
}

// 2014: Javascript is a Pyramid Scheme
function HttpGet_Unpromised(theUrl, callback, errorCallback)
{
	var xmlHttp = null;

	xmlHttp = new XMLHttpRequest();
	console.debug("GET " + theUrl);
	try
	{
		xmlHttp.open( "GET", theUrl, true);
	}
	catch (err)
	{
		console.debug("Error getting url " + theUrl + " : " + err.message);
		if (errorCallback) {
			errorCallback(err);
		}
	}
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

// 2020: Let's use these PROMISING new features
async function HttpGet(theUrl, callback) {
	// Legacy fallback
	if (typeof(callback) !== 'undefined') {
		return HttpGet_Unpromised(theUrl, callback);
	}
	return new Promise((resolve, reject) => HttpGet_Unpromised(theUrl, resolve, reject))
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

// TODO: Remove?
Debug = function(message)
{
	//document.getElementById("debug").innerHTML=message;
}


const directionToKeyCode = {
	Left: 37,
	Right: 39,
	Up: 38,
	Down: 40
};