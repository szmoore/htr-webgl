/**
 * @file box.js
 * @brief Implement Box type entities also Clouds because
 * And also VictoryBox
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
	this.fallbackColour = "#A52A2AFF";

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
	this.fallbackColour = "#AAAAAA99";

	this.bounds = {min: [-64/canvas.width, -33/canvas.width], max:[64/canvas.width, -32/canvas.width]};
	console.debug("Created cloud");
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


function VictoryBox(position, velocity, acceleration, canvas) {
	Box.call(this, position, velocity, acceleration, canvas);
	this.name = "Portal";
	console.debug(canvas)
	const baseImage = "data/box/box_victory"
	const baseExtension = ".gif"

	const frameIndexes = [... Array(5).keys()]


	this.frames = frameIndexes.map(index => canvas.LoadTexture(baseImage+String(index+1)+baseExtension))
	console.debug('frames are ', this.frames)

	this.portalEffect = null;
	this.description = "NEXT\nLEVEL";
	this.helpfulHint = "(STOMP)\n↓↓↓";

}

VictoryBox.prototype = Object.create(Box.prototype);
VictoryBox.prototype.constructor = VictoryBox;

VictoryBox.prototype.HandleCollision = function(other, instigator, game) {

	if (["Floor", "Wall", "Ceiling"].indexOf(other.GetName()) >= 0) {
		return true;
	}


	if (other !== game.player) {
		if (["Hat", "Box"].indexOf(other.GetName()) >= 0) {
			other.Die("portal", this, game);
		}
		return true;
	}
	if (other.MovingTowards(this) && other.Above(this) && other.velocity[1] < -1 && other.IsStomping(this)) {
		console.debug(`Victory! ${other.velocity[1]}`);
		if (!this.portalEffect) {
			this.portalEffect = new SFXEntity(this, 2000/game.stepRate, ["data/hats/hat1_reversed.png"], game.canvas, [0, 0]);
			this.portalEffect2 = new SFXEntity(other, 2000/game.stepRate, ["data/sfx/shield1.png"], game.canvas, [0, 0]);
			this.portalEffect.onDeath(() => {
				this.Die("victory", other, game);
				this.portalEffect = null;
				game.NextLevel();
			})
			game.AddEntity(this.portalEffect);
			game.AddEntity(this.portalEffect2);
		}
		other.Hide();
		// Hack to prevent enemies from killing the player
		other.position[0] = 100;
		other.position[1] = 100;
		this.Hide();
		return true;
	} else {
		if (this.description != this.helpfulHint) {
			const oldDescription = this.description;
			this.description = this.helpfulHint;
			game.AddTimeout("PortalHint", () => this.description = oldDescription, 1000);
		}
	}
	return Box.prototype.HandleCollision.call(this, other, instigator, game);
}
