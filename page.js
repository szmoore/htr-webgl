
function InitPage()
{	
	var width = Math.min(0.9*window.screen.width, 640);
	var height = Math.min(0.7*window.screen.height, 480);
	
	var canvas = document.getElementById("glcanvas");
	canvas.width = width;
	canvas.height = height;
	
}
