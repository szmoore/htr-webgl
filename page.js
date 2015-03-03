function InitPage()
{	
	// Browsers on phones do *wierd* things with screen.width, innerWidth, screen.availWidth etc
	var screenWidth = Math.min(window.innerWidth, window.screen.width);
	var screenHeight = Math.min(window.innerHeight, window.screen.height);
	var width = Math.min(0.9*screenWidth, 640);
	var height = Math.min(screenHeight-64, 800);

	if (typeof(g_game) !== "undefined" && typeof(g_game.canvas) != "undefined")
	{
		g_game.canvas.width = width;
		g_game.canvas.height = height;
	}

		
	var touchBar = document.getElementById("touchBar");
	if (typeof(touchBar) !== "undefined" && touchBar.style.display === "block")
	{
		height -= 96;
		/*
		var touchLeft = document.getElementById("touchLeft");	
		touchLeft.addEventListener("mousedown", function(ev) {g_game.KeyDown({keyCode : 37}); console.log("Foey");}, false);
		touchLeft.addEventListener("mouseup", function(ev){g_game.KeyUp({keyCode : 37})});
		var touchRight = document.getElementById("touchRight");
		touchRight.addEventListener("mousedown", function(ev){g_game.KeyDown({keyCode : 39})});
		touchRight.addEventListener("mouseup", function(ev){g_game.KeyUp({keyCode : 39})});
		var touchUp = document.getElementById("touchUp");
		touchUp.addEventListener("mousedown", function(ev){g_game.KeyDown({keyCode : 38})});
		touchUp.addEventListener("mouseup", function(ev){g_game.KeyUp({keyCode : 38})});
		
		var touchDown = document.getElementById("touchDown");
		touchDown.addEventListener("mousedown", function(ev){g_game.KeyDown({keyCode : 40})});
		touchDown.addEventListener("mouseup", function(ev){g_game.KeyUp({keyCode : 40})});
		*/
	}
	
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
