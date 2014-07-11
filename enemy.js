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
	if (r2 < 15*this.Width())
	{
		if (Math.abs(r[0]) < 1.5*this.Width() && 
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

		// Jump!
		if (player.Bottom() > this.Top())
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
			game.AddHat();
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
	Enemy.call(this, position, velocity, acceleration, canvas, "data/fox/");
	this.name = "Fox";
	this.speed = 0.5;
	this.jumpSpeed = 0.7;
	this.canJump = false;
}
Fox.prototype = Object.create(Enemy.prototype);
Fox.prototype.constructor = Fox;

Fox.prototype.Die = function(reason, other, game)
{
	if (other.GetName() == "Box")
		game.Message(this.GetName()+" got Squished!", 2000);
	Entity.prototype.Die.call(this, reason, other, game);
}
