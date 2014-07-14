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
		this.dazed -= this.delta/1000;

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
	if (other.sleep)
	{
		other.Die(this.GetName(), this, game);
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

Wolf.prototype.Die = function(reason, other, game)
{
	Enemy.prototype.Die.call(this, reason, other, game);
	game.AddTimeout("WolfTime", function() {
		var xx = Math.random() > 0.5 ? 0.5 : -0.5;
		this.AddEntity(new Wolf([xx, 1], [0,0], this.gravity, this.canvas));
	}.bind(game), 5000*game.stepRate);
	if (!game.running) game.timeouts["WolfTime"].Pause();
}
