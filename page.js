function InitPage()
{	
	// Browsers on phones do *wierd* things with screen.width, innerWidth, screen.availWidth etc
	var screenWidth = Math.min(window.innerWidth, window.screen.width);
	var screenHeight = Math.min(window.innerHeight, window.screen.height);
	var width = Math.min(0.9*screenWidth, 640);
	var height = Math.min(screenHeight-64, 800);
	
	var middlePanel = document.getElementById("middlePanel");
	middlePanel.style.width = width;
	
	var canvas = document.getElementById("glcanvas");
	canvas.width = width;
	canvas.height = height;
	
	// The external advertisement
	var banner = document.getElementById("banner");
	if (banner)
	{
		banner.style.height = height;
		banner.style.width = Math.max((0.9*screenWidth - width)/2, 0);
		if (banner.style.width < 50 || GetCookie("adblock"))
			banner.style.display = "none";
		else
			banner.style.display = "block";
	}

	var loading = document.getElementById("loading");
	if (loading)
		loading.parentNode.removeChild(loading);
}
