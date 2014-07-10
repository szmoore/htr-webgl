/**
 * @file box.js
 * @brief Implement Box entity
 *  A "Box"
 * @requires entity.js
 */

function Box(position, velocity, acceleration, canvas, spritePath)
{
	Entity.call(this, position, velocity, acceleration, canvas, "");
	this.frame = canvas.LoadTexture(spritePath);
	this.name = "Box";
	this.ignoreCollisions["Roof"] = true;
	this.health = 4 + Math.random()*16;
	
}
Box.prototype = Object.create(Entity.prototype);
Box.prototype.constructor = Box;


Box.prototype.Step = function(game)
{
	Entity.prototype.Step.call(this, game);
	if (Math.abs(this.position[0]) > 1.2)
	{
		this.Die();
		return;
	}
	
	if (Math.abs(this.velocity[0]) < 1e-2)
		this.velocity[0] = 0;
	else if (Math.abs(this.velocity[0]) < 0.5 
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
		if (this.position[0] > 1) this.position[0] = 0.9;
		if (this.position[0] < -1) this.position[0] = -0.9;
		return false;
	}
	this.acceleration = game.gravity;
	
	return Entity.prototype.HandleCollision.call(this,other,instigator);
}

