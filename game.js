/**
 * @file game.js
 * @brief Represents the game world and all Entities within it
 */
 
/**
 * Wrapper class for pausable timeouts associated with a Game
 */
function Timeout(name, onTimeout, wait, game)
{
	if (game.timeouts[name])
	{
		game.timeouts[name].Pause();
		delete game.timeouts[name];
	}
	
	this.name = name;
	this.onTimeout = onTimeout;
	this.id = setTimeout(function(game) {
		this.onTimeout(); 
		delete game.timeouts[this.name]}.bind(this,game), wait);
	game.timeouts[this.name] = this;

	this.wait = wait;
	this.start = (new Date()).getTime();
	this.running = true;
	this.game = game;
}
/**
 * Pause timeout
 */
Timeout.prototype.Pause = function()
{
	if (!this.running)
		return;
	this.running = false;
	this.wait -= (new Date()).getTime() - this.start;
	clearTimeout(this.id);
	
	//console.log("Pause <" + this.name + "> timeout with " + String(this.wait) + "ms left");
	this.wait = Math.max(this.wait, 0);
	
}

/**
 * Resume timeout
 */
Timeout.prototype.Resume = function()
{
	if (this.running)
		return;

	this.running = true;
	//console.log("Timeout <" + this.name + "> resumed with " + String(this.wait) + " ms remaining");
	this.id = setTimeout(function(game) {
		this.onTimeout(); 
		delete game.timeouts[this.name]}.bind(this,this.game), this.wait);
}
Timeout.prototype.constructor = Timeout;


/**
 * Game class
 * @param canvas - HTML5 canvas element to render into
 * @param audio - HTML5 audio element to use for sound
 * @param document - The webpage DOM
 */
function Game(canvas, audio, document, multiplayer)
{
	Debug("Construct Game");
	this.document = document;
	this.audio = audio;
	this.level = -1;
	// If true, "advertising" spash screens are shown every time a level starts/restarts
	this.enableAdverts = true; // Will be set to false if necessary in main()
	this.ChooseAdvert(); // First call will get the list of adverts
	
	// Hacks to keep track of level durations
	// Needed because some devices won't play audio so we have to check the time ourselves
	//  instead of using a "ended" event listener.
	// Level 0 is the tutorial and doesn't end at a specified time depending on player speed
	this.levelDurations = [null, 198000,150000,210000,165000,2480000];
	this.backgrounds = ["data/backgrounds/forest1_cropped.jpg", "data/backgrounds/flowers2.jpg", "data/backgrounds/forest1_cropped.jpg", "data/backgrounds/forest1_cropped.jpg", "data/backgrounds/forest1_cropped.jpg"]
	
	this.localTime = new Date();
	this.canvas = new Canvas(canvas); // Construct Canvas class on the HTML5 canvas
	if (this.spriteCollisions)
		this.canvas.prepareSpriteCollisions = true; // unused will probably break things
		
	this.gravity = [0, -1]; // gravity!
	this.stepRate = 20; // Time we would ideally have between steps in ms (lol setTimeout)
	
	this.timeouts = {}; // Timeouts
	
	
	
	this.running = false;
	this.runTime = 0;
	this.entities = [];
	this.playedTutorial = false;
	
	this.webSockets = [];
	this.multiplayer = multiplayer;
	if (this.multiplayer)
	{
		Debug("Open WebSocket Connection");
		var con = new WebSocket("ws://localhost:7681", "ws");
		con.onopen = function() {console.log("Connected to WebSocket")}
		con.onclose = function(e) {console.log("Closed WebSocket sesame"); console.log(e.reason);}
		con.onerror = function(e) {console.log("WebSocket Error"); console.log(e); console.log(String(e));}
		con.onmessage = function(e) {this.MultiplayerSync(e.data);}.bind(this); // didn't want to use a global here :(
		this.webSockets.push(con);
	}
	Debug("Constructed Game");
}


Game.prototype.AddTimeout = function(name, onTimeout, wait)
{
	if (!this.timeouts)
		this.timeouts = {};
	new Timeout(name, onTimeout, wait, this);
}

Game.prototype.Pause = function(message,image	, colour)
{
	delete this.stepTime;
	this.running = false;
	for (var t in this.timeouts)
	{
		this.timeouts[t].Pause();
	}
	if (this.audio && typeof(this.audio.pause) === "function")
		this.audio.pause();
		
	this.Draw();
	this.UpdateDOM(this.player);
	
	if (typeof(image) === "undefined")
		image = "data/rabbit/drawing2.svg";
	if (typeof(colour) === "undefined")
		colour = [1,1,1,1];
	this.canvas.SplashScreen(image, message, colour);
}


Game.prototype.Resume = function()
{
	if (this.running)
		return;
		
	this.canvas.cancelSplash = true;
		
	this.UpdateDOM(this.player);
	

	this.running = true;
	
	for (var t in this.timeouts)
	{
		this.timeouts[t].Resume();
	}
	
	if (this.audio)
		this.audio.play();
		
		
	if (typeof(this.timeouts["MainLoop"]) === "undefined")
		this.MainLoop();
		
	if (this.level > 0)
	{
		if (typeof(this.timeouts["AddEnemy"]) === "undefined")
			this.AddTimeout("AddEnemy", function() {this.AddEnemy()}.bind(this), this.stepRate*600);
		
		if (typeof(this.timeouts["AddCloud"]) === "undefined")
		{
			this.AddTimeout("AddCloud", function() {this.AddCloud()}.bind(this), this.stepRate*(1000 + Math.random()*2000));	
			
		}
		
		
		if (!this.running) 
		{
			this.timeouts["AddCloud"].Pause();	
			this.timeouts["AddEnemy"].Pause();
		}
	}
	this.canvas.Clear(this.GetColour());
	

}

Game.prototype.Start = function(level)
{
	this.level = level-1;
	this.NextLevel();
}

Game.prototype.SetLevel = function(level)
{
	Debug("Set level " + String(level));
	this.level = Math.min(level,5);
	
	// hooray globals
	if (typeof(g_maxLevelCookie) != "undefined")
	{
		if (g_maxLevelCookie < this.level)
		{
			g_maxLevelCookie = this.level;
			SetCookie("maxLevel", g_maxLevelCookie);
		}
	}
		
	this.spawnedEnemies = 0;
	if (this.audio)
	{
		if (this.romanticMode === true)
			this.audio.src = "data/romanticmode.ogg";
		else if (this.xmasMode === true && this.level === 1)
			this.audio.src = "data/xmasmode.ogg";
		else
			this.audio.src = "data/theme"+this.level+".ogg";
		this.audio.load();
		this.audio.pause();
		//this.audio.play();
		
		//this.levelDurations[this.level] = this.audio.duration*1000;
	}
	
	delete this.stepTime;
	this.runTime = 0;
	this.stepCount = 0;
	this.keyState = [];
	
	this.entities = [];
	for (var t in this.timeouts)
	{

		this.timeouts[t].Pause();
		delete this.timeouts[t];
	}
	this.timeouts = {};
	this.entityCount = {};
	this.deathCount = {};

	// Add the walls
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[Infinity, -1]}, "Floor")); // bottom
	this.AddEntity(new Wall({min: [-Infinity,0.8], max:[Infinity,Infinity]}, "Roof")); // top
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[-1, Infinity]})); // left 
	this.AddEntity(new Wall({min: [1,-Infinity], max:[Infinity, Infinity]})); // right
	
	// Add the player
	this.player = new Player([0,0],[0,0],this.gravity, this.canvas, "data/rabbit");
	this.AddEntity(this.player);
	
	if (this.multiplayer && this.playerCount && this.playerCount > 1)
	{
		this.multiplayer = []
		this.multiplayer[this.playerID] = this.player;
		this.player.playerID = this.playerID;
		
		this.player.position[0] = -(this.player.Width()/2)*this.playerCount + this.player.Width()*this.playerID;
		
		for (var i = 0; i < this.playerCount; ++i)
		{
			if (i == this.playerID) continue;
			var x = -(this.player.Width()/2)*this.playerCount + this.player.Width()*i;
			this.multiplayer[i] = new Player([x, 0], [0,0], this.gravity, this.canvas, "data/rabbit");
			this.multiplayer[i].playerID = i;
			this.AddEntity(this.multiplayer[i]);
		}
	}
	

	/**  level specific code goes below here **/
	
	//TODO: Make NaN and Infinity levels
	for (var i = 0; i < Math.min(this.level*2,6); ++i)
		this.AddHat();
		
	
	if (this.level == 2)
	{
		this.AddEntity(new Ox([0,1],[0,0],this.gravity,this.canvas));
	}
	if (this.level == 3)
	{
		this.AddEntity(new Ox([-0.8,1],[0,0],this.gravity,this.canvas));
		this.AddEntity(new Wolf([-0.8,1],[0,0],this.gravity,this.canvas));
	}
	if (this.level == 4)
	{
		this.AddEntity(new Ox([0,1],[0,0],this.gravity,this.canvas));
		this.AddEntity(new Wolf([0.8,1],[0,0], this.gravity, this.canvas));
		this.AddEntity(new Wolf([-0.8,1],[0,0],this.gravity,this.canvas));
	}
	
	if (this.level == 5)
	{
		this.AddEntity(new Rox([-0.8,0],[0,0],this.canvas));
	}
	if (this.level == 6)
	{
		this.AddEntity(new Rox([-0.8,0.7],[0,0],this.canvas));
		this.AddEntity(new Rox([+0.8,-0.3],[0,0],this.canvas));
		
	}

	if (isNaN(this.level))
	{
		this.player.LoadSprites(this.canvas, "data/fox");
	}
	
	this.canvas.SetBackground(this.backgrounds[this.level]);

	Debug("");
}

/** Get background draw colour (in OpenGL RGBA) **/
Game.prototype.GetColour = function()
{
	if (this.romanticMode === true)
		return [1,0.9,0.9,1];
	else if (this.xmasMode === true && this.level === 1)
		return [0.9,0.9,1,1];
	else if (this.level == 0)
		return [0.9,1,0.9,1];
	else if (this.level == 1)
		return [0.9,0.9,1,1];
	else if (this.level == 2)
		return [0.8,0.6,0.6,1];
	else if (this.level == 3)
		return [1.0,0.9,0.8,1];
	else if (this.level == 4)
		return [1.0,0.7,1.0,1];
	else if (this.level == 5)
		return [0.6,0.5,0.5,1];
	return [1,1,1,1];
}

/** 
 * Pick an advert to show; on the first call it will HTTP GET the list of adverts
 * @param trial - Used to stop recursion
 */
Game.prototype.ChooseAdvert = function(trial)
{
	if (!this.advertChoices)
	{
		if (trial)
			return;
		HttpGet("adverts.py", function(response) {
			try
			{
				this.advertChoices = JSON.parse(response);
				this.advertChoiceIndex = -1;
				this.ChooseAdvert(true);
			}
			catch (err)
			{
				this.ChooseAdvert(true);
			}
		}.bind(this));
		return;
	}
	// Go through the adverts in order (order is chosen by the server in adverts.py)
	return this.advertChoices[this.advertChoiceIndex++ % this.advertChoices.length];
	
}

/**
 * Progress to the Next Level
 * @param skipAd - Used to prevent recursion
 */
Game.prototype.NextLevel = function(skipAd)
{
	this.Pause("Loading...");
	

	
	if (this.enableAdverts && !skipAd)
	{
		// Make the splash screen then call NextLevel (with the skipAd flag
		//	to prevent recursing infinitely)
		this.canvas.SplashScreen(this.ChooseAdvert(), "",[1,1,1,1], function() {
			this.AddTimeout("Advert", this.NextLevel.bind(this,true), 4000);
		}.bind(this));
		return;
	}
	this.SetLevel(this.level+1);
	
	this.Clear();
	this.Draw();

	var boss;
	var taunt;
	var colour;
	var message;

	// The tutorial is optional
	if (this.level == 0 && !confirm("Play the tutorial?\nIf you haven't before you really want to.\n\nTrust me."))
	{
		return this.NextLevel(true); // Skip to level 1
	}
	
	switch (this.level)
	{
		case 0:
			boss = "data/rabbit/drawing3.svg";
			taunt = "Tutorial Time!";
			message = "Prepare to be amazed by the physics engine.";
			colour = [0.5,0.5,0.9,1];
			
			break;
		case 1:
			//this.Resume();
			//return;
			boss = "data/fox/drawing1.svg";
			taunt = message = "Fox Time.";
			message = "And so our dance begins..."
			colour = [0.9,0.5,0.5,1];
			break;
		case 2:
			boss = "data/ox/drawing1.svg";
			taunt = message = "Ox Time.";
			message = "The plot thickens...";
			colour = [0.9,0.5,0.5,1];
			break;
		case 3:
			boss = "data/wolf/drawing1.svg";
			taunt = "Wolf Time.";
			message = "Bad Wolf";
			colour = [0.9,0.5,0.5,1];
			break;
			
		case 4:
			boss = "data/wolf/drawing1.svg";
			taunt = "More wol";
			var choice = Math.round((new Date()).getTime()/1e3) % 6;
			switch (choice)
			{
				case 0:
					taunt += "fs";
					break;
				case 1:
					taunt += "ves";
					break;
				case 2:
					taunt += "fen";
					break;
				case 3:
					taunt += "vies";
					break;
				case 4:
					taunt += "fies";
					break;
				case 5:
					taunt = "Wolf Brother Time!";
					break;
			}
			if (choice != 5)
			{
				taunt += ". Because lazy developer.";
			}
			message = "Wolfs are pack animals FYI.";
					
			
			colour = [0.9,0.5,0.5,1];
			break;
		case 5:
			boss = "data/rox/drawing1.svg";
			taunt = "It is time to Roc.";
			message = "(With sincere apologies to Ronny James Dio)";
			colour = [0.9,0.5,0.5,1];
			break;
		
		default:
			if (isNaN(this.level))
			{
				boss = "data/rabbit/drawing2.svg";
				taunt = "Role Reversal Time!";
				colour = [0.9,0.5,0.5,1];
			}
			else
			{
				boss = "data/rabbit/drawing2.svg";
				taunt = "Mystery Level?";
				colour = [0.9,0.5,0.5,1];
			}
			break;
	}
	
	// Show splash screen, then start level 
	this.canvas.SplashScreen(boss, taunt, colour, function() {
		this.AddTimeout("Level"+String(this.level),
			function() {
				this.Resume();
				if (this.level == 0) // Hacky but more concise
					this.Tutorial("start");
			}.bind(this) ,2000);
		this.Message(message, 2000);
		
	}.bind(this));
	

	
}

/**
 * Add an Enemy and then set a timeout to call AddEnemy again
 * This should only be called once at the start of a level
 */
Game.prototype.AddEnemy = function()
{
	
	var enemy;
	var targetPlayer = this.GetTargetPlayer();
	this.spawnedEnemies += 1;
	if (this.level > 0 && this.level < 5 &&
		(this.spawnedEnemies % (6-Math.min(4,this.level))) == 0 && 
		(!this.entityCount["Fox"] || this.entityCount["Fox"] < 2+this.level))
	{
		enemy = new Fox([targetPlayer.position[0], 1],[0,0], this.gravity, this.canvas)
		
	}
	else
	{
		enemy = new Box([targetPlayer.position[0], 1],[0,0], this.gravity, this.canvas)
		// hack for Christmas and Romantic Mode)
		if (this.xmasMode === true)
		{
			enemy.frame = this.canvas.LoadTexture("data/box/box_xmas"+enemy.index+".gif");
			enemy.damagedFrame = enemy.frame; // you can't hurt the merry
		}
		else if (this.romanticMode === true)
		{
			enemy.frame = this.canvas.LoadTexture("data/box/box_valentine.gif");
			enemy.damagedFrame = enemy.frame; // you can't hurt the lovely
		}
			
	}
	
	if (this.spawnedEnemies % 10 == 0)
	{
		this.AddHat();
	}
		
	this.AddEntity(enemy);
	this.AddTimeout("AddEnemy", function() {this.AddEnemy()}.bind(this), this.stepRate*300/Math.min(Math.pow(this.level,0.5),1));
	if (!this.running)
		this.timeouts["AddEnemy"].Pause();
}
/**
 * Add a Cloud and then set a timeout to call AddCloud again
 * This should only be called once at the start of a level
 */
Game.prototype.AddCloud = function()
{
	var x = Math.random() > 0.5 ? 1.1 : -1.1;
	var y = 0.8*Math.random();
	this.AddEntity(new Cloud([x, y],this.canvas));
	this.AddTimeout("AddCloud", function() {this.AddCloud()}.bind(this), this.stepRate*(4000 + Math.random()*6000)/Math.min(Math.pow(this.level,0.5),1));
	
	if (!this.running)
		this.timeouts["AddCloud"].Pause();
}

/**
 * Add a Hat and... don't set a timeout to add one again
 * (Yeah I should have named those other functions better I guess)
 */
Game.prototype.AddHat = function()
{
	var targetPlayer = this.GetTargetPlayer();
	var hat = new Hat([targetPlayer.position[0], 1], [0,0], [0.8*this.gravity[0], 0.8*this.gravity[1]], this.canvas);
	this.AddEntity(hat); 

}

/**
 * Add an Entity; optimises use of this.entities array
 */
Game.prototype.AddEntity = function(entity)
{
	for (var i = 0; i < this.entities.length; ++i)
	{
		if (!this.entities[i])
		{
			this.entities[i] = entity;
			return;
		}
	}
	if (!this.entityCount[entity.GetName()])
	{
		this.entityCount[entity.GetName()] = 1;
	}
	else
	{
		this.entityCount[entity.GetName()] += 1;
	}
	this.entities.push(entity);
	return entity;
}

/**
 * Key was pressed
 * Warning: Magic keycode numbers incoming
 */
Game.prototype.KeyDown = function(event)
{
	if (!this.keyState)
		this.keyState = [];
		
	if (this.keyState[event.keyCode] === true) 
		return;
	this.keyState[event.keyCode] = true; 

	if (event.keyCode == 32) // space
	{
		if (this.running)
		{
			this.Pause("Paused");
			this.Message("Focus tab, press any key");
		}
		else if (this.player && this.player.alive)
		{
			this.Resume();
			this.Message("");
		}
	}
	if (event.keyCode >= 48 && event.keyCode <= 53)
	{
		this.SetLevel(event.keyCode-48);
	}
	
	if (!this.webSockets)
		return;
	
	for (var i = 0; i < this.webSockets.length; ++i)
	{
		this.webSockets[i].send("+"+event.keyCode+"\n");
	}
}

/**
 * Key was released
 */
Game.prototype.KeyUp = function(event)
{
	if (!this.keyState)
		this.keyState = [];
	
	if (this.keyState[event.keyCode] !== true)
		return;
		
	this.keyState[event.keyCode] = false;
	if (!this.webSockets)
		return;
	for (var i = 0; i < this.webSockets.length; ++i)
	{
		this.webSockets[i].send("-"+event.keyCode+"\n");
	}	
}


Game.prototype.TouchDown = function(event)
{
	if (!this.running && this.player && this.player.alive)
	{
		this.Resume();
	}
	this.keyState = [];
	if (!this.player || !this.canvas)
		return;
	//alert("TouchDown at "+String(event.clientX) +","+String(event.clientY));
	var delx = ((2*event.clientX/this.canvas.width)-1) - this.player.position[0];
	var dely = (1-2*(event.clientY/this.canvas.height)) - this.player.position[1];
	// note y coordinate positive direction is reversed in GL (game) coords vs canvas coords
	//this.Message("TouchDown "+String(delx)+","+String(dely));
	if (delx >= 2*this.player.Width() || event.clientX > 0.8*this.canvas.width)
	{
		this.KeyDown({keyCode : 39});
	}
	else if (delx <= -1.5*this.player.Width() || event.clientX < 0.2*this.canvas.width)
	{
		this.KeyDown({keyCode : 37});
	}
	
	if (dely >= 3*this.player.Height() || event.clientY < 0.2*this.canvas.height)
	{
		this.KeyDown({keyCode : 38});
	}
	else if (dely <= -3*this.player.Height() || event.clientY > 0.8*this.canvas.height)
	{
		this.KeyDown({keyCode : 40});
	}
}

/**
 * Touch is released
 */
Game.prototype.TouchUp = function(event)
{
	//this.Message("TouchUp at "+String([event.clientX, event.clientY]));
	
	for (var k in this.keyState)
	{
		this.KeyUp({keyCode : k});
	}
	this.keyState = [];
}

/**
 * Mouse is clicked inside the canvas
 */
Game.prototype.MouseDown = function(event)
{
	this.mouseDown = true;
	this.TouchDown(event);
}

/**
 * Mouse is released
 * Buggy - doesn't get called if mouse is released outside of the canvas
 */
Game.prototype.MouseUp = function(event)
{
	if (this.mouseDown)
	{
		this.mouseDown = false;
		this.TouchUp(event);
	}
}

/**
 * Mouse got moved
 */
Game.prototype.MouseMove = function(event)
{
	if (this.mouseDown)
		this.TouchDown(event);
}

/**
 * Combine clearing, steping and drawing into one function
 * More efficient than using three
 */
Game.prototype.ClearStepAndDraw = function()
{


	this.lastStepTime = this.stepTime;
	this.stepTime = (new Date()).getTime();
	if (!this.lastStepTime)
	{
		this.startTime = this.stepTime;
		this.runTime += this.stepRate/1000;
	}
	else
	{
		this.runTime += this.stepTime - this.lastStepTime;
	}

	// If using Entity.Clear in the loop this should be commented out
	//  to give a performance increase
	this.canvas.Clear(this.GetColour());
	this.canvas.DrawBackground();
		
	if (this.message)
	{
		this.canvas.Text(this.message);	
	}

	
	for (var i = this.entities.length; i >= 0; --i)
	{
		if (this.entities[i])
		{
			 // noticably faster on smartphone, but obviously causes issues with overlapping objects :(
			//this.entities[i].Clear(this.canvas);
			
			// Hacky - use different key states when in multiplayer
			if (this.entities[i].name == "Humphrey" && this.multiplayerKeyState)
			{
				console.log("Multiplayer; load key state for "+str(this.playerID))
				this.oldKeyState = this.keyState;
				this.keyState = this.multiplayerKeyState[this.entities[i].playerID];	
				this.entities[i].Step(this);
				this.keyState = this.oldKeyState;		
			}
			else
			{
				this.entities[i].Step(this);
				if (this.entities[i].angle != 0)
					console.log("Angle is " + String(this.entities[i].angle));
			}
			this.entities[i].Draw(this.canvas);
			if (!this.entities[i].alive)
			{
				this.entities[i].Clear(this.canvas);
				this.entityCount[this.entities[i].GetName()] -= 1;
				if (!this.deathCount[this.entities[i].GetName()])
				{
					this.deathCount[this.entities[i].GetName()] = 1;
				}
				else
				{
					this.deathCount[this.entities[i].GetName()] += 1;
				}
				if (this.entities[i] !== this.player)
					delete this.entities[i];
			}
		}
	}
	
	this.stepCount += 1;
	Debug(String(this.player.angle));
}

/** Clear the canvas, defaults to this.canvas **/
Game.prototype.Clear = function(canvas)
{
	if (!canvas)
		canvas = this.canvas;
	
	//if (canvas.gl)
	{
		canvas.Clear()
		return;
	}
	for (var i = 0; i < this.entities.length; ++i)
	{
		if (this.entities[i] && this.entities[i].alive)
			this.entities[i].Clear(canvas);
	}
}

/** Draw **/
Game.prototype.Draw = function()
{
	
	if (this.message)
	{
		this.canvas.Clear(this.GetColour());
		this.canvas.Text(this.message);
		//this.canvas.SplashScreen(this.overlay.image, this.overlay.splashText, [0,0,0,0.1]);
	}
		
	/*
	for (var i = 0; i < this.entities.length; ++i)
	{
		if (this.entities[i])
		{
			this.entities[i].Draw(this.canvas);
		}
	}
	*/
	
}

Game.prototype.MainLoop = function()
{	
	
	if (!this.running)
		return;
		
	if (this.document && !this.document.hasFocus())
	{
		this.Pause("Paused");
		this.Message("Focus tab and press space");
		return;
	}
	
	
	if (this.levelDurations[this.level] && 
		this.runTime > this.levelDurations[this.level])
	{
		if (this.player)
			this.player.PostStats("Next Level",this)
		this.NextLevel();
		return;
	}
	
		
			
	this.ClearStepAndDraw();
	
	if (this.player && !this.player.alive && !this.player.alreadyDying)
	{
		this.player.alreadyDying = true;
		if (this.audio)
			this.audio.pause();
		this.Clear();
		this.Draw();
		this.player.Draw(this.canvas);
		
		this.running = false;
		
		for (var t in this.timeouts)
		{
			this.timeouts[t].Pause();
			delete this.timeouts[t];
		}
		
		var deathCall;
		// horrible callback code follows
		// (seriously why isn't there a sleep() function
		//	 don't give me that crap about callbacks being more elegant)
		if (!this.enableAdverts)
		{
			deathCall = function() {
				this.AddTimeout("Restart", function() {
					this.SetLevel(this.level);
					this.Resume();
				}.bind(this),1000);
			}
		}
		else
		{
			deathCall = function() {
				this.AddTimeout("Advert", function() {
					this.canvas.SplashScreen(this.ChooseAdvert(), "",[1,1,1,1], 
					function() {
							this.AddTimeout("Restart", function() {
							this.SetLevel(this.level);
							this.Resume();
						}.bind(this),4000);
					}.bind(this));
				}.bind(this), 1000);
			}
		}
		
		//if (this.level == 1 && !this.playedTutorial && (!this.spawnCount || this.spawnCount <= 10))
		//{
		//	this.level = -1;
		//	this.NextLevel();
		//	return;
		//}
		
		this.player.DeathScene(this, deathCall.bind(this));
		this.player.alreadyDying = false;
		return;
	}
	
	if (this.document)
	{
		if (!this.document.runtime)
			this.document.runtime = this.document.getElementById("runtime");
		if (!this.document.level)
			this.document.level = this.document.getElementById("level");
		if (this.document.level)
		{
			this.document.level.innerHTML = String(this.level);
		}
		if (this.document.runtime)
		{
			var totalTime = this.runTime;
			for (var i = 1; i < this.level; ++i)
				totalTime += this.levelDurations[i];
			this.document.runtime.innerHTML = (""+totalTime/1000).toHHMMSS();
		}
	}
	
	var actualTime = 0;
	var thisLoop = (new Date()).getTime();
	if (this.lastLoop)
	{
		actualTime = thisLoop - this.lastLoop;
	}
	this.lastLoop = thisLoop;
	
	
	var nextTime = Math.max(0, this.stepRate - actualTime);
	this.AddTimeout("MainLoop", function() {
		this.MainLoop()
	}.bind(this), nextTime, this);	
}

Game.prototype.GetNearestPlayer = function(position)
{
	// Maybe one day I will have more than one player...
	return this.player;
}

Game.prototype.Message = function(text, timeout)
{
	if (!this.document)
		return;
	if (!this.document.message)
		this.document.message = this.document.getElementById("message");
	if (!this.document.message)
	{
		this.canvas.Message(text);
	}
	else
	{
		this.document.message.innerHTML = text;
	}
	if (timeout)
	{
		this.AddTimeout("Message Clear", function() {
			this.Message("")}.bind(this), timeout);
	}
}

Game.prototype.UpdateDOM = function(player)
{
	if (!this.document || !player)
		return;
		
	if (!this.document.lives)
		this.document.lives = this.document.getElementById("lives");
	if (!this.document.lives)
		return;
		
	this.document.lives.innerHTML = player.lives;
	if (player.lives <= 0)
	{
		this.document.lives.style.color = "red";
	}
	else
	{
		this.document.lives.style.color = "green";
	}
}

Game.prototype.GetTargetPlayer = function()
{
	return this.player;
}

/**
 * Called whenever a WebSocket message is received
 */
Game.prototype.MultiplayerSync = function(message)
{
	
		Debug("WS: " + String(message));
		tokens = message.split(" ");
		if (!this.messageCount)
		{
			this.messageCount = 0;
		}
		
		if (tokens[0] === "MULTIPLAYER")
		{
			this.multiplayer = [];
			this.playerID = parseInt(tokens[1]);
			this.playerCount = parseInt(tokens[2]);
			//this.multiplayer[this.playerID] = this.player;
			//this.player.playerID = this.playerID;
			
			this.multiplayerKeyState = [];
			for (var i = 0; i < this.playerCount+1; ++i)
			{
				this.multiplayerKeyState[i] = [];
			}
		}
		else
		{
			var playerID = parseInt(tokens[0]);
			var keyCode = parseInt(tokens[1]);
			if (keyCode < 0)
				this.multiplayerKeyState[playerID][Math.abs(keyCode)] = false;
			else
				this.multiplayerKeyState[playerID][Math.abs(keyCode)] = true;
		}
		
		
		++this.messageCount;
}
