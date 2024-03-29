/**
 * @file entity.js
 * @brief The Entity class represents a physical object in the game world
 */

/**
 * Create an Entity
 * @param position [x,y] position
 * @param velocity [x,y] velocity
 * @param acceleration [x,y] acceleration (eg: Due to gravity)
 * @param spritePath URL (relative to server) to sprites for the Entity
 */
function Entity(position, velocity, acceleration, canvas, spritePath)
{
	this.position = position;
	this.velocity = velocity;
	this.acceleration = acceleration;
	this.lastPosition = position;
	this.ignoreCollisions = {};
	for (var i = 0; i < this.position.length; ++i)
		this.lastPosition[i] = this.position[i];
	this.alive = true;

	this.canJump = 1;  // number of times allowed to jump
	this.speed = 0.7;
	this.stomp = 0.2;
	this.jumpSpeed = 1.2;

	this.frameRate = 3; // magic frame rate number
	this.frameNumber = 0;
	this.angle = 0;
	this.solid = true;

	this.distanceMoved = 0;
	// Time in steps the Entity has been alive
	this.step = 0;
	// Time when jumped
	this.lastJumpStep = 0;
	this.jumpPeriod = 0;

	if (canvas)
	{
		this.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width, 32/canvas.height]};
		if (spritePath)
			this.LoadSprites(canvas, spritePath);

	}

}
Entity.prototype.CollisionActions = {};


/**
 * Get the name of an Entity
 * @returns this.name if defined, otherwise "unnamed"
 */
Entity.prototype.GetName = function()
{
	return (this.name) ? this.name : "unnamed";
}

/**
 * Update the frames for an Entity based on its current state
 * @requires frameBase, sleep, velocity
 * @modifies frames
 */
Entity.prototype.UpdateFrames = function()
{
	if (!this.frameBase)
		return;

	if (typeof(this.sleep) !== "undefined" && this.sleep > 0)
	{
		this.sleep -= 0.01;
		this.sleep = Math.max(0, this.sleep);
		this.frames = this.frameBase.sleep;
	}
	else if (this.velocity[1] == 0)
	{
		if (this.velocity[0] == 0)
			this.frames = this.frameBase.rest;
		else
			this.frames = (this.velocity[0] > 0) ? this.frameBase.right : this.frameBase.left;
	}
	else if (this.velocity[1] > 0)
	{
		if (this.velocity[0] == 0)
			this.frames = this.frameBase.up;
		else
			this.frames = (this.velocity[0] > 0) ? this.frameBase.upRight : this.frameBase.upLeft;
	}
	else if (this.velocity[1] < 0)
	{
		if (this.velocity[0] == 0)
			this.frames = this.frameBase.down;
		else
			this.frames = (this.velocity[0] > 0) ? this.frameBase.downRight : this.frameBase.downLeft;
	}
}

/**
 * Set the current frame of the Entity
 * @requires frames, frameRate
 * @modifies sprite, frame
 */
Entity.prototype.UpdateFrameNumber = function()
{
	// Update frame
	if (this.frames && this.frameRate)
	{
		this.sprite = this.frames[0];
		if (!this.frameNumber) this.frameNumber = 0;
		this.frameNumber += this.delta * this.frameRate / 1000;
		this.frame = this.frames[Math.floor(this.frameNumber) % this.frames.length]
	}
}

/**
 * Step
 * TODO: Split into helpers?
 */
Entity.prototype.Step = function(game)
{
	if (!this.alive)
		return;

	this.holdFrame = false;
	var currentTime = (new Date()).getTime();
	if (!this.lastUpdateTime)
	{
		this.lastUpdateTime = currentTime;
	}

	// Try to make the physics more accurate taking into account lag
	var latency = (currentTime - this.lastUpdateTime)/game.stepRate;
	// But not too much or wierd shit happens.
	this.delta = (latency < 4) ? latency*game.stepRate : 4*game.stepRate;
	this.lastPosition = [this.position[0], this.position[1]];

	// Deal with keyboard state
	if (this.HandleKeys)
		this.HandleKeys(game.keyState);

	// Update velocity
	if (this.acceleration)
	{
		for (var i = 0; i < this.velocity.length; ++i)
			this.velocity[i] += this.delta * this.acceleration[i] / 1000;
	}

	this.UpdateFrames();


	// Update position
	for (var i = 0; i < this.position.length; ++i)
	{
		this.lastPosition[i] = this.position[i];
		if (this.velocity[i] == 0)
			continue;
		this.position[i] += this.delta * this.velocity[i] / 1000;

		// Check for collisions
		collide = this.Collision(game);
		if (collide)
		{
				// Soo... this is terribly inefficient and lazy
				// But slightly better than what I had before
				// Binary search to location of collision
				var upper = this.position[i];
				var lower = this.lastPosition[i];
				while (Math.abs(upper-lower) > 1e-3)
				{
					this.position[i] = (upper + lower)/2;
					if (this.Collides(collide))
						upper = this.position[i];
					else
						lower = this.position[i];
				}
				this.position[i] = lower;


				// Last resort?
				if (this.HandleCollision(collide, true, game))
				{
					if (this.Collides(collide))
					{
						if (collide.position[0] > this.position[0] || Math.abs(collide.Width()) == Infinity)
							this.position[0] = collide.position[0] - 1.2*this.Width();
						else
							this.position[0] = collide.position[0] + 1.2*collide.Width();
					}
					this.velocity[i] = 0;
				}
		}
	}
	if (!this.holdFrame)
		this.UpdateFrames();
	this.distanceMoved += Math.sqrt(Math.pow(this.position[0]-this.lastPosition[0],2)+Math.pow(this.position[1]-this.lastPosition[1],2))

	this.UpdateFrameNumber();

	// Error check
	var error = false;
	for (var i = 0; i < this.position.length; ++i)
	{
		if (typeof(this.position[i]) != "number" || isNaN(this.position[i]))
		{
			error = true;
			//console.error("Position "+String(i)+" of "+this.GetName()+" invalid: " + String(this.position[i]));
			this.position[i] = this.lastPosition[i];
		}
		if (typeof(this.velocity[i]) != "number" || isNaN(this.velocity[i]))
		{
			error = true;
			//console.error("Velocity "+String(i)+" of "+this.GetName()+" invalid: " + String(this.velocity[i]));
		}
		if (typeof(this.acceleration[i]) != "number" || isNaN(this.acceleration[i]))
		{
			error = true;
			//console.error("Acceleration "+String(i)+" of "+this.GetName()+" invalid: " + String(this.acceleration[i]));
		}

	}
	// Finalise step
	this.lastUpdateTime = currentTime;
	if (!error)
	{
		for (var i =0; i < this.position.length; ++i) this.lastPosition[i] = this.position[i];
	}
	// Update step number, for timing purposes.
	this.step += 1

}

Entity.prototype.Top = function() {return this.position[1] + this.bounds.max[1];}
Entity.prototype.Bottom = function()
{
	if (!this.position)
		alert("foey");
	return this.position[1] + this.bounds.min[1];
}
Entity.prototype.Left = function() {return this.position[0] + this.bounds.min[0];}
Entity.prototype.Right = function() {return this.position[0] + this.bounds.max[0];}
Entity.prototype.Width = function() {return this.bounds.max[0] - this.bounds.min[0]}
Entity.prototype.Height = function() {return this.bounds.max[1] - this.bounds.min[1]}
Entity.prototype.Dimension = function(i) {return Math.abs((i == 0) ? this.Width() : this.Height());}

/**
 * Get the actual bounding box
 */
Entity.prototype.GetBoundBox = function()
{
	var box = { min : [], max : [] };
	for (var i = 0; i < this.position.length; ++i)
	{
		box.min[i] = this.position[i];
		box.max[i] = this.position[i];
		if (this.bounds)
		{
			box.min[i] += this.bounds.min[i];
			box.max[i] += this.bounds.max[i];
		}
	}
	return box;
}


/**
 * Find Object that collides with this one
 */
Entity.prototype.Collision = function(game)
{
	for (var i = 0; i < game.entities.length; ++i)
	{
		var other = game.entities[i];

		if (!other || other === this
			|| (this.ignoreCollisions &&
				this.ignoreCollisions[other.GetName()]))
		{
			continue;
		}
		if (this.Collides(other))
			return other;
	}
}

/**
 * Detect collision
 */
Entity.prototype.Collides = function(other)
{
	if (!other.bounds || !this.bounds) return;
	if (!other.solid || !this.solid) return;

	var A = this.GetBoundBox();
	var B = other.GetBoundBox();

	var collides = true;
	for (var i = 0; i < this.position.length; ++i)
	{
		collides &= (A.min[i] <= B.max[i] && A.max[i] >= B.min[i]);
	}
	if (collides && this.spriteCollisions
		&& this.sprite && other.sprite && this.sprite.data && other.sprite.data)
	{
		tl1 = LocationGLToPix(this.Left(), this.Top());
		tl2 = LocationGLToPix(other.Left(), other.Top());
		offset = [tl2[0]-tl1[0], tl2[1]-tl1[1]];
		collides &= SpriteCollision(offset, this.sprite.data, other.sprite.data);
	}
	return collides;
}

/**
 * Handle a collision
 * @param other - Another Entity
 * @param instigator - true iff this Entity detected the collision first
 * 				 		(depends on order in game.entities)
 */
Entity.prototype.HandleCollision = function(other, instigator,game)
{
	if (this.CollisionActions && this.CollisionActions[other.GetName()])
	{
		var result = this.CollisionActions[other.GetName()].call(this,other, instigator, game);
		if (typeof(result) !== "undefined")
			return result;
	}

	if (this.ignoreCollisions && this.ignoreCollisions[other.GetName()])
		return false;
	if (instigator)
		other.HandleCollision(this, false, game);
	this.CanJump(other);
	return true;
}

Entity.prototype.CanJump = function(other)
{
	if (typeof(this.canJump) !== "undefined")
	{
		// If the other entity is capable of jumping, then it may either cancel or provide a jump to the current entity:
		if (typeof(other.canJump) === "undefined" || other.canJump <= 0)
		{
			// other can't jump; then this can jump as long as any part of the other is below it
			this.canJump = (other.Bottom() <= this.Top()) * Math.max(1, this.canJump)
		}
		else
		{
			// other can jump; then this can jump only if the *entire* of the other is below it
			// (oh, so this is why clouds can jump...)
			this.canJump = (this.Top() > other.Top()) * Math.max(1, this.canJump)
		}
	}
}




/**
 * Bounce off a surface with normal vector n
 */
Entity.prototype.Bounce = function(n, reflect)
{
	if (this.lastPosition)
	{
		for (var i = 0; i < this.lastPosition.length; ++i) this.position[i] = this.lastPosition[i];
	}

	var dot = 0;
	for (var j = 0; j < this.velocity.length; ++j)
	{
    	dot += this.velocity[j] * n[j];
	}

//	alert("Bounce normal ["+n+"] , v ["+this.velocity+"] , dot "+dot);
    for (var j = 0; j < this.velocity.length; ++j)
    {
		this.velocity[j] -= dot*n[j]; // zero in direction of normal only.
		this.position[j] += this.delta * this.velocity[j] / 1000;
		//this.lastPosition[j] = this.position[j];
	}
//	alert("velocity: ["+this.velocity+"]");
	this.canJump = 1*(typeof(this.canJump) !== "undefined")
}

/**
 * Remove entity
 */
Entity.prototype.Die = function(deathType, other, game)
{
	this.alive = false;
}



Entity.prototype.Clear = function(canvas)
{
	if (!this.frame)
		return;
	var tl = canvas.LocationGLToPix(this.Left(), this.Top());
	var w = this.frame.img.width;
	var h = this.frame.img.height;
	if (this.scale)
	{
		w = this.scale[0] * canvas.width;
		h = this.scale[1] * canvas.height;
	}
	canvas.ctx.beginPath()
	canvas.ctx.rect(tl[0], tl[1], w, h);
	canvas.ctx.fillStyle = canvas.fillStyle;
	canvas.ctx.fill();
	if (typeof(this.previousText) === 'string') {
		this.DrawText(canvas, this.previousText, canvas.fillStyle);
		this.previousText = null;
	}
}

Entity.prototype.DrawText = function(canvas, text, fillStyle)
{
	if (!canvas.ctx) return;
	var lines = text.split("\n")
	var tl = canvas.LocationGLToPix(this.Left(), this.Top());
	var w = this.frame.img.width;
	var h = this.frame.img.height;
	if (this.scale)
	{
		w = this.scale[0] * canvas.width;
		h = this.scale[1] * canvas.height;
	}
	var hh = h/lines.length;
	var old = canvas.ctx.textAlign;
	canvas.ctx.textAlign = "center";
	canvas.ctx.fillStyle = fillStyle || "black";
	lines.map((line, index) => {
		canvas.ctx.fillText(line, tl[0]+w/2, tl[1]-h + hh*(index), w);
	})
	canvas.ctx.textAlign = old;
	this.previousText = text
}

/**
 * Draw
 * Draws the Entity at its curnrent position.
 */
Entity.prototype.Draw = function(canvas, simplified)
{
	if (!this.frame) {
		return;
	}

	if (this.hidden) {
		return;
	}


	with (canvas)
	{
		if (typeof(this.description) === 'string' && !simplified) {
			this.DrawText(canvas, this.description);
		}

		if (!this.gl)
		{
			if (!ctx) return;

			var tl = LocationGLToPix(this.Left(), this.Top());
			var w = this.frame.img.width;
			var h = this.frame.img.height;
			if (this.scale)
			{
				w = this.scale[0] * width;
				h = this.scale[1] * height;
			}
			ctx.translate(tl[0]+w/2, tl[1]+h/2);
			ctx.rotate(this.angle);
			// Draw the image if it's complete

			let drewImage = this.frame.img.complete;
			try {
				if (drewImage) {
					ctx.drawImage(this.frame.img, -w/2,-h/2, w, h);
					drewImage = true;
				}
			} catch (err) {
				console.error(err);
				drewImage = false;
			}
			if (!drewImage && this.GetName() !== "SFX") {
				// console.debug(`Failed to draw image for ${this.GetName()}`);
				const oldStyle = ctx.fillStyle;
				const oldStroke = ctx.strokeStyle;
				const oldFont = ctx.oldFont;
				const oldAlign = ctx.textAlign;
				ctx.fillStyle = this.fallbackColour || "#FF0000";
				ctx.fillRect(-w/2, -h/2, w, h);
				ctx.fillStyle = oldStyle;
				ctx.font = "6pt Mono";
				ctx.textAlign = "center";
				ctx.strokeText(this.GetName() || "?", 0, -h/4);
				ctx.strokeStyle = oldStroke;
				ctx.font = oldFont;
				ctx.textAlign = oldAlign;
			}

			ctx.rotate(-this.angle);
			ctx.translate(-tl[0]-w/2, -tl[1]-h/2);
			return;
		}

		// Send position offset to shader
		gl.uniform2f(uPosition, this.position[0], this.position[1]);

		// Send vertices to shaders
		gl.bindBuffer(gl.ARRAY_BUFFER, gVerticesBuffer);
		gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

		// Setup texture to draw in shaders
		gl.bindBuffer(gl.ARRAY_BUFFER, gVerticesTextureCoordBuffer);
		gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
		gl.activeTexture(gl.TEXTURE0);
		if (this.frame.tex)
			gl.bindTexture(gl.TEXTURE_2D, this.frame.tex);
		gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

		// Set the scale of this object
		if (this.scale)
			gl.uniform2f(uScale, this.scale[0],this.scale[1]);
		else if (this.frame.img)
			gl.uniform2f(uScale, this.frame.img.width/canvas.width, this.frame.img.height/height);

		// Set vertex indices and then draw the rectangle
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gVerticesIndexBuffer);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);
	}
}


/**
 * Load sprites from a directory
 */
Entity.prototype.LoadSprites = function(canvas, imageDir)
{
	this.frameBase = {
		"rest" : [canvas.LoadTexture(imageDir+"/rest.gif")],
		"left" : [canvas.LoadTexture(imageDir+"/left1.gif"), canvas.LoadTexture(imageDir+"/left2.gif")],
		"right" : [canvas.LoadTexture(imageDir+"/right1.gif"), canvas.LoadTexture(imageDir+"/right2.gif")],
		"down" : [canvas.LoadTexture(imageDir+"/down.gif")],
		"up" : [canvas.LoadTexture(imageDir+"/up.gif")],
		"downLeft" : [canvas.LoadTexture(imageDir+"/down_left.gif")],
		"downRight" : [canvas.LoadTexture(imageDir+"/down_right.gif")],
		"upLeft" : [canvas.LoadTexture(imageDir+"/up_left.gif")],
		"upRight" : [canvas.LoadTexture(imageDir+"/up_right.gif")],
		"sleep" : [canvas.LoadTexture(imageDir+"/sleep1.gif"), canvas.LoadTexture(imageDir+"/sleep2.gif")]
	};
}


Entity.prototype.MovingTowards = function(other)
{
	return (((this.velocity[0] > 0 && other.position[0] >= this.position[0])
		|| (this.velocity[0] < 0 && other.position[0] <= this.position[0]))
		|| ((this.velocity[1] > 0 && other.position[1] >= this.position[1])
		|| (this.velocity[1] < 0 && other.position[1] <= this.position[1])));
}

Entity.prototype.Above = function(other)
{
	return (this.Bottom() < (other.Top() + 0.05*other.Height()));
}

Entity.prototype.Below = function(other)
{
	return other.Above(this);
}

Entity.prototype.RelativeVelocity = function(other)
{
	var v = [];
	for (var i = 0; i < this.velocity.length; ++i)
		v[i] = this.velocity[i] - other.velocity[i];
	return v;
}
Entity.prototype.RelativeSpeed = function(other)
{
	var s = 0;
	for (var i = 0; i < this.velocity.length; ++i)
		s += Math.pow(this.velocity[i] - other.velocity[i], 2)
	return Math.pow(s, 0.5);
}

Entity.prototype.Speed = function(other) {
	if (other) {
		return this.RelativeSpeed(other);
	}
	return this.velocity.reduce((sum, component) => sum + component*component);
}

Entity.prototype.AccelMagnitude = function() {
	return this.acceleration.reduce((sum, component) => sum + component*component);
}

Entity.prototype.TryToPush = function(other)
{
	if (this.Bottom() < other.Top())
	{
		other.velocity[0] = this.velocity[0]/2;
		if (other.Top() - this.Bottom() < 0.05*other.Height())
			this.position[1] += 0.07*other.Height();
		return true;
	}
	return false;
}

Entity.prototype.Hide = function() {
	this.hidden = true;
}
Entity.prototype.Show = function() {
	this.hidden = false;
}


function Wall(bounds, name)
{
	var position = [0,0];
	for (var i = 0; i < position.length; ++i)
	{
		if (Math.abs(bounds.min[i]) != Infinity && Math.abs(bounds.max[i]) != Infinity)
			position[i] = (bounds.min[i] + bounds.max[i])/2;
	}
	Entity.call(this, position, [0,0],[0,0],null,"");
	if (!name)
		this.name = "Wall";
	else
		this.name = name;
	this.bounds = bounds;

	// I guess the Right (TM) way is to have a Mobile() entity type
	//	So I don't have to delete random things. But hey it's Javascript.
	delete this.canJump; // walls can't jump!
	// wait, why can't walls jump, but clouds can?
}
Wall.prototype = Object.create(Entity.prototype);

function StaticEntity(position, canvas, image)
{
	Entity.call(this, position,[0,0],[0,0], canvas, "")
	if (image)
		this.frame = canvas.LoadTexture(image);
}
StaticEntity.prototype = Object.create(Entity.prototype);
StaticEntity.prototype.constructor = StaticEntity;

/**
 * Special Effects Entity class
 */

function SFXEntity(parent, life, images, canvas, offset)
{
	Entity.call(this, [parent.position[0], parent.position[1]], [0,0],[0,0], canvas, "");
	this.parent = parent;
	this.offset = (!offset) ? [0,0] : offset;
	this.frames = [];
	for (var i = 0; i < images.length; ++i)
		this.frames[i] = canvas.LoadTexture(images[i]);
	this.solid = false;
	this.life = life;
	this.name = "SFX";
	this.deathCallbacks = []
}
SFXEntity.prototype = Object.create(Entity.prototype);
SFXEntity.prototype.constructor = SFXEntity;
SFXEntity.prototype.Step = function(game) {
	if (this.life-- <= 0)
	{
		this.deathCallbacks.map(fn => fn())
		this.deathCallbacks = []
		this.Die(this.GetName(),this,game);
		return;
	}

	for (var i = 0; i < this.position.length; ++i) {
		this.position[i] = this.parent.position[i]+this.offset[i];
	}

	Entity.prototype.Step.call(this,game);

}

SFXEntity.prototype.onDeath = function(callback) {
	this.deathCallbacks.push(callback)
}
