/**
 * @file enemy.js
 * @brief Characters that chase the player
 */
 
function Enemy(position, velocity, acceleration, canvas, spritePath)
{
	Entity.call(this, position, velocity, acceleration, canvas, spritePath);
	this.dazed = 0;
	this.sleep = 0;
	this.jumpSpeed = 3;
	this.name = "Enemy";
}
Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

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
 * A Fox collided with something 
 */
Enemy.prototype.HandleCollision = function(other, instigator, game)
{
	if (instigator && other === game.player)
	{
		if (!this.sleep && !this.dazed)
		{
			other.Die(this.GetName());
		}
	}
	else if (this.CollideBox(other, instigator,game))
	{
		this.TryToJump();
	}
		
	return Entity.prototype.HandleCollision.call(this, other, instigator, game);
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
			foxesSquished += 1; // Yeah, everything is a fox...
			Debug(this.GetName() + " got squished!", true);
			this.Die()
			setTimeout(function() {Debug("", true)}, 2000);	
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

function Fox(position, velocity, acceleration, canvas, spritePath)
{
	Enemy.call(this, position, velocity, acceleration, canvas, spritePath);
	this.name = "Fox";
}
Fox.prototype = Object.create(Enemy.prototype);
Fox.prototype.constructor = Fox;
