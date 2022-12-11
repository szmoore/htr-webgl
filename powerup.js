

function Hat(position, velocity, acceleration, canvas, game)
{
	Entity.call(this, position, velocity, acceleration, canvas, "");
	this.frame = canvas.LoadTexture("data/hats/hat1_big.gif");
	this.name = "Hat";
	this.ignoreCollisions["Roof"] = true;
	this.ignoreCollisions["Cloud"] = true;
	if (game)
		game.Message("Get the hat!");
}
Hat.prototype = Object.create(Entity.prototype);
Hat.prototype.constructor = Hat;
Hat.prototype.CollisionActions = {};


Hat.prototype.CollisionActions["Humphrey"] = function(other, instigator, game)
{
	other.GainLife(this, game);
	game.UpdateDOM(other);
	this.Die(other.GetName(), other, game);
}

Hat.prototype.CollisionActions["Hat"] = function(other,instigator, game)
{
	if (instigator)
	{
		this.position[1] = other.position[1] + 1.2*this.Height();
	}
}

Hat.prototype.HandleCollision = function(other, instigator, game)
{
	Entity.prototype.HandleCollision.call(this, other, instigator, game);
	if (other.GetName() === "Floor")
		this.Die(this.GetName(), this, game);
}


function Carrot(position, velocity, acceleration, canvas, game)
{
	Entity.call(this, position, velocity, acceleration, canvas, "");
	this.frame = canvas.LoadTexture("data/carrot/carrot2.png");
	this.name = "Carrot";
	this.ignoreCollisions["Roof"] = true;
	this.ignoreCollisions["Cloud"] = true;
	this.canJump = 4;  // How much jumpage it gives to the player
	if (game)
        game.Message("Eat the carrot!");
    this.angle = (Math.PI / 180.0) * (rand() % 180)
}
Carrot.prototype = Object.create(Entity.prototype);
Carrot.prototype.constructor = Carrot;
Carrot.prototype.CollisionActions = {};


Carrot.prototype.CollisionActions["Humphrey"] = function(other, instigator, game)
{
	other.canJump = Math.min(other.canJump + this.canJump , this.canJump);
	// Ensuring this object cannot jump, and is "below" the player, means the player can always jump again
	// (the universal model of particle physics requires particles to be above another particle in order to jump)
	this.canJump = 0
	this.position[1] = other.position[1]
	game.UpdateDOM(other);
	this.Die(other.GetName(), other, game);
}

Carrot.prototype.CollisionActions["Hat"] = function(other,instigator, game)
{
	if (instigator)
	{
		this.position[1] = other.position[1] + 1.2*this.Height();
	}
}

Carrot.prototype.HandleCollision = function(other, instigator, game)
{
	Entity.prototype.HandleCollision.call(this, other, instigator, game);
}
