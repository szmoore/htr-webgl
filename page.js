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
var adIds = {"leftPanel" : null, "rightPanel" : null};

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
	adIds["rightPanel"].innerHTML = "<iframe src=\"right_advert.html\" height=\"500px\" width=\""+adWidth+"px\" frameBorder=\"0\"></iframe>";

	document.getElementById("hideads").innerHTML = (adsShown) ? "[Hide Advertisments]" : "[Show Advertisements]";
	document.getElementById("statusBar").style.display = (h > 520) ? "block" : "none";
	document.getElementById("infoBar").style.display = (h > 520) ? "block" : "none";

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
