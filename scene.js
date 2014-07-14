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
 *
 * Sam Moore, 2014
 * 
 * Update: July 14th - Well this project seems to keep escalating...
 */

var game;
var startLevel = 0;
/**
 * The main function
 */
function main() 
{
	var audio = document.getElementById("theme");
	var canvas = document.getElementById("glcanvas");
	game = new Game(canvas, audio, document);
	
	document.onkeydown = function(event) {game.KeyDown(event)};
	document.onkeyup = function(event) {game.KeyUp(event)};
	
	
	canvas.addEventListener("touchstart", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchmove", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchenter", function(event) {game.TouchDown(event.changedTouches[0])});
	canvas.addEventListener("touchend", function(event) {game.TouchUp(event.changedTouches[0])});
	canvas.addEventListener("touchleave", function(event) {game.TouchUp(event.changedTouches[0])});
	canvas.addEventListener("mousedown", function(event) {game.MouseDown(event)});
	canvas.addEventListener("mousemove", function(event) {game.MouseMove(event)});
	canvas.addEventListener("mouseup", function(event) {game.MouseUp(event)});
	
	game.splashPerformance = (new Date()).getTime();
	var s = function(startLevel) {
		this.AddTimeout("Start", this.Start.bind(this, startLevel),2000)
		this.splashPerformance = (new Date()).getTime() - this.splashPerformance;
		//alert("splash took " + String(this.splashPerformance)+"ms");
	}.bind(game, startLevel);
	game.canvas.SplashScreen("data/rabbit/drawing2.svg", "Humphrey The Rabbit", [0.9,1.0,0.9,1],s);
}
