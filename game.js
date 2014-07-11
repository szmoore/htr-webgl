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
	
	this.levelDurations = [null, 199000];
	
	this.localTime = new Date();
	this.romanticMode = (localTime.getMonth() == 1 
		&& localTime.getDate() == 14);
	this.canvas = new Canvas(canvas);
	if (this.spriteCollisions)
		this.canvas.prepareSpriteCollisions = true;
		
	this.gravity = [0, -1];
	this.stepRate = 15;
	
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
		colour = [0,0,0,0.6];
	this.canvas.SplashScreen("data/rabbit/drawing2.svg", message, colour);
}

Game.prototype.Resume = function()
{
	if (this.running)
		return;
		
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
	}

}

Game.prototype.Start = function(level)
{
	this.level = level-1;
	this.NextLevel();
}

Game.prototype.SetLevel = function(level)
{
	this.level = level;
		
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
	//this.AddEntity(new Wall({min: [-Infinity,0.8], max:[Infinity,Infinity]}, "Roof")); // top
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[-1, Infinity]})); // left 
	this.AddEntity(new Wall({min: [1,-Infinity], max:[Infinity, Infinity]})); // right
	
	// Add the player
	this.player = new Player([0,0],[0,0],this.gravity, this.canvas, "data/rabbit");
	this.AddEntity(this.player);
	

	

}



Game.prototype.NextLevel = function()
{
	this.Pause("Loading...");
	this.SetLevel(this.level+1);
	this.Draw();
	
	var boss;
	var taunt;
	var colour;
	var message;
	switch (this.level)
	{
		case 0:
			boss = "data/rabbit/drawing3.svg";
			taunt = "Tutorial Time!";
			message = "Avoid the boxes";
			colour = [0.5,0.5,0.9,1];
			
			break;
		case 1:
			this.Resume();
			return;
			boss = "data/fox/drawing1.svg";
			taunt = message = "Fox Time.";
			message = "And so our dance begins..."
			colour = [0.9,0.5,0.5,1];
			this.AddHat();
			break;
		case 2:
			boss = "data/ox/drawing1.svg";
			taunt = message = "Ox Time.";
			message = "The plot thickens...";
			colour = [0.9,0.5,0.5,1];
			this.AddHat(); this.AddHat();
			break;
		case 3:
			boss = "data/wolf/drawing1.svg";
			taunt = "<Placeholder Boss> Time. ";
			message = "It's a wolf. Honest.";
			colour = [0.9,0.5,0.5,1];
			break;
	}
	
	
	this.canvas.SplashScreen(boss, taunt, colour, function() {
		this.AddTimeout("Level"+String(level),
			function() {
				this.Resume();
				if (this.level == 0)
					this.Tutorial(0);
			}.bind(this) ,2000);
		this.Message(message, 2000);
		
	}.bind(this));
	

	
}

Game.prototype.AddEnemy = function()
{
	var enemy;
	this.spawnedEnemies += 1;
	if (this.level > 0 && (this.spawnedEnemies % 5) == 0 && 
		(!this.entityCount["Fox"] || this.entityCount["Fox"] < 3+this.level))
	{
		enemy = new Fox([this.player.position[0], 1],[0,0], this.gravity, this.canvas)
		
	}
	else
	{
		enemy = new Box([this.player.position[0], 1],[0,0], this.gravity, this.canvas)
	}
	this.AddEntity(enemy);
	this.AddTimeout("AddEnemy", function() {this.AddEnemy()}.bind(this), this.stepRate*600);
}

Game.prototype.AddCloud = function()
{
	var x = Math.random() > 0.5 ? 1.1 : -1.1;
	var y = 0.8*Math.random();
	this.AddEntity(new Cloud([x, y],this.canvas));
	this.AddTimeout("AddCloud", function() {this.AddCloud()}.bind(this), this.stepRate*(1000 + Math.random()*2000));
}

Game.prototype.AddHat = function()
{
	var hat = new Hat([-0.8+2*Math.random(),1], [0,0], this.gravity, this.canvas);
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
	for (var i = 0; i < this.webSockets.length; ++i)
	{
		this.webSockets.send("+"+event.keyCode+"\n");
	}
}

Game.prototype.KeyUp = function(event)
{
	if (this.keyState[event.keyCode] !== true)
		return;
		
	this.keyState[event.keyCode] = false;
	for (var i = 0; i < this.webSockets.length; ++i)
	{
		this.webSockets.send("-"+event.keyCode+"\n");
	}	
}

Game.prototype.Step = function()
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
	
	for (var i = this.entities.length; i >= 0; --i)
	{
		if (this.entities[i])
		{
			this.entities[i].Step(this);
			if (!this.entities[i].alive)
			{
				this.entityCount[this.entities[i].GetName()] -= 1;
				delete this.entities[i];
			}
		}
	}
	
	this.stepCount += 1;
}

Game.prototype.Draw = function(canvas)
{
	if (!canvas)
		canvas = this.canvas;

	var colour = [0,0,0,0]
	if (this.romanticMode)
		colour = [1,0.9,0.9,1];
	else if (this.level == 0)
		colour = [0.9,1,0.9,1];
	else if (this.level == 1)
		colour = [0.9,0.9,1,1];
	else if (this.level == 2)
		colour = [0.8,0.6,0.6,1];
	else if (this.level == 3)
		colour = [1.0,0.9,0.8,1];
		
	canvas.Clear(colour);
	for (var i = 0; i < this.entities.length; ++i)
	{
		if (this.entities[i])
			this.entities[i].Draw(canvas);
	}
	
	if (this.overlay)
	{
		this.canvas.SplashScreen(this.overlay.image, this.overlay.splashText, [0,0,0,0.1]);
	}
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
			
		
	this.Step();
	this.Draw();
	if (!this.player.alive)
	{
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
		this.AddTimeout("Restart", function() {this.Resume()}.bind(this), 2000);
		return;
	}
	
	if (this.document)
	{
		if (!this.document.runtime)
			this.document.runtime = this.document.getElementById("runtime");
		this.document.runtime.innerHTML = (""+this.runTime/1000).toHHMMSS();
	}
	
	this.AddTimeout("MainLoop", function() {this.MainLoop()}.bind(this), this.stepRate, this);
		
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


