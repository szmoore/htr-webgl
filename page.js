function InitPage()
{	
	// Browsers on phones do *wierd* things with screen.width, innerWidth, screen.availWidth etc
	var screenWidth = Math.min(window.innerWidth, window.screen.width);
	var screenHeight = Math.min(window.innerHeight, window.screen.height);
	var width = Math.min(0.9*screenWidth, 640);
	var height = Math.min(screenHeight-64, 800);

		
	var touchBar = document.getElementById("touchBar");
	if (typeof(touchBar) !== "undefined" && touchBar.style.display === "block")
	{

		absorbEvent = function (e) {
			e.preventDefault();
			e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
		}
	
		height -= 1*48;
		var touchLeft = document.getElementById("touchLeft");	
		touchLeft.ontouchstart = function (e) {absorbEvent(e); g_game.KeyDown({keyCode:37});};
		touchLeft.ontouchend = function (e) {absorbEvent(e); g_game.KeyUp({keyCode:37});}
		touchLeft.ontouchmove = absorbEvent;
		touchLeft.ontouchcancel = touchLeft.ontouchend;;
		var touchRight = document.getElementById("touchRight");
		touchRight.ontouchstart = function (e) {absorbEvent(e); g_game.KeyDown({keyCode:39});};	
		touchRight.ontouchend = function (e) {absorbEvent(e); g_game.KeyUp({keyCode:39});};
		touchRight.ontouchmove = absorbEvent;
		touchRight.ontouchcancel = touchRight.ontouchend;
		var touchUp = document.getElementById("touchUp");
		touchUp.ontouchstart = function (e) {absorbEvent(e); g_game.KeyDown({keyCode:38});};
		touchUp.ontouchend = function (e) {absorbEvent(e); g_game.KeyUp({keyCode:38});};
		touchUp.ontouchmove = absorbEvent;
		touchUp.ontouchcancel = touchUp.ontouchend;
		var touchDown = document.getElementById("touchDown");
		touchDown.ontouchstart = function(e) {absorbEvent(e); g_game.KeyDown({keyCode:40});};	
		touchDown.ontouchend = function(e) {absorbEvent(e); g_game.KeyUp({keyCode:40});};
		touchDown.ontouchmove = absorbEvent;
		touchDown.ontouchcancel = touchDown.ontouchend;
	
		
	}
	
	var middlePanel = document.getElementById("middlePanel");
	middlePanel.style.width = width;
	
	var canvas = document.getElementById("glcanvas");
	canvas.width = width;
	canvas.height = height;

	if (typeof(g_game) !== "undefined" && typeof(g_game.canvas) != "undefined")
	{
		g_game.canvas.width = width;
		g_game.canvas.height = height;
	}


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
