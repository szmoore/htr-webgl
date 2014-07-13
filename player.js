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
	this.spawn = [];
	for (var i = 0; i < position.length; ++i)
		this.spawn[i] = position[i];
	this.shield = false;
	
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

Player.prototype.Die = function(deathType, other, game)
{
	if (this.shield)
	{
		//if (other)
		//	other.Die(this.GetName());
		return;
	}
	
	if (--this.lives < 0)
	{
		this.deathType = deathType;
		return Entity.prototype.Die.call(this, deathType);
	}
	else
	{
		for (var i = 0; i < this.position.length; ++i)
			this.position[i] = this.spawn[i];
			
		this.shield = true;
		game.AddTimeout("shieldExpire",function() {
				this.shield = false}.bind(this), 1000);
		game.UpdateDOM(this);
	}

}


/**
 * Collision handler for a Box
 */
Player.prototype.CollisionActions["Box"] = function(other, instigator, game)
{
	if (!instigator)
	{
		if (other.MovingTowards(this) && other.Above(this) 
		&& Math.abs(other.velocity[1] - this.velocity[1]) > 0.2 && other.velocity[1] < 0.4)
		{
			this.Die(other.GetName(), other, game);
		}
		return true;
	}
	
	if (this.IsStomping(other))
	{
		other.health -= 1;
		return true;
	}
	
	if (this.Bottom() < other.Top())
	{
		other.velocity[0] = this.velocity[0]/2;
		if (other.Top() - this.Bottom() < 0.05*other.Height())
			this.position[1] += 0.07*other.Height();
		return false;
	}
}

Player.prototype.IsStomping = function(other)
{
	return ((this.Bottom() >= other.Top()-0.1*other.Height()) && (this.velocity[1] < -2.5));
}

/**
 * Collision handler for a Fox
 */
Player.prototype.CollisionActions["Fox"] = function(other, instigator, game)
{
	if (instigator && this.IsStomping(other))
	{
		other.sleep = Math.random() * Math.abs(this.velocity[1] - other.velocity[1]) * 5;
	}
}


Player.prototype.DeathScene = function(game, onload)
{
	switch (this.deathType)
	{
		case "Box":
			image = "data/rabbit/drawing2.svg";
			text = "SQUISH!";
			game.Message("You got Squished!");
			colour = [1,0,0,0.8];
			break;
		case "Fox":
			image = "data/fox/drawing1.svg";
			text = "CHOMP!";
			game.Message("You got Eaten!");
			colour = [1,0,0,0.8];
			break;
		case "Ox":
			image = "data/ox/drawing1.svg";
			text = "STAB!";
			game.Message("You got Stabbed!");
			colour = [1,0,0,0.8];
			break;
	}
	game.canvas.SplashScreen(image, text, colour, onload);
}

Player.prototype.Draw = function(canvas)
{
	var result = Entity.prototype.Draw.call(this,canvas);
	if (this.shield)
	{
		var f = this.frame;
		this.frame = canvas.LoadTexture("data/sfx/shield1.png");
		result = Entity.prototype.Draw.call(this,canvas);
		this.frame = canvas.LoadTexture("data/hats/hat1_big.gif");
		this.position[1] += this.Height();
		result = Entity.prototype.Draw.call(this,canvas);
		this.position[1] -= this.Height();
		this.frame = f;
		
	}
	return result;
}

Player.prototype.GainLife = function(life, game)
{
	this.lives++;
	this.shield = true;
	game.AddTimeout("shieldExpire", function() {
			this.shield = false}.bind(this), 1000,game);
	game.UpdateDOM(this);	
}


function Hat(position, velocity, acceleration, canvas, game)
{
	Entity.call(this, position, velocity, acceleration, canvas, "");
	this.frame = canvas.LoadTexture("data/hats/hat1_big.gif");
	this.name = "Hat";
	this.ignoreCollisions["Roof"] = true;
	this.ignoreCollisions["Hat"] = true;
	if (game)
		game.Message("Get the hat!");
}
Hat.prototype = Object.create(Entity.prototype);
Hat.prototype.constructor = Hat;
Hat.prototype.CollisionActions = {};

Hat.prototype.CollisionActions["Humphrey"] = function(other, instigator, game)
{
	other.GainLife(this, game);
	game.UpdateDOM(player);
}

Hat.prototype.HandleCollision = function(other, instigator, game)
{
	Entity.prototype.HandleCollision.call(this, other, instigator, game);
	this.Die(this.GetName(), this, game);
}

