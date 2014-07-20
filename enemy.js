/**
 * @file enemy.js
 * @brief Characters that chase the player
 */
 
function Enemy(position, velocity, acceleration, canvas, spritePath)
{
	Entity.call(this, position, velocity, acceleration, canvas, spritePath);
	this.dazed = 0;
	this.sleep = 0;
	this.jumpSpeed = 0.9;
	this.name = "Enemy";
	this.ignoreCollisions["Roof"] = true;
	
	this.chaseWidths = 15;
	this.danceWidths = 1.5;
	this.jumpWidths = 15;
}
Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;
Enemy.prototype.CollisionActions = {}; // this is slightly whack

/**
 * Try and jump
 */
Enemy.prototype.TryToJump = function()
{
	if (!this.canJump)
		return;
	
	this.canJump = false;
	this.velocity[1] = this.jumpSpeed;
}

/**
 * Enemy step; chase player
 */
Enemy.prototype.Step = function(game)
{
	if (this.dazed && this.dazed > 0)
	{
		this.dazed -= this.delta/1000;
		this.dazed = Math.max(this.dazed, 0);
		this.dazed = Math.min(this.dazed, 2);
	}

	if (this.position[1] > 0.9)
		this.acceleration = [0.3*game.gravity[0], 0.3*game.gravity[1]];
	else
		this.acceleration = game.gravity;

	var player = game.GetNearestPlayer(this.position);

	if (!player || (this.sleep && this.sleep > 0) || (this.dazed && this.dazed > 0))
	{
		return Box.prototype.Step.call(this, game);
	}
	// Calculate displacement and distance from player
	var r = [];
	var r2 = 0;
	for (var i = 0; i < this.position.length; ++i)
	{
		r[i] = player.position[i] - this.position[i];
		r2 += Math.pow(r[i],2);
	}

	// If close, attax
	if (r2 < this.chaseWidths*this.Width())
	{
		if (Math.abs(r[0]) < this.danceWidths*this.Width() && 
			Math.abs(this.velocity[0]) < 0.5*this.speed)
		{
			this.velocity[0] = (Math.random() > 0.5) 
				? -this.speed : this.speed;
		}
		else if (Math.abs(r[0]) > this.Width())
		{
			// Move towards player
			if (player.position[0] < this.position[0])
				this.velocity[0] = -this.speed;
			else if (player.position[0] > this.position[0])
				this.velocity[0] = +this.speed;
		}

		// Jump! (still with Ox hack :S)
		if (player.Bottom() > this.Top() && r2 < this.jumpWidths*this.Width())
			this.TryToJump();
	}
	else
		this.velocity[0] = 0;	

	Entity.prototype.Step.call(this,game);
}

/**
 * Handler for colliding with player
 */
Enemy.prototype.CollisionActions["Humphrey"] = function(other, instigator, game)
{
	if (instigator && this.MovingTowards(other) 
		&& !this.sleep && !this.dazed)
	{
		other.Die(this.GetName(), this, game);
	}
}

Enemy.prototype.Die = function(reason, other, game)
{
	Entity.prototype.Die.call(this,reason,other,game);
	game.AddHat();
}

Enemy.prototype.CollisionActions["Box"] = function(other, instigator, game)
{
	if (this.CollideBox(other, instigator, game) && !this.sleep)
		this.TryToJump();
}

Enemy.prototype.CollideBox = function(other, instigator, game)
{
	//if (other.velocity[1] < -0.1 && other.Bottom() > this.Top() && !instigator)
	if (!instigator && other.MovingTowards(this) && other.Above(this) && other.velocity[1] < -0.4)
	{
		var boxh = other.health;
		if (this.health)
		{
			this.health -= other.health;
			other.health -= this.health;
		}

		if (!this.health || this.health <= 0)
		{
			this.Die(other.GetName(), other, game);
		}
		else
		{
			this.dazed += Math.random()*boxh;
		}
		return false;
	}
	return true;
}

Enemy.prototype.DamagePush = function(other)
{
	if (Entity.prototype.TryToPush.call(this,other))
	{
		other.health -= Math.max(0.4,Math.max(this.velocity[0], this.velocity[1]));
		return true;
	}
	return false;
}

function Fox(position, velocity, acceleration, canvas)
{
	Enemy.call(this, position, velocity, acceleration, canvas, "data/fox");
	this.name = "Fox";
	this.speed = 0.5;
	this.jumpSpeed = 0.7;
	this.canJump = false;
}
Fox.prototype = Object.create(Enemy.prototype);
Fox.prototype.constructor = Fox;

function Ox(position, velocity, acceleration, canvas)
{
	Enemy.call(this, position, velocity, acceleration, canvas, "data/ox");
	this.name = "Ox";
	this.bounds = {min: [-40/canvas.width, -48/canvas.height], max: [40/canvas.width, 40/canvas.height]};
	this.scale = [48/canvas.width, 48/canvas.height];
	
	this.health = 20;
	this.speed = 0.55;
	this.canJump = true;
	this.jumpSpeed = 0.5;
	this.danceWidths = 2;
	this.jumpWidths = 2;
	
}
Ox.prototype = Object.create(Enemy.prototype);
Ox.prototype.constructor = Ox;
Ox.prototype.CollisionActions = Object.create(Enemy.prototype.CollisionActions);

Ox.prototype.Die = function(reason, other, game)
{
	Enemy.prototype.Die.call(this, reason, other, game);
	game.AddTimeout("OxTime", function() {
		var xx = Math.random() > 0.5 ? 0.5 : -0.5;
		this.AddEntity(new Ox([xx, 1], [0,0], this.gravity, this.canvas));
	}.bind(game), 2000*game.stepRate);
	if (!game.running) game.timeouts["OxTime"].Pause();
}

Ox.prototype.CollisionActions["Box"] = function(other, instigator, game)
{
	Enemy.prototype.CollisionActions["Box"].call(this,other,instigator,game);
	if (this.Bottom() < other.Top())
	{
		other.velocity[0] = this.velocity[0]/2;
		if (other.Top() - this.Bottom() < 0.05*other.Height())
			this.position[1] += 0.07*other.Height();
		other.health -= Math.max(0.4,Math.max(this.velocity[0], this.velocity[1]));
		return false;
	}
}

Ox.prototype.CollisionActions["Fox"] = function(other, instigator, game)
{
	if (other.sleep && this.DamagePush(other))
	{
		other.sleep -= 0.1;
		return false;
	}
}

Ox.prototype.CollisionActions["Wolf"] = function(other, instigator, game)
{
	if (other.sleep && this.TryToPush(other))
	{
		other.sleep -= 0.1;
		return false;
	}
}


function Wolf(position, velocity, acceleration, canvas)
{
	Enemy.call(this, position, velocity, acceleration, canvas, "data/wolf");
	this.name = "Wolf";
	this.bounds = {min: [-40/canvas.width, -40/canvas.height], max: [40/canvas.width, 40/canvas.height]};
	this.scale = [40/canvas.width, 40/canvas.height];
	
	this.health = 5;
	this.speed = 0.65;
	this.canJump = true;
	this.jumpSpeed = 1.0;
	
	this.jumpWidths = 3;
	
}
Wolf.prototype = Object.create(Enemy.prototype);
Wolf.prototype.constructor = Wolf;
Wolf.prototype.CollisionActions = Object.create(Enemy.prototype.CollisionActions);

Wolf.prototype.CollisionActions["Fox"] = function(other, instigator, game)
{
	if (other.sleep && this.TryToPush(other))
	{
		other.sleep -= 0.1;
		this.TryToJump();
	}
}

Wolf.prototype.Die = function(reason, other, game)
{
	Enemy.prototype.Die.call(this, reason, other, game);
	game.AddTimeout("WolfTime", function() {
		var xx = Math.random() > 0.5 ? 0.5 : -0.5;
		this.AddEntity(new Wolf([xx, 1], [0,0], this.gravity, this.canvas));
	}.bind(game), 2000*game.stepRate);
	if (!game.running) game.timeouts["WolfTime"].Pause();
}



function Rox(position, velocity, canvas)
{
	Enemy.call(this, position, velocity, [0,0], canvas,"");
	this.frameBase = {};
	this.frameBase["right"] = canvas.LoadTexture("data/rox/right.svg");
	this.frameBase["left"] = canvas.LoadTexture("data/rox/left.svg");
	this.frame = this.frameBase["right"];
		
	this.name = "Rox";
	this.bounds = {min: [-40/canvas.width, -40/canvas.height], max: [40/canvas.width, 40/canvas.height]};
	this.scale = [60/canvas.width, 40/canvas.height];
	
	this.health = 5;
	this.speed = 0.65;
	this.canJump = true;
	this.jumpSpeed = 0.4;
	this.damping = 0.5;
	this.jumpWidths = 3;
	this.dropCount = 0;
	this.startPosition = [position[0],position[1]];
	
	this.ignoreCollisions = {"Wall" : true, "Hat" : true, "Cloud" : true, "Roof" : true};
	
}
Rox.prototype = Object.create(Enemy.prototype);
Rox.prototype.constructor = Rox;
Rox.prototype.CollisionActions = Object.create(Enemy.prototype.CollisionActions);

Rox.prototype.Draw = function(canvas)
{

	if (!canvas.ctx)
		return Entity.prototype.Draw.call(this,canvas);
		
	if (this.velocity[0] >= 0)
		this.frame = this.frameBase["right"];
	else
		this.frame = this.frameBase["left"];

	var tl = canvas.LocationGLToPix(this.Left(), this.Top());
	var w = this.frame.img.width;
	var h = this.frame.img.height;
	if (this.scale)
	{
		w = this.scale[0] * canvas.width;
		h = this.scale[1] * canvas.height;
	}
	var angle = Math.atan2(this.velocity[1],Math.abs(this.velocity[0]));
	canvas.ctx.translate(tl[0]+w/2,tl[1]+h/2);
	if (this.velocity[0] < 0)
		angle = -angle;
		
	canvas.ctx.rotate(-angle);
	canvas.ctx.drawImage(this.frame.img, -w/2,-h/2, w, h);
	canvas.ctx.rotate(+angle);
	canvas.ctx.translate(-tl[0]-w/2,-tl[1]-h/2);
	
}

Rox.prototype.CollisionActions["Wall"] = function(other,instigator,game)
{
	this.velocity[0] = -this.velocity[0];
	return false;
}

Rox.prototype.CollisionActions["Floor"] = function(other,instigator,game)
{
	this.Die(other.GetName(),other,game);
	return true;
}

Rox.prototype.CollisionActions["Hat"] = function(other, instigator, game)
{
	other.Die(this.GetName(), this, game);
	if (!this.hat || !this.hat.alive) 
		this.hat = new SFXEntity(this, 1000/game.stepRate, ["data/hats/hat1_big.gif"], game.canvas,[this.Width()/2,this.Height()]);
	game.AddEntity(this.hat);
}

Rox.prototype.HandleCollision = function(other,instigator,game)
{
	var result = Enemy.prototype.HandleCollision.call(this,other,instigator,game);
	if (other.Above(this))
	{
		this.velocity[1] = other.velocity[1]/3;
		this.acceleration[1] = other.acceleration[1];
	}
	return result;
	
}

Rox.prototype.Step = function(game)
{
	var homeDisp = [0,0];
	for (var i = 0; i < this.position.length; ++i)
		homeDisp[i] = this.position[i] - this.startPosition[i];
		
		
	if (this.velocity[0] == 0)
	{
		this.velocity[0] = Math.random() > 0.5 ? this.speed : -this.speed;
	}
	this.acceleration[1] = (homeDisp[1] != 0) ? -1*homeDisp[1]/Math.abs(homeDisp[1]) : 0;
	this.acceleration[1] -= this.damping*this.velocity[1]
	if (Math.abs(homeDisp) < 0.5*this.Width())
		this.acceleration[1] = 0;
		
	if (Math.abs(this.position[0]) > 1+this.Width())
	{
		this.velocity[0] = (this.position[0] > 0) ? -Math.abs(this.velocity[0]) : Math.abs(this.velocity[0]); 
		
		if ((!this.carrying || !this.carrying.alive) && Math.random() > 0.4)
		{
			this.shield = new SFXEntity(this, 1200/game.stepRate, ["data/sfx/shield1.png"], game.canvas, [0,-this.Height()]);
			var wolf = ((++this.dropCount % 5) == 0);
			this.carrying = new SFXEntity(this, 1200/game.stepRate, ["data/"+(wolf ? "wolf" : "fox")+"/rest.gif"], game.canvas, [0,-this.Height()]);
			
			this.carrying.dropType = (wolf) ? Wolf : Fox;
			this.carrying.Die = function(cause,other,game) {
				game.AddEntity(new this.dropType(this.position, this.velocity, game.gravity, game.canvas));
				SFXEntity.prototype.Die.call(this,cause,other,game);
			}
			game.AddEntity(this.carrying);
			game.AddEntity(this.shield);
		}
	}
	
	
	var player = game.GetNearestPlayer(this.position);
	if (!player)
		return Entity.prototype.Step.call(this,game);
		
	// Calculate displacement and distance from player
	var r = [];
	var r2 = 0;
	for (var i = 0; i < this.position.length; ++i)
	{
		r[i] = player.position[i] - this.position[i];
		r2 += Math.pow(r[i],2);
	}
	
	if (r2 < this.chaseWidths*this.Width())
	{
		if (player.position[1] < this.position[1]-this.Width() && this.position[1] > -1+4*this.Height())
			this.acceleration[1] = -this.jumpSpeed;
		else if (player.position[1] > this.position[1]+this.Width())
			this.acceleration[1] = +this.jumpSpeed;
	

	}
	
	

	return Entity.prototype.Step.call(this,game);
}

Rox.prototype.Die = function(reason, other, game)
{
	Enemy.prototype.Die.call(this, reason, other, game);
	game.AddTimeout("RoxTime", function() {
		var yy = -0.5+Math.random();
		var xx = Math.random() > 0.5 ? 1 : -1;
		this.AddEntity(new Rox([xx, yy], [0,0], this.canvas));
	}.bind(game), 500*game.stepRate);
	if (!game.running) game.timeouts["RoxTime"].Pause();
}


