/**
 * @file game.js
 * @brief Represents the game world and all Entities within it
 */
 
function Game(audio, canvas, level)
{
	this.audio = audio;
	this.level = (!level) ? 1 : level;
	
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
}

Game.prototype.Pause = function()
{

	this.running = false;
	for (var t in this.timeouts)
	{
		clearTimeout(this.timeouts[t]);
	}
	if (this.audio)
		this.audio.pause();
		
	this.Draw();
	this.canvas.SplashScreen("data/rabbit/drawing2.svg", "Paused", [0,0,0,0.6]);
}

Game.prototype.Resume = function()
{
	if (this.running)
		return;

	this.running = true;
	this.timeouts.enemy = setTimeout(function() {this.AddEnemy()}.bind(this), 2000);
	
	if (this.entities.length <= 0 || !this.entities)
	{
		if (this.timeouts.start)
		{
			clearTimeout(this.timeouts.start);
			delete this.timeouts.start;
		}
		this.SetLevel(this.level);
	}
	this.MainLoop();
	
	//if (this.audio) // put back in when done testing
		//this.audio.play();
}

Game.prototype.Start = function(level)
{

	this.SetLevel(level);
	this.Resume();
}

Game.prototype.SetLevel = function(level)
{
	this.level = level;
		this.level = 1;
		
	this.spawnedEnemies = 0;
		
	if (this.audio)
	{
		this.audio.src = "data/theme"+this.level+".ogg";
		this.audio.addEventListener("ended", function(){alert("Done")});
		this.audio.load();
		this.audio.pause();
		//this.audio.play();
	}
	this.keyState = [];
	this.webSockets = [];
	this.entities = [];
	this.entityCount = {};

	// Add the walls
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[Infinity, -1]}, "Floor")); // bottom
	this.AddEntity(new Wall({min: [-Infinity,1], max:[Infinity,Infinity]}, "Roof")); // top
	this.AddEntity(new Wall({min: [-Infinity,-Infinity], max:[-1, Infinity]})); // left 
	this.AddEntity(new Wall({min: [1,-Infinity], max:[Infinity, Infinity]})); // right
	
	// Add the player
	this.player = new Player([0.5,-0.5],[0,0],this.gravity, this.canvas, "data/rabbit");
	this.AddEntity(this.player);
}

Game.prototype.AddEnemy = function()
{
	var enemy;
	this.spawnedEnemies += 1;
	if ((this.spawnedEnemies % 5) == 0 && 
		(!this.entityCount["Fox"] || this.entityCount["Fox"] < 3+this.level))
	{
		enemy = new Fox([this.player.position[0], 1],[0,0], this.gravity, this.canvas, "data/fox/")
		
	}
	else
	{
		enemy = new Box([this.player.position[0], 1],[0,0], this.gravity, this.canvas, "data/box/box1.gif")
	}
	this.AddEntity(enemy);
	this.timeouts.enemy = setTimeout(function() {this.AddEnemy()}.bind(this), 2000);
}

Game.prototype.AddHat = function()
{
	
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
}

Game.prototype.KeyDown = function(event)
{
	if (this.keyState[event.keyCode] === true) 
		return;
	this.keyState[event.keyCode] = true; 
	if (event.keyCode == 32) // space
	{
		if (this.running)
			this.Pause();
		else
			this.Resume();
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
}

Game.prototype.MainLoop = function()
{	
	if (!this.running)
		return;
	this.Step();
	this.Draw();
	if (!this.player.alive)
	{
		this.Draw();
		this.running = false;
		this.player.DeathScene(this);
		for (var t in this.timeouts)
		{
			clearTimeout(this.timeouts[t]);
			delete this.timeouts[t];
		}
		this.entities = [];
		this.timeouts.start = setTimeout(function() {this.Start(this.level)}.bind(this), 2000);
		return;
	}
	this.timeouts.step = setTimeout(function() {this.MainLoop()}.bind(this), this.stepRate, this);
		
}

Game.prototype.GetNearestPlayer = function(position)
{
	return this.player;
}


