/**
 * @file player.js
 * @brief The main player
 */

function Player(position, velocity, acceleration, canvas, spritePath)
{
	Entity.call(this, position, velocity, acceleration, canvas, spritePath);
	this.stomp = 0.2;
	this.lives = 0;
	this.name = "Humphrey";
	
}
Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;
Player.prototype.CollisionActions = {}; // this is slightly whack

Player.prototype.HandleKeys = function(keys)
{
	this.velocity[0] = 0;
	if (keys[37] || keys[65]) 
	{
		this.velocity[0] -= this.speed; // left or A
		//console.log("Left");
	}
	if (keys[39] || keys[68]) 
	{
		this.velocity[0] += this.speed; // right or D
		//console.log("Right");
	}

	if (this.canJump && (keys[38] || keys[87])) // up or W
	{
		this.velocity[1] = this.jumpSpeed;
		this.canJump = false;
		//console.log("Jump");
	}
	if ((keys[40] || keys[83]) && this.velocity[1] > -5) // down or S
		this.velocity[1] -= this.stomp;
}

Player.prototype.Die = function(deathType)
{
	if (this.lives <= 0)
	{
		this.deathType = deathType;
		return Entity.prototype.Die.call(this, deathType);
	}
}

Player.prototype.HandleCollision = function(other, instigator, game)
{
	var action = Player.prototype.CollisionActions[other.GetName()];
	var base;
	if (action)
		base = action.call(this, other, instigator, game);
		
	if (typeof(base) === "undefined")
		return Entity.prototype.HandleCollision.call(this, other, instigator, game);
	return base;
}

/**
 * Collision handler for a Box
 */
Player.prototype.CollisionActions["Box"] = function(other, instigator, game)
{
	if (!instigator && other.MovingTowards(this) && other.Above(this) && other.velocity[1] < -0.5)
	{
		this.Die(other.GetName());
		return true;
	}
	if (instigator && this.Bottom() < other.Top())
	{
		other.velocity[0] = this.velocity[0]/2;
		if (other.Top() - this.Bottom() < 0.05*other.Height())
			this.position[1] += 0.07*other.Height();
		return false;
	}
}


/**
 * Collision handler for a Fox
 */
Player.prototype.CollisionActions["Fox"] = function(other, instigator, game)
{
	
}

Player.prototype.DeathScene = function(game)
{
	switch (this.deathType)
	{
		case "Box":
			image = "data/rabbit/drawing2.svg";
			text = "SQUISH!";
			colour = [1,0,0,0.8];
			break;
		case "Fox":
			image = "data/fox/drawing1.svg";
			text = "You got Eaten!";
			colour = [1,0,0,0.8];
			break;
		case "Ox":
			image = "data/ox/drawing1.svg";
			text = "You got Stabbed!";
			colour = [1,0,0,0.8];
			break;
	}
	game.canvas.SplashScreen(image, text, colour);
}
