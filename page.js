function SetCookie(cname,cvalue,exdays)
{
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

var adsShown = (GetCookie("adblock") == "false"); 
function HttpGet(theUrl, callback)
{
	var xmlHttp = null;

	xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", theUrl, true);
	xmlHttp.send( null );
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
		{
			callback(xmlHttp.responseText);
		}
	}
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

var adIds = {"leftPanel" : null, "rightPanel" : null};
var initPanels = false;
var initOnce = false;

function InitPage()
{
	var w = parseInt(window.innerWidth);
	var h = parseInt(window.innerHeight);
	var minW = parseInt(document.getElementById("middlePanel").style.width.replace("px",""));

	var adWidth = (w/2 - 6*minW/10);

	var hideads = document.getElementById("hideads");

	for (var a in adIds)
	{
		if (!adIds[a])
			adIds[a] = document.getElementById(a);
		adIds[a].style.display = (adsShown) ? "block" : "none";
		if (adsShown)
		{
			adIds[a].style.width = ""+adWidth+"px";
			if (adWidth <= 0)
			{
				adIds[a].style.display = "none";
				hideads.color = "transparent"; //hideads.onclick = function() {};
			}
			else
			{
				hideads.color = "black"; //hideads.onclick = HideAds;
			}
		}
			
	}

	if (!initOnce)
	{
		initOnce = true;
		if (typeof window.ontouchstart !== "undefined")
		{
			document.getElementById("touchBar").style.display = "block";
			var l = document.getElementById("touchLeft");
			var r = document.getElementById("touchRight");
			var u = document.getElementById("touchUp");
			var d = document.getElementById("touchDown");
			l.addEventListener("touchstart", function(event) {absorbEvent_(event); keysPressed[37] = true}, false);
			l.addEventListener("touchend", function(event) {absorbEvent_(event); keysPressed[37] = false}, false);
			r.addEventListener("touchstart", function(event) {absorbEvent_(event); keysPressed[39] = true}, false);
			r.addEventListener("touchend", function(event) {absorbEvent_(event); keysPressed[39] = false}, false);
			u.addEventListener("touchstart", function(event) {absorbEvent_(event); keysPressed[38] = true}, false);
			u.addEventListener("touchend", function(event) {absorbEvent_(event); keysPressed[38] = false}, false);
			d.addEventListener("touchstart", function(event) {absorbEvent_(event); keysPressed[40] = true}, false);
			d.addEventListener("touchend", function(event) {absorbEvent_(event); keysPressed[40] = false}, false);

		}
		else
			document.getElementById("controls").style.display = "block";
	}

	if (!initPanels && adsShown)
	{
		HttpGet("leftPanel.html", function(response) {adIds["leftPanel"].innerHTML = response;});
		HttpGet("rightPanel.html", function(response) {adIds["rightPanel"].innerHTML = response;});
		initPanels = true;
	}

	document.getElementById("hideads").innerHTML = (adsShown) ? "[Hide Advertisments]" : "[Show Advertisements]";
	document.getElementById("statusBar").style.display = (h > 520) ? "block" : "none";
	document.getElementById("infoBar").style.display = (h > 520) ? "block" : "none";
}

function UpdateHighScore()
{
	var durations = {
		1 : 194,
		2 : 150
	};
	HttpGet("view.py?query=topscore&level="+level, function(response) {
		document.getElementById("highScore").innerHTML = (""+(+response/1000)).toHHMMSS() + "/"+ (""+durations[level]).toHHMMSS();
	});
}

function HideAds()
{
	if (adsShown)
	{
		if (GetCookie("adblock") == "")
		{
			alert("Fair enough! I don't like Ads either!\nThey won't bother you again.\n\nBy the way, have you heard of Ad Block?\nhttp://google.com#q=ad+block");
		}
		SetCookie("adblock","true",3650);
		adsShown = false;
	}
	else
	{
		adsShown = (GetCookie("adblock") != "" || confirm("Wait what? You want to see ads?"));
		if (adsShown)
			SetCookie("adblock", "false",3650);
		else
			SetCookie("adblock", "true",3650);
	}
	InitPage();
}

SetLevel = (function() {
	var _SetLevel = SetLevel;
	return function() {
		_SetLevel.apply(this, arguments);
		UpdateHighScore();	
	};

})();
