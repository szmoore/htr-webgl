
function InitPage()
{	
	var width = Math.min(0.9*window.screen.width, 640);
	var height = Math.min(0.7*window.screen.height, Infinity);
	
	var canvas = document.getElementById("glcanvas");
	canvas.width = width;
	canvas.height = height;
	var loading = document.getElementById("loading");
	if (loading)
		loading.parentNode.removeChild(loading);
}
