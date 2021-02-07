var g_isMobile = isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var g_isWebView = isWebView = navigator.userAgent.includes('wv')
var g_usingAdblocker = false;


function fullScreen() {
	const elem = document.documentElement;
	const methods = ["request", "mozRequest", "webkitRequest", "msRequest"].filter(prefix => {
		const functionName = prefix+"FullScreen";
		return elem[functionName];
	})
	return Promise.race(methods.map(prefix => {
		const functionName = prefix+"FullScreen";
		console.log(`Attempting to use ${functionName} to enter fullscreen...`);
		var p = elem[functionName].call(elem);
		console.log(`${functionName}(${elem}) => ${p}`);
		if (p) {
			return p.then(res => console.log(res));
		} else {
			return Promise.resolve();
		}
	}))
}

function CollapseAllDetails() {
	// Collapse all settings panels (once only)
	Object.values(document.getElementsByTagName("details")).forEach(element => {
		element.open = false;
	})
}

function StartGame() {
	CollapseAllDetails();


	document.getElementById("startOnMobile").style.display = "none";
	document.getElementById("enableTouchBar").checked = (g_isMobile || g_isWebView);

	if (g_isWebView) {
		console.debug("Hello, Android!");
	}

	if (g_isMobile && !g_isWebView && document.fullscreenElement == null) {
		console.debug('Not in fullscreen...');
		fullScreen()
		setTimeout(() => {
			if (document.fullscreenElement == null) {
				console.log('Still not in fullscreen, try again');
				document.getElementById("startOnMobile").style.display = "block";
			} else {
				StartGame();
			}
		},500);
	} else {
		console.log('Screen initialised, running main()');
		main();
		if (g_game.settings.openSettings) {
			g_game.ToggleSettings();
		}
	}
}

function InitPage(game)
{
	if (g_isMobile && !g_isWebView && document.fullscreenElement == null) {
		console.error("Cannot play the game on a mobile device unless you are in fullscreen");
		return;
	}

	// Look how smart I am, detecting (some) adblockers
	g_usingAdblocker = document.getElementById("br0whyuh8ad$$$s") ? false : true;
	if (g_usingAdblocker) {
		console.debug("External adblocker detected");
		console.debug("That's cool, it's not like anyone pays me for them anyway");
	}

	document.getElementById("gameAndUI").style.display = "block";
	document.getElementById("startOnMobile").style.display = "none";





	// Browsers on phones do *wierd* things with screen.width, innerWidth, screen.availWidth etc
	var screenWidth = Math.min(window.innerWidth, window.screen.width);
	var screenHeight = Math.min(window.innerHeight, window.screen.height);
	var width = Math.min(0.9*screenWidth, 640);
	var height = Math.min(screenHeight-64, 800);

	var touchBar = document.getElementById("touchBar");
	touchBar.style.display = game.settings.enableTouchBar ? "block" : "none";
	if (touchBar.style.display == "block") {
		height -= 48;
	}
	touchBar.style.width = width;

	if (touchBar) {
		absorbEvent = function (e) {
			e.preventDefault();
			e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
		};



		["Left", "Right", "Up", "Down"].forEach(direction => {
			const id = "touch"+direction;
			var element = document.getElementById(id);
			element.ontouchmove = absorbEvent;
			element.ontouchcancel = element.ontouchend;
			element.oncontextmenu = absorbEvent;

			element.ontouchstart = event => {
				console.debug("Pressed", direction);
				absorbEvent(event);
				g_game.KeyDown({keyCode: directionToKeyCode[direction]});
			}
			element.ontouchend = event => {
				console.debug("Released", direction);
				absorbEvent(event);
				g_game.KeyUp({keyCode: directionToKeyCode[direction]});
			}

			element.onmousedown = element.ontouchstart;
			element.onmouseup = element.ontouchend;

		})
	}

	var middlePanel = document.getElementById("middlePanel");
	middlePanel.style.width = width;

	var canvas = document.getElementById("glcanvas");
	canvas.width = width;
	canvas.height = height;
	console.log('Set canvas height,width to', canvas.height, canvas.width)

	if (typeof(game) !== "undefined" && typeof(game.canvas) != "undefined")
	{
		game.canvas.width = width;
		game.canvas.height = height;
		console.log('Set game canvas height,width to', game.canvas.height, game.canvas.width);
	}




	// The external advertisement
	var banner = document.getElementById("banner");
	if (banner)
	{
		banner.style.height = height;
		banner.style.width = Math.max((0.9*screenWidth - width)/2, 0);
		// Disabled since adblock cookie is removed and we don't have third party ads anymore now
		// if (banner.style.width < 50 || GetCookie("adblock"))
			banner.style.display = "none";
		// else
		//	banner.style.display = "block";
	}

	var loading = document.getElementById("loading");
	if (loading)
		loading.parentNode.removeChild(loading);

}
