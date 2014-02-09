/**
 * Humphrey The Rabbit - In glorious WebGL Form
 *
 * tl;dr A game where you play as a Rabbit who must avoid Foxes and Boxes. 
 *
 * History that is only of significance to the author:
 * Humphrey The Rabbit was originally written using pygame (Python 2.7) in 2012 whilst attempting to improve my Python after years of trying to ignore its existance.
 * Now I am attempting to improve my JavaScript after years of trying to ignore its existance, so its time to reinvent some wheels and rewrite Humphrey The Rabbit.
 * One day it'll probably get rewritten in C++ where it belongs.
 * 
 * Credits:
 * Sprites are from Biots.
 *
 * Sam Moore, 2014
 */

/** The canvas **/
var canvas;
/** gl context **/
var gl;
	

/** GL Shader Program **/
var shaderProgram;

/** GL Vertex Shader Attributes **/
var aVertexPosition;
var aTextureCoord;

/** GL Vertex Shader Uniforms **/
var uPosition;
var uAspectRatio;
var uColour;

/** GL Buffers **/
var gVerticesBuffer;
var gVerticesTextureCoordBuffer;
var gVerticesIndexBuffer;

/** Other globals **/
var stepRate = 15;
var keysPressed = [];
var player;
var gravity = 1.0;

var drawSceneTimer;
var addEnemyTimer;
var addEnemyCount = 0;
var runTime = 0;

var startTime;
var stepCount = 0;
var foxesSquished = 0;
var foxesDazed = 0;
var boxesSquished = 0;

/**
 * Debug; display information on the page (for most things this is much nicer than Alt-Tabbing to and fro with Firebug)
 */
function Debug(html, clear)
{
	var div = document.getElementById("debug");
	if (div)
	{
		div.innerHTML = html;
		if (html == "")
			div.innerHTML="<font color=\"white\">...</font>"
	}
}

/**
 * Game Entity
 */
function Entity(position, velocity)
{
	this.position = position;
	this.velocity = velocity;
	this.lastPosition = []; for (var i in this.position) this.lastPosition[i] = this.position[i];
}

/**
 * Name of Entity
 */
Entity.prototype.GetName = function()
{
	return (this.name) ? this.name : "unnamed";
}

/**
 * Step
 * TODO: Split into helpers?
 */
Entity.prototype.Step = function()
{
	var currentTime = (new Date()).getTime();
	if (!this.lastUpdateTime)
	{
		this.lastUpdateTime = currentTime;
		return;
	}
	this.delta = currentTime - this.lastUpdateTime;

	this.lastPosition = [];

	// Deal with keyboard state
	if (this.handleKeys)
		this.handleKeys(keysPressed);

	// Update velocity
	if (this.acceleration)
	{
		for (var i in this.velocity)
			this.velocity[i] += this.delta * this.acceleration[i] / 1000;
	}

	// Update position
	for (var i in this.position)
	{
		if (this.velocity[i] == 0) continue;
		this.lastPosition[i] = this.position[i];
		this.position[i] += this.delta * this.velocity[i] / 1000;

		// Check for collisions
		collide = this.Collision();
		if (collide)
		{
				// Soo... this is terribly inefficient and lazy
				// I can't be bothered looking up vector maths
				// (And it seems I couldn't last time I wrote HtR)
				this.position[i] = this.lastPosition[i];
				while (!this.Collides(collide))
					this.position[i] += this.delta * 0.05 * this.velocity[i] / 1000;
				this.position[i] -= this.delta * 0.05 * this.velocity[i] / 1000;
				if (this.HandleCollision(collide,true))
					this.velocity[i] = 0;
		}
	}


	// Change sprite based on direction
	if (this.frameBase)
	{
		if (this.sleep && this.sleep > 0)
			this.frames = this.frameBase.sleep;
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

	// Update frame
	if (this.frames && this.frameRate)
	{
		if (!this.frameNumber) this.frameNumber = 0;
		this.frameNumber += this.delta * this.frameRate / 1000;
		this.frame = this.frames[Math.floor(this.frameNumber) % this.frames.length]
	}

	// Finalise step
	this.lastUpdateTime = currentTime;
	for (var i in this.position) this.lastPosition[i] = this.position[i];
}

Entity.prototype.Top = function() {return this.position[1] + this.bounds.max[1];}
Entity.prototype.Bottom = function() {return this.position[1] + this.bounds.min[1];}
Entity.prototype.Left = function() {return this.position[0] + this.bounds.min[0];}
Entity.prototype.Right = function() {return this.position[0] + this.bounds.max[0];}
Entity.prototype.Width = function() {return this.bounds.max[0] - this.bounds.min[0]}
Entity.prototype.Height = function() {return this.bounds.max[1] - this.bounds.min[1]}

/**
 * Get the actual bounding box
 */
Entity.prototype.GetBoundBox = function()
{
	var box = { min : [], max : [] };
	for (var i in this.position)
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
Entity.prototype.Collision = function()
{
	for (var i in gEntities)
	{
		if (gEntities[i] === this) continue;
		if (this.ignoreCollisions && this.ignoreCollisions[gEntities[i].GetName()]) continue;
		if (this.Collides(gEntities[i])) return gEntities[i];
	}
}

/**
 * Detect collision
 */
Entity.prototype.Collides = function(other)
{
	if (!other.bounds || !this.bounds) return;


	var A = this.GetBoundBox();
	var B = other.GetBoundBox();

	var collides = true;
	for (var i in this.position)
	{
		collides &= (A.min[i] <= B.max[i] && A.max[i] >= B.min[i]);
	}
	return collides;
}

/**
 * Deal with a collision
 */
Entity.prototype.HandleCollision = function(other, instigator)
{
	if (this.ignoreCollisions && this.ignoreCollisions[other.GetName()]) return false;	
	if (instigator)
		other.HandleCollision(this, false);
	if (typeof(this.canJump) !== "undefined") 
	{
		this.canJump = (other.Bottom() <= this.Top());
	}	
	return true;
}


/**
 * Bounce off a surface with normal vector n
 */
Entity.prototype.Bounce = function(n, reflect)	
{
	if (this.lastPosition)
	{
		for (var i in this.lastPosition) this.position[i] = this.lastPosition[i];
	}
    
	var dot = 0;
	for (var j in this.velocity)
	{
    	dot += this.velocity[j] * n[j];
	}

//	alert("Bounce normal ["+n+"] , v ["+this.velocity+"] , dot "+dot);
    for (var j in this.velocity)
    {
		this.velocity[j] -= dot*n[j]; // zero in direction of normal only.
		this.position[j] += this.delta * this.velocity[j] / 1000;
		//this.lastPosition[j] = this.position[j];
	}
//	alert("velocity: ["+this.velocity+"]");
	this.canJump = (typeof(this.canJump) !== "undefined")
}

/**
 * Remove entity
 */
Entity.prototype.Die = function()
{
	var index = gEntities.indexOf(this);
	if (index > -1 && index < gEntities.length)
	{
		gEntities.splice(index, 1);
	}
	else
	{
		alert("Entities can't die in IE<9 because IE is dumb.");
	}	
}


/**
 * Draw
 * Draws the Entity at its current position.
 */
Entity.prototype.Draw = function()
{
	if (!this.frame)
		return;
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
		gl.uniform2f(uScale, this.frame.img.width/canvas.width, this.frame.img.height/canvas.height);

	// Set vertex indices and then draw the rectangle
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gVerticesIndexBuffer);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);

}

/**
 * Load sprites from a directory
 */
Entity.prototype.LoadSprites = function(imageDir)
{
	this.frameBase = {
		"rest" : [LoadTexture(imageDir+"/rest.gif")],
		"left" : [LoadTexture(imageDir+"/left1.gif"), LoadTexture(imageDir+"/left2.gif")],
		"right" : [LoadTexture(imageDir+"/right1.gif"), LoadTexture(imageDir+"/right2.gif")],
		"down" : [LoadTexture(imageDir+"/down.gif")],
		"up" : [LoadTexture(imageDir+"/up.gif")],
		"downLeft" : [LoadTexture(imageDir+"/down_left.gif")],
		"downRight" : [LoadTexture(imageDir+"/down_right.gif")],
		"upLeft" : [LoadTexture(imageDir+"/up_left.gif")],
		"upRight" : [LoadTexture(imageDir+"/up_right.gif")],
		"sleep" : [LoadTexture(imageDir+"/sleep1.gif"), LoadTexture(imageDir+"/sleep2.gif")]
	};
}


function BoxStep()
{
	Entity.prototype.Step.call(this);
	if (this.velocity[0] < 1e-2)
		this.velocity[0] = 0;
	else
		this.velocity[0] /= 4;
}

/**
 * WHAT DOES THE FOX STEP
 */
function FoxStep()
{
	//Alternate joke... it's like DubStep mixed with the FoxTrot
	// Ho! ho! ho! ... I am talking to myself in JavaScript comments...
	// If you read this please send help, I am trapped in a pun factory.
	if (this.dazed && this.dazed > 0)
		this.dazed -= this.delta/1000;

	if (!player || (this.sleep && this.sleep > 0) || (this.dazed && this.dazed > 0))
	{
		return BoxStep.call(this);
	}
	// Calculate displacement and distance from player
	var r = [];
	var r2 = 0;
	for (var i in this.position) 
	{
		r[i] = player.position[i] - this.position[i];
		r2 += Math.pow(r[i],2);
	}

	// If closer than a 225 FoxWidths (an SI unit)...
	if (r2 < 15*this.Width())
	{
		// If not moving and super close, randomly move
		/*if (Math.abs(r[0]) < 0.5*this.Width())
		{
			this.velocity[0] = 0;
		}*/
		if (Math.abs(r[0]) < 1.5*this.Width() && Math.abs(this.velocity[0]) < 0.5*this.speed)
		{
			this.velocity[0] = (Math.random() > 0.5) ? -this.speed : this.speed;
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
		{
			if (this.canJump)
			{
				this.canJump = false;
				this.velocity[1] = this.jumpSpeed;
			}
		}
	}
	else
		this.velocity[0] = 0;	

	Entity.prototype.Step.call(this);
}

/**
 * Box Collision
 */
function BoxHandleCollision(other, instigator)
{
	if (!instigator)
	{
		if (other.GetName() == "Box" && other.Top() > this.Top())
		{
			this.health -= Math.min(1.0, Math.abs(Math.random()*other.velocity[1]));
			if (this.health <= 0)
			{
				boxesSquished += 1;
				this.Die();
			}
		}
	}
	return Entity.prototype.HandleCollision.call(this,other,instigator);
}

/**
 * Add a Box
 */
function AddBox()
{
	Debug("Box Time!", true);
	setTimeout(function() {Debug("",true)}, 200*stepRate);
	var box = new Entity([player.position[0],1.1],[0,0]);
	box.frame = LoadTexture("data/box/box1.gif");
	box.acceleration = [0,-gravity];
	box.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width, 32/canvas.height]};
	box.name = "Box";
	box.ignoreCollisions = {"Roof" : true};
	box.health = 5;
	box.HandleCollision = BoxHandleCollision;
	box.Step = BoxStep;
	gEntities.push(box);
	return box;
}

/**
 * Add Enemy
 */
function AddEnemy()
{
	addEnemyCount += 1;
	if (addEnemyCount % 5 == 0)
		AddFox();
	else
		AddBox();
}


/**
 * A Fox collided with something 
 */
function FoxHandleCollision(other, instigator)
{
	if (other === player && instigator)
	{
		
		if (this.dazed && this.dazed > 0)
		{
		//	Debug("dazy fox " + this.dazed);
		}
		//Debug((this.velocity[1] < 0 && other.position[1] <= this.position[1]), true);
		// Erm... Only eat the player if moving directly towards them.
		else if (((this.velocity[0] > 0 && other.position[0] >= this.position[0])
			|| (this.velocity[0] < 0 && other.position[0] <= this.position[0]))
			|| ((this.velocity[1] > 0 && other.position[1] >= this.position[1])
			|| (this.velocity[1] < 0 && other.position[1] <= this.position[1]))) 
		{
			player.Death("EATEN");
		}
	}	
	else if (other.GetName() == "Box")
	{
		if (!instigator && other.velocity[1] <= -0.1)
		{
			foxesSquished += 1;
			Debug(this.GetName() + " got squished!", true);
			this.Die();
			setTimeout(function() {Debug("",true)}, 2000);
			return false;
		}
		// Non sleepy foxes can jump over boxes.
		if (this.canJump && (!this.sleep || this.sleep < 0) && (!this.dazed || this.dazed < 0))
		{
			this.canJump = false;
			this.velocity[1] = this.jumpSpeed;
		}
		else
			this.canJump = true;
		return false;
	}
	return Entity.prototype.HandleCollision.call(this, other, instigator);
}

/**
 * Add a Fox
 */
function AddFox()
{
	Debug("Fox Time!", true);
	setTimeout(function() {Debug("",true)}, 200*stepRate);
	var fox = new Entity([player.position[0],1],[0,0]);
	fox.LoadSprites("data/fox");
	fox.acceleration = [0,-gravity];
	fox.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width,32/canvas.height]};
	fox.name = "Fox";
	fox.frameRate = 3;
	fox.Step = FoxStep;
	fox.HandleCollision = FoxHandleCollision;
	fox.speed = 0.5;
	fox.jumpSpeed = 0.5;
	fox.canJump = false; // Foxes jumping at birth is hard.
	fox.ignoreCollisions = {"Roof" : true};
	gEntities.push(fox);
	return fox;
}

/**
 * Load the initial Entities
 */
function LoadEntities()
{
	gEntities = [];
	
	// The player (Humphrey The Rabbit)
	player = new Entity([0,0],[0,0]);
	player.LoadSprites("data/rabbit");
	player.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width, 32/canvas.height]};
	player.frameRate = 3;
	player.canJump = true;
	player.acceleration = [0, -gravity]; // gravity
	// Handle any keys pressed
	player.handleKeys = function(keys)
	{
		this.velocity[0] = 0;
		if (keys[37]) this.velocity[0] -= 0.7;
		if (keys[39]) this.velocity[0] += 0.7;
		if (this.canJump && keys[38])
		{
			this.velocity[1] = 1.2;
			this.canJump = false;
		}
		if (keys[40] && this.velocity[1] > -3)
			this.velocity[1] -= 0.2;
	}

	player.Death = function(cause)
	{
		PauseGame();
		player = undefined;
		if (cause == "EATEN")
			EatenScreen("YOU GOT EATEN!");
		else
			SquishScreen("YOU GOT SQUISHED");
		
		// Send results to the stat collecting script
		var xmlhttp = new XMLHttpRequest(); // IE<7 won't WebGL anyway, screw compatibility
		
		xmlhttp.onreadystatechange = function() {
			// Don't really need to do anything.
		};
		var request = "death="+cause;
		request += "&x="+this.position[0]+"&y="+this.position[1];
		request += "&start="+startTime.getTime()+"&runtime="+runTime;
		request += "&steps="+stepCount;
		request += "&foxesSquished="+foxesSquished+"&foxesDazed="+foxesDazed;
		request += "&boxesSquished="+boxesSquished;
		xmlhttp.open("POST", "stats.py", true); //POST just because its BIG
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.setRequestHeader("Content-length", request.length);
		xmlhttp.setRequestHeader("Connection", "close");
		xmlhttp.send(request);		

		// Restart the game
		setTimeout(StartGame,2000);
	}
	// Handle collision with box
	player.HandleCollision = function(other, instigator)
	{
		if (other.GetName() == "Box")
		{
			if (!instigator && other.velocity[1] < -0.1)
			{
				this.Death("SQUISHED");
				return true;
			}
		}
		else if (other.GetName() == "Fox" && instigator)
		{
			if ((this.Bottom() >= other.Top()-0.1*other.Height()) && (this.velocity[1] < -2.5))
			{
				foxesDazed += 1;
				other.sleep = Math.random() * Math.abs(this.velocity[1] - other.velocity[1]) * 5;
			}
		}
		
		if (instigator && this.Bottom() < other.Top() && this.Top() > other.Bottom())
		{
			if (other.GetName() == "Box" || other.sleep) other.velocity[0] = this.velocity[0] / 2;
			if (other.sleep && other.sleep > 0)
			{
				other.sleep -= this.velocity[0] / 2;
				if (other.sleep < 0)
					other.dazed = 0.5 + Math.random();
			}
			// Behold... inheritence implemented in JavaScript (Yuk)
			Entity.prototype.HandleCollision.call(this,other, instigator);
			return false;
		}
		
		return Entity.prototype.HandleCollision.call(this,other, instigator);
	}
	player.name = "Humphrey";

	var ground = new Entity([-1,-1],[0,0]);
	ground.bounds = {min: [-Infinity,-Infinity], max:[Infinity, 0]};
	ground.Bounce = function() {};
	ground.name = "Ground";

	var leftWall = new Entity([-1,1],[0,0]);
	leftWall.bounds = {min: [-Infinity,-Infinity], max:[0,Infinity]};
	leftWall.Bounce = function() {};
	leftWall.name = "LeftWall";

	var rightWall = new Entity([1,1],[0,0]);
	rightWall.bounds = {min: [0,-Infinity], max:[Infinity,Infinity]};
	rightWall.Bounce = function() {};
	rightWall.name = "RightWall";

	var roof = new Entity([-1,0.9],[0,0]);
	roof.bounds = {min : [-Infinity,0], max:[Infinity,Infinity]};	
	roof.name = "Roof";

	if (typeof(AIStep) === "function")
	{
		var controller = new Entity([-2,-2],[0,0]);
		controller.Step = function()
		{
			var player = CopyEntitiesByName("Humphrey");
			var foxes = CopyEntitiesByName("Fox");
			var boxes = CopyEntitiesByName("Box");
			var directions = AIStep(player, foxes, boxes);
			keysPressed[37] = (directions.right === true);
			keysPressed[38] = (directions.up === true);
			keysPressed[39] = (directions.left === true);
			keysPressed[40] = (directions.down === true);	
		}
		gEntities.push(controller);	
	}
	gEntities.push(player);
	gEntities.push(ground);
	gEntities.push(leftWall);
	gEntities.push(rightWall);
	gEntities.push(roof);
}

function CopyEntitiesByName(name)
{
	var result = [];
	for (var i in gEntities)
	{
		if (gEntities[i].GetName() === name)
		{
			var topush = {
				x : gEntities[i].position[0],
				y : gEntities[i].position[1],
				vx : gEntities[i].velocity[0],
				vy : gEntities[i].velocity[1],
				top : gEntities[i].Top(),
				bottom : gEntities[i].Bottom(),
				left : gEntities[i].Left(),
				right : gEntities[i].Right(),
				width : gEntities[i].Width(),
				height : gEntities[i].Height(),
				canJump : gEntities[i].canJump,
				asleep : (gEntities[i].sleep && gEntities[i].sleep > 0)
			};
			result.push(topush);
		}
	}
	return result;
}

function SquishScreen(text) {SplashScreen([0,0,0,1],[1,0,0,1], "rabbit", text)}
function EatenScreen(text) {SplashScreen([0,0,0,1],[1,1,1,1], "fox", text)}
function StartScreen() {SplashScreen([0.9,0.9,0.9,1],[1,1,1,1], "rabbit", "Humphrey The Rabbit")}
function VictoryScreen() {SplashScreen([0.5,1,0.5,1],[1,1,1,1], "rabbit", "YOU WON!")}

function SplashScreen(background, blend, type, text)
{
	var screen = new Entity([0,0], [0,0]);
	var file = "data/fox/drawing1.svg";
	if (type != "fox")
	{
		var X = Math.round(1 + (Math.random()*6));
		file = "data/rabbit/drawing"+X+".svg";	
	}
	screen.scale = [0.6, 0.6]; 

	screen.frame = LoadTexture(file, function() {
		var ratio = (screen.frame.img.width / screen.frame.img.height);
		gl.clearColor(background[0], background[1], background[2], background[3]);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform4f(uColour, blend[0], blend[1], blend[2], blend[3]);
		screen.Draw();
		gl.uniform4f(uColour,1,1,1,1); 
		if (text)
			Debug("<b><i>"+text+"</i></b>", true);
	});
}

/**
 * Start the game
 */
function StartGame()
{
	startTime = new Date;
	stepCount = 0;
	foxesSquished = 0;
	foxesDazed = 0;
	boxesSquished = 0;
	


	runTime = 0;
	LoadEntities();
	Debug("GET READY!",true);
	setTimeout(function() {Debug("",true)}, stepRate*500);
	ResumeGame();
}

/**
 * Pause the game
 */
function PauseGame()
{
	if (drawSceneTimer) clearTimeout(drawSceneTimer);
	if (addEnemyTimer) clearTimeout(addEnemyTimer);

	var audio = document.getElementById("theme"); 
	if (audio)
	{
		audio.pause();
	}
	
	var resume = document.getElementById("pause");
	if (resume)
	{
		resume.innerHTML = "resume";
		resume.onclick = ResumeGame;
	}
	
	
}

/**
 * Resume the game
 */
function ResumeGame()
{
	gl.clearColor(0.9,0.9,1,1);
	if (drawSceneTimer) clearTimeout(drawSceneTimer);
	if (addEnemyTimer) clearTimeout(addEnemyTimer);
	drawSceneTimer = setInterval(DrawScene, stepRate);
	addEnemyTimer = setInterval(AddEnemy, stepRate*300);

	var audio = document.getElementById("theme"); 
	if (audio)
	{
		audio.pause();
		audio.currentTime = 0;
		setTimeout(function() {audio.play()}, 200);
	}
	var pause = document.getElementById("pause");
	if (pause)
	{
		pause.innerHTML = "pause";
		pause.onclick = PauseGame;
	}
	
}

/**
 * You win!
 * ...
 * Or did you?
 */
function Victory()
{
	PauseGame();
	VictoryScreen();
	setTimeout(function() {
		Debug("<i><b>...</b></i>",true);
		setTimeout(function() {
			Debug("Or did you?",true);
			setTimeout(function() {
				Debug("<i><b>THERE IS NO ESCAPE</b></i>", true)
				setTimeout(ResumeGame, 2000);
			}, 2000);
		}, 2000);
	}, 1000);
}

/**
 * The main function
 */
function main() 
{
	var audio = document.getElementById("theme");
	if (audio)
		audio.addEventListener("ended", Victory);
	canvas = document.getElementById("glcanvas");
	InitWebGL(canvas);      // Initialize the GL context


	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	gl.clearColor(0.9, 0.9, 1.0, 1.0); // Set clear colour 
	gl.viewport(0,0,canvas.width,canvas.height); // Set viewport (unnecessary?)
	//gl.disable(gl.DEPTH_TEST); // No point using depth testing for 2D graphics
	//gl.depthFunc(gl.LEQUAL);
	//gl.clearDepth(1.0);
    
	// Initialise the buffer objects
	InitBuffers();

    	// Initialize the shaders; this is where all the lighting for the
	// vertices and so forth is established.
	InitShaders();

	// Keyboards
	document.onkeydown = function(event) {keysPressed[event.keyCode] = true};
	document.onkeyup = function(event) {keysPressed[event.keyCode] = false};

	/*
	canvas.onmousedown = function(event)
	{	
		if (typeof(player) === "undefined")
			return;

		var thing;
		if (event.which === 1)
			thing = AddFox();
		else if (event.which === 2)
			thing = AddBox();	
		
		if (thing)
		{
			var x = -1 + 2*(event.clientX/canvas.width);
			var y = 1 - 2*(event.clientY/canvas.height);
			thing.position = [x,y];
		}
	}
	*/

	// Start the Game.
	StartScreen();
	setTimeout(StartGame, 500);
}

function About()
{
	PauseGame();
	StartScreen();
	alert("Humphrey The Rabbit: WebGL\n\nProgramming: Sam Moore\nGraphics: Nekopets, A Joseph Reume, Sam Moore\nMusic: Sam Moore\n\nControls: arrows\n\n\"Avoid the Foxes and Boxes\"\n\nGitHub: https://github.com/szmoore/HtR_WebGL\n\nLicense: GPL 2");
	ResumeGame();
}

/**
 * Draw the Scene and perform Steps
 */
function DrawScene()
{
	var curTime = (new Date()).getTime();
	if (!this.lastTime)
	{
		runTime += stepRate/1000;
	}
	else
	{
		runTime += curTime - this.lastTime;
	}
	this.lastTime = curTime;
	var rt = document.getElementById("runtime");
	if (rt) rt.innerHTML=(""+runTime/1000).toHHMMSS();
	
	gl.clearColor(0.9,0.9,1,1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (var i in gEntities)
	{
		gEntities[i].Draw();
		gEntities[i].Step();
	}
	stepCount += 1;
}

/**
 * Initialize WebGL, returning the GL context or null if
 * WebGL isn't available or could not be initialized.
 */
function InitWebGL() 
{
	gl = null;
	try
	{
	    gl = canvas.getContext("experimental-webgl");
	}
	catch(e) {}
  
	// If we don't have a GL context, give up now
	if (!gl)
		alert("Unable to initialize WebGL. Your browser may not support it.");

}

/**
 * Load textures
 */
function LoadTexture(src, lambda)
{
	var texture = gl.createTexture();
	var image = new Image();
	image.src = src; 
	if (lambda)
		image.onload = function() {HandleTextureLoaded(image, texture); lambda()};
	else
		image.onload = function() {HandleTextureLoaded(image, texture)};
	return {tex : texture, img : image};
}



/**
 * When a texture is loaded, do this
 */
function HandleTextureLoaded(image, texture)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);

	if ((image.width & (image.width - 1)) != 0 || (image.height & (image.height - 1)) != 0)
	{
		var canvas = document.createElement("canvas");
		var w = image.width; var h = image.height;
		--w; for (var i = 1; i < 32; i <<= 1) w = w | w >> i; ++w;
		--h; for (var i = 1; i < 32; i <<= 1) h = h | h >> i; ++h;
		canvas.width = w;
		canvas.height = h;
		var ctx = canvas.getContext("2d");
		
		ctx.drawImage(image, w/2 - image.width/2, h/2 - image.height/2, image.width, image.height);
		//ctx.font = "30px Courier";
		//ctx.fillText("hello world\nhow are you", 0.1*w, h/2, 0.8*w);
		/*
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(w,0);
		ctx.lineTo(w,h);
		ctx.lineTo(0,h);
		ctx.lineTo(0,0);
		ctx.stroke();
		*/
		image = canvas;
	}

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}



/**
 * Initialises buffers that will be sent to the shaders
 */
function InitBuffers()
{
	// Bind vertices (A rectangle)
	gVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gVerticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,1]), gl.STATIC_DRAW);

	// Bind vertex indices
	gVerticesIndexBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gVerticesIndexBuffer);
	
	var indices = [
		0,1,2, 0,3,2 // indices of vertices of two triangles that make a square 
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	// Bind texture vertices
	gVerticesTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gVerticesTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 1,1, 1,0, 0,0]), gl.STATIC_DRAW);
}
//
// InitShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function InitShaders() 
{
	var fragmentShader = GetShader(gl, "shader-fs");
	var vertexShader = GetShader(gl, "shader-vs");
  
	// Create the shader program
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
  
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
	{
		alert("Unable to initialize the shader program.");
	}
  
	gl.useProgram(shaderProgram);
 
	// Set attributes

	// Textures
	aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(aTextureCoord);

	// Vertices
	aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(aVertexPosition); // Remember to do this. Or nothing will get drawn.

	// Set uniforms
	uPosition = gl.getUniformLocation(shaderProgram, "uPosition");
	uAspectRatio = gl.getUniformLocation(shaderProgram, "uAspectRatio");
	uScale = gl.getUniformLocation(shaderProgram, "uScale");
	uColour = gl.getUniformLocation(shaderProgram, "uColour");
	gl.uniform4f(uColour, 1,1,1,1);
	// Set it
	//gl.uniform1f(uAspectRatio, canvas.width/canvas.height);
	gl.uniform1f(uAspectRatio, 1);
}

//
// GetShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function GetShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  // Didn't find an element with the specified ID; abort.
  
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  
  var shader;
  
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }
  
  // Send the source to the shader object
  
  gl.shaderSource(shader, theSource);
  
  // Compile the shader program
  
  gl.compileShader(shader);
  
  // See if it compiled successfully
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

// Le sigh date formatting
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

