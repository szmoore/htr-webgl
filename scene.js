/**
 * Humphrey The Rabbit - In glorious WebGL Form
 *
 * tl;dr A game where you play as a Rabbit who must avoid Foxes and Boxes.
 *
 * History that is only of significance to the author:
 * Humphrey The Rabbit was originally written using pygame (Python 2.7) in 2012 whilst attempting to improve my Python after years of trying to ignore its existance.
 * Now I am attempting to improve my JavaScript after years of trying to ignore its existance, so its time to reinvent some wheels and rewrite Humphrey The Rabbit.
 * One day it'll probably get rewritten in C++ where it belongs.
 *
 * Credits:
 * Sprites are from Biots.
 * Jeremy Hughes sang to the theme3 music
 * David Gow came up with some of the advertisments
 *
 * Sam Moore, 2014
 *
 * Update: July 14th - Well this project seems to keep escalating...
 */

var g_game;

/**
 * The main function
 */
function main(game)
{


	//window.onerror = function(e) {alert(e);}
	var audio = document.getElementById("theme");
	// Deal with browsers that can't play audio
	if (typeof(audio.pause) !== "function" || typeof(audio.play) !== "function")
	{
		audio = undefined;
	}

	var canvas = document.getElementById("glcanvas");
	if (typeof(game) === 'undefined') {
		game = new Game(canvas, audio, document, false);
	}
	g_game = game; // hack for legacy code

	if (g_isMobile && g_game.settings.displayStatusBar !== true) {
		g_game.settings.displayStatusBar = true;
		g_game.SaveSettings();
		g_game.statusBar.hidden = false;
	}

	InitPage(game);

	var welcome_message = "Humphrey The Rabbit";

	//christmas mode and romantic mode setting
	var today = new Date();
	// Javascript's Date class' months are zero indexed. But the days are one indexed.
	// Conshmistancy
	if (today.getMonth() == 11 && today.getDate() > 23 && today.getDate() < 27)
	{
		game.xmasMode = true;
		welcome_message = "HTR: Xmas edition!";
	}
	else if (today.getMonth() == 1 && today.getDate() == 14)
	{
		game.romanticMode = true;
		welcome_message += "\nLove: The Battlefield";
	}


	document.onkeydown = function(event) {game.KeyDown(event)};
	document.onkeyup = function(event) {game.KeyUp(event)};

	document.ontouchmove = function(event) {event.preventDefault();};
	document.ontouchstart = function(event) {
		//alert("Document ontouchstart");
		var audio = document.getElementById("theme");
		// Deal with browsers that can't play audio
		if (typeof(audio.pause) !== "function" || typeof(audio.play) !== "function")
		{
			audio = undefined;
		}
		if (audio && game.running) {
			audio.play().catch(err => {
				// stupid browsers.
			});
		}

		if (g_isMobile && document.fullscreenElement === null) {
			fullScreen();
			setTimeout(() => {
				if (document.fullscreenElement) {
					InitPage(game);
				}
			},500)
		}
	}


	canvas.addEventListener("touchstart", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchmove", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchenter", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchend", function(event) {game.TouchUp(event.changedTouches[0])});
	canvas.addEventListener("touchleave", function(event) {game.TouchUp(event.changedTouches[0])});
	canvas.addEventListener("mousedown", function(event) {game.MouseDown(event)});
	canvas.addEventListener("mousemove", function(event) {game.MouseMove(event)});
	canvas.addEventListener("mouseup", function(event) {game.MouseUp(event)});


	var settings = game.settings;

	var startLevel = Math.min(1,settings.maxLevel || 1);

	// Old prompt based level skipping
	/*
	if (startLevel && startLevel >= 2)
	{
		startLevel = prompt("Start at level (1-"+String(g_maxLevelCookie)+")?", String(g_maxLevelCookie));
		if (isNaN(startLevel))
			startLevel = 0;
		startLevel = Math.max(startLevel,0);
		startLevel = Math.min(startLevel, g_maxLevelCookie);
		// It's not like they'll edit their cookies or anything.
		//   Right?
	}
	*/

	game.splashPerformance = (new Date()).getTime();
	var s = function(startLevel) {
		this.AddTimeout("Start", this.Start.bind(this, startLevel),2000)
		this.splashPerformance = (new Date()).getTime() - this.splashPerformance;
		//alert("splash took " + String(this.splashPerformance)+"ms");
	}.bind(game, startLevel);
	game.canvas.SplashScreen("data/rabbit/drawing2.svg", welcome_message, [0.9,1.0,0.9,1],s);
}
