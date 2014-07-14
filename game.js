/**
 * @file game.js
 * @brief Represents the game world and all Entities within it
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
}
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

Timeout.prototype.Resume = function()
{
	this.running = true;
	//console.log("Timeout <" + this.name + "> resumed with " + String(this.wait) + " ms remaining");
	this.id = setTimeout(function(game) {
		this.onTimeout(); 
		delete game.timeouts[this.name]}.bind(this,game), this.wait);
}
Timeout.prototype.constructor = Timeout;


 
function Game(canvas, audio, document)
{
	this.document = document;
	this.audio = audio;
	this.level = -1;
	this.enableAdverts = true;
	this.ChooseAdvert();
	
	this.levelDurations = [null, 198000,150000,210000];
	
	this.localTime = new Date();
	this.canvas = new Canvas(canvas);
	if (this.spriteCollisions)
		this.canvas.prepareSpriteCollisions = true;
		
	this.gravity = [0, -1];
	this.stepRate = 20;
	
	this.timeouts = {};
	
	
	
	this.running = false;
	this.runTime = 0;
	this.entities = [];
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
	if (this.audio)
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
	
	if (this.audio) // put back in when done testing
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
	this.level = Math.min(level,3);
		
	this.spawnedEnemies = 0;
		
		
	
	if (this.audio)
	{
		this.audio.src = "data/theme"+this.level+".ogg";
		this.audio.load();
		this.audio.pause();
		//this.audio.play();
		
		//this.levelDurations[this.level] = this.audio.duration*1000;
	}
	
	
	this.runTime = 0;
	this.keyState = [];
	this.webSockets = [];
	this.entities = [];
	this.entityCount = {};

	// Add the walls
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[Infinity, -1]}, "Floor")); // bottom
	this.AddEntity(new Wall({min: [-Infinity,0.8], max:[Infinity,Infinity]}, "Roof")); // top
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[-1, Infinity]})); // left 
	this.AddEntity(new Wall({min: [1,-Infinity], max:[Infinity, Infinity]})); // right
	
	// Add the player
	this.player = new Player([0,0],[0,0],this.gravity, this.canvas, "data/rabbit");
	this.AddEntity(this.player);
	

	// level specific
	for (var i = 0; i < this.level*2; ++i)
		this.AddHat();
		
		
	for (var i = 0; i < this.level-1; ++i)
	{
		if (i % 2 == 1)
			this.AddEntity(new Wolf([1,1],[0,0],this.gravity,this.canvas));
		else
			this.AddEntity(new Ox([-1,1],[0,0],this.gravity,this.canvas));
	}

	
}

Game.prototype.GetColour = function()
{
	if (this.romanticMode)
		return [1,0.9,0.9,1];
	else if (this.level == 0)
		return [0.9,1,0.9,1];
	else if (this.level == 1)
		return [0.9,0.9,1,1];
	else if (this.level == 2)
		return [0.8,0.6,0.6,1];
	else if (this.level == 3)
		return [1.0,0.9,0.8,1];
	return [1,1,1,1];
}

Game.prototype.ChooseAdvert = function(trial)
{
	if (!this.advertChoices)
	{
		if (trial)
			return;
			
		//JSON.parse is more "secure"... but also buggy compared to eval
		// (Doing annoying things on the server side to make it work)
		HttpGet("data/adverts", function(response) {
			this.advertChoices = JSON.parse(response);
			this.ChooseAdvert(true);
		}.bind(this));
		return;
	}
	return "data/adverts/"+String(this.advertChoices[Math.round(Math.random()*(this.advertChoices.length-1))]);
	
}

Game.prototype.NextLevel = function(skipAd)
{
	this.Pause("Loading...");
	if (this.enableAdverts && !skipAd)
	{
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
	
	if (this.level == 0 && !confirm("Play the tutorial?"))
	{
		return this.NextLevel();
	}
	
	switch (this.level)
	{
		case 0:
			boss = "data/rabbit/drawing3.svg";
			taunt = "Tutorial Time!";
			message = "Avoid the boxes";
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
			taunt = "Wolf(?) Time.";
			message = "It's a wolf. Honest.";
			colour = [0.9,0.5,0.5,1];
			break;
		default:
			alert("Congratulations on beating level 3. There are no more levels. Yet. Starting again.");
			this.level = -1;
			this.NextLevel();
			return;
			break;
	}
	
	
	this.canvas.SplashScreen(boss, taunt, colour, function() {
		this.AddTimeout("Level"+String(this.level),
			function() {
				this.Resume();
				if (this.level == 0)
					this.Tutorial("start");
			}.bind(this) ,2000);
		this.Message(message, 2000);
		
	}.bind(this));
	

	
}

Game.prototype.AddEnemy = function()
{
	
	var enemy;
	this.spawnedEnemies += 1;
	if (this.level > 0 && (this.spawnedEnemies % (6-Math.min(4,this.level))) == 0 && 
		(!this.entityCount["Fox"] || this.entityCount["Fox"] < 2+this.level))
	{
		enemy = new Fox([this.player.position[0], 1],[0,0], this.gravity, this.canvas)
		
	}
	else
	{
		enemy = new Box([this.player.position[0], 1],[0,0], this.gravity, this.canvas)
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

Game.prototype.AddCloud = function()
{
	var x = Math.random() > 0.5 ? 1.1 : -1.1;
	var y = 0.8*Math.random();
	this.AddEntity(new Cloud([x, y],this.canvas));
	this.AddTimeout("AddCloud", function() {this.AddCloud()}.bind(this), this.stepRate*(4000 + Math.random()*6000)/Math.min(Math.pow(this.level,0.5),1));
	
	if (!this.running)
		this.timeouts["AddCloud"].Pause();
}

Game.prototype.AddHat = function()
{
	var hat = new Hat([this.player.position[0], 1], [0,0], [0.8*this.gravity[0], 0.8*this.gravity[1]], this.canvas);
	this.AddEntity(hat); 

}

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
		else
		{
			this.Resume();
			this.Message("");
		}
	}
	if (!this.webSockets)
		return;
	
	for (var i = 0; i < this.webSockets.length; ++i)
	{
		this.webSockets.send("+"+event.keyCode+"\n");
	}
}


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
		this.webSockets.send("-"+event.keyCode+"\n");
	}	
}


Game.prototype.TouchDown = function(event)
{
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

Game.prototype.TouchUp = function(event)
{
	//this.Message("TouchUp at "+String([event.clientX, event.clientY]));
	
	for (var k in this.keyState)
	{
		this.KeyUp({keyCode : k});
	}
	this.keyState = [];
}

Game.prototype.ClearStepAndDraw = function()
{


	this.lastStepTime = this.stepTime;
	this.stepTime = (new Date()).getTime();
	if (!this.lastStepTime)
	{
		this.runTime += this.stepRate/1000;
	}
	else
	{
		this.runTime += this.stepTime - this.lastStepTime;
	}

	this.canvas.Clear(this.GetColour());
		
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
			this.entities[i].Step(this);
			this.entities[i].Draw(this.canvas);
			if (!this.entities[i].alive)
			{
				this.entities[i].Clear(this.canvas);
				this.entityCount[this.entities[i].GetName()] -= 1;
				delete this.entities[i];
			}
		}
	}
	
	
	this.stepCount += 1;
}

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
		this.NextLevel();
		return;
	}
	
		
			
	this.ClearStepAndDraw();
	
	if (this.player && !this.player.alive)
	{
		this.Clear();
		this.Draw();
		this.player.Draw(this.canvas);
		
		this.running = false;
		this.player.DeathScene(this);
		for (var t in this.timeouts)
		{
			clearTimeout(this.timeouts[t]);
			delete this.timeouts[t];
		}
		this.entities = [];
		this.runTime = 0;
		delete this.stepTime;
		this.SetLevel(this.level);
		if (!this.enableAdverts)
			this.AddTimeout("Restart", function() {this.Resume()}.bind(this), 1000);
		else
		{
			this.AddTimeout("Advert", function() {
				this.canvas.SplashScreen(this.ChooseAdvert(), "",[1,1,1,1], function() {
					this.AddTimeout("Restart", this.Resume.bind(this), 4000);
				}.bind(this));
			}.bind(this), 1000);
		}
		return;
	}
	
	if (this.document)
	{
		if (!this.document.runtime)
			this.document.runtime = this.document.getElementById("runtime");
		if (this.document.runtime)
			this.document.runtime.innerHTML = (""+this.runTime/1000).toHHMMSS();
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
	return this.player;
}

Game.prototype.Message = function(text, timeout)
{
	if (!this.document)
		return;
	if (!this.document.message)
		this.document.message = this.document.getElementById("message");
	if (!this.document.message)
		return;
	this.document.message.innerHTML = text;
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


