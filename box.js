/**
 * @file box.js
 * @brief Implement Box type entities also Clouds because
 * @requires entity.js
 */

function Box(position, velocity, acceleration, canvas)
{
	Entity.call(this, position, velocity, acceleration, canvas, "");
	this.index = Math.round(1 + Math.random());
	this.frame = canvas.LoadTexture("data/box/box"+this.index+".gif");
	this.damagedFrame = canvas.LoadTexture("data/box/box"+this.index+"_damaged.gif");
	this.name = "Box";
	this.ignoreCollisions["Roof"] = true;
	this.health = 2+Math.random()*4;
	
}
Box.prototype = Object.create(Entity.prototype);
Box.prototype.constructor = Box;


Box.prototype.Step = function(game)
{
	if (this.position[1] > 0.9)
		this.acceleration = [0.5*game.gravity[0], 0.5*game.gravity[1]];
	else
		this.acceleration = game.gravity;
		
	if (this.health < 1)
		this.frame = this.damagedFrame; 
	Entity.prototype.Step.call(this, game);
	if (Math.abs(this.position[0]) > 1.2)
	{
		this.Die();
		return;
	}
	
	if (Math.abs(this.velocity[0]) < 1e-2)
		this.velocity[0] = 0;
	else if (Math.abs(this.velocity[0]) <= 0.5 
		&& Math.abs(this.acceleration[0]) < 1e-12)
		this.velocity[0] /= 4;
}

/**
 * Box Collision
 */
Box.prototype.HandleCollision = function(other, instigator, game)
{
	if (instigator)
	{
		if (Math.abs(this.velocity[0]) > 0)
			this.velocity[0] /= 2;
		return Entity.prototype.HandleCollision.call(this,other, instigator,game);
	}
	
	if (other.Top() - this.Bottom() < 0.05*other.Height())
			this.position[1] += 0.07*other.Height();
		
	
	if (other.GetName() == "Box" && other.Top() > this.Top())
	{
			
		this.health -= Math.min(1.0, Math.abs(Math.random()*other.velocity[1]));
		if (this.health <= 0)
			this.Die();
	}
	
	if (other.GetName() == "Wall")
	{
		return true;
	}
	this.acceleration = game.gravity;
	
	return Entity.prototype.HandleCollision.call(this,other,instigator);
}


function Cloud(position, canvas)
{
	var vx = position[0] < -1 ? 0.5*Math.random() : -0.5*Math.random();
	Entity.call(this, position, [vx,0], [0,0], canvas, "");
	this.frame = canvas.LoadTexture("data/cloud/cloud1.png");
	this.name = "Cloud";
	this.ignoreCollisions = Cloud.prototype.ignoreCollisions;
	this.ignoreCollisions["Roof"] = true;
	this.ignoreCollisions["Wall"] = true;
	
	
	this.bounds = {min: [-64/canvas.width, -33/canvas.width], max:[64/canvas.width, -32/canvas.width]};
	console.log("Created cloud");
}
Cloud.prototype = Object.create(Entity.prototype);
Cloud.prototype.constructor = Cloud;
Cloud.prototype.ignoreCollisions = [];

Cloud.prototype.Step = function(game)
{
	Entity.prototype.Step.call(this, game);
	if (Math.abs(this.position[0]) > 1.2)
	{
		this.Die(this.GetName(), this, game);
		return;
	}
	
	if (Math.abs(this.velocity[0]) <= 0)
	{
		this.Die(this.GetName(), this, game);
	}
}

Cloud.prototype.HandleCollision = function(other, instigator, game)
{
	Cloud.prototype.ignoreCollisions[other.GetName()] = true;
	// This seems really horrible but it is simpler than manually adding it to all objects?
	other.CollisionActions["Cloud"] = Cloud.prototype.CloudCollisionHandler;
	// pass
	return false;
}


/**
 * Collision handler for a cloud
 */
Cloud.prototype.CloudCollisionHandler = function(other, instigator, game)
{
	if (instigator && this.Bottom() <= other.Top())
	{
		this.position[0] += this.velocity[0]*this.delta/2000;
		this.position[1] += this.velocity[1]*this.delta/2000;
		return false;
	}
	this.canJump = true;
	return true;
}
