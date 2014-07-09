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

// Really should get rid of some of these...
var drawSceneTimer;
var addEnemyTimer;
var addEnemyCount = 0;
var foxCount = 0;
var oxCount = 0;
var roxCount = 0;
var runTime = 0;

var serverTime = (new Date).getTime();
var localTime = new Date();
var offsetTime = 0;
var gEntities = [];
var gTextures = {};
var startTime;
var stepCount = 0;
var foxesSquished = 0;
var foxesDazed = 0;
var boxesSquished = 0;
var maxLevel = 1;
var level = 1;
var lives = 0;
var spriteCollisions = false; //blergh





/**
 * Give the player a hat
 *
function AddHat()
{
	Debug("Get the hat!", true);
	setTimeout(function() {Debug("",true)},200*stepRate);
	var hat = new Entity([1.8*(Math.random()-0.5),1.1],[0,0]);
	hat.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width, 32/canvas.height]};
	hat.frame = LoadTexture("data/hats/hat1_big.gif");
	hat.sprite = hat.frame;
	hat.ignoreCollisions = {"Roof" : true}
	hat.acceleration = [0, -gravity];
	hat.HandleCollision = function(other, instigator)
	{
		if (other === player)
		{
			lives += 1;
			SetLives(lives);
			PostStats(this, "GOT HAT");
			this.Die();
		}
		else
		{
			this.Die();
		}

	}
	gEntities.push(hat);
}
 */
/**
 * Add a Rox
 */
function AddRox()
{
	alert("Rox time!");
	Debug("Rox Time!",true);
	setTimeout(function() {Debug("",true)}, 200*stepRate);
	var rox = new Entity([0,0],[0,0]);
	rox.LoadSprites("data/ox"); // use ox as placeholder
	rox.acceleration = [0,0];
	rox.name = "Rox";
	rox.ignoreCollisions = {"LeftWall" : true, "RightWall" : true};

	rox.Die = function() {
		roxCount -= 1;
		Entity.prototype.Die.call(this);
		setTimeout(function() {AddRox()}, 7000);
	}
	gEntities.push(rox);
}

/**
 * Add Enemy
 */
function AddEnemy()
{
	return;
	addEnemyCount += 1;
	if (addEnemyCount % 5 == 0 && foxCount < (2 + level))
		AddFox();
	else
		AddBox();

}


/**
 * Ox collision
 * Really need to refactor so I'm not just copying FoxHandleCOllision
 */
function OxHandleCollision(other, instigator)
{
	if (other === player && instigator)
		return this.MurderPlayer(other, "STABBED");
	else if (other.GetName() == "Box")
	{
		this.CollideBox(other, instigator);
	}

	if (this.MovingTowards(other) && (other.GetName() == "Box" || (other.sleep && other.sleep > 0)))
	{
		this.canJump = false;
		other.health -= 0.5;
		var s = (this.velocity[0] > 0) ? 1 : -1;
		if (this.velocity[0] == 0) s = 0;
		this.velocity[0] = this.speed * s;
		other.velocity[0] = this.velocity[0];
		if (other.health < 0)
		{
			if (other.GetName() != "Box") foxesSquished += 1;
			other.Die();
		}
		return false;
	}

	
	return Entity.prototype.HandleCollision.call(this,other,instigator); // Ain't nothing can stop an Ox	
}






/**
 * Add an Ox
 */
function AddOx()
{
	if (oxCount >= level-1)
		return;
	oxCount += 1;
	Debug("Ox Time!", true)
	setTimeout(function() {Debug("",true)}, 200*stepRate);
	var x = (Math.random() > 0.5) ? -0.8 : 0.8;
	//var y = (-0.8 + 1.6*Math.random());
	var y = 1.1;
	var ox = new Entity([x,y],[0,0]);
	ox.LoadSprites("data/ox");
	ox.acceleration = [0,-gravity];
	ox.bounds = {min: [-48/canvas.width, -48/canvas.height], max: [48/canvas.width, 48/canvas.height]};
	ox.scale = [48/canvas.width, 48/canvas.height];
	ox.name = "Ox";
	ox.frameRate = 3;
	ox.Step = FoxStep;
	ox.HandleCollision = OxHandleCollision;
	ox.health = 15;
	ox.speed = 0.6;
	ox.canJump = true;

	ox.jumpSpeed = 0.4;
	ox.ignoreCollisions = {"Roof" : true};
	ox.Die = function() {
		oxCount -= 1;
		Entity.prototype.Die.call(this);
		setTimeout(function() {AddOx()}, 10000);
	}
	gEntities.push(ox);
	return ox;
}


/**
 * Add a Fox
 */
function AddFox()
{
	foxCount += 1;
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
	fox.jumpSpeed = 0.5 * Math.pow(level, 1/3);
	fox.health = 1;
	fox.canJump = false; // Foxes jumping at birth is hard.
	fox.ignoreCollisions = {"Roof" : true};
	fox.Die = function() {
		foxCount -= 1;
		Entity.prototype.Die.call(this);
	}
	gEntities.push(fox);
	return fox;
}

PostStats = function(player, cause)
{
	// Send results to the stat collecting script
	var xmlhttp = new XMLHttpRequest(); // IE<7 won't WebGL anyway, screw compatibility
		
	xmlhttp.onreadystatechange = function() {
		// Don't really need to do anything.
	};
	var request = "death="+cause;
	request += "&x="+player.position[0]+"&y="+player.position[1];
	request += "&start="+startTime.getTime()+"&runtime="+runTime;
	request += "&steps="+stepCount;
	request += "&foxesSquished="+foxesSquished+"&foxesDazed="+foxesDazed;
	request += "&boxesSquished="+boxesSquished;
	request += "&level="+level;
	xmlhttp.open("POST", "stats.py", true); //POST just because its BIG
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Content-length", request.length);
	xmlhttp.setRequestHeader("Connection", "close");
	xmlhttp.send(request);		
}

/**
 * Spawn the player
 */
function RespawnPlayer()
{
			player.position = [0,0];
			player.velocity = [0,0];
			player.canJump = false;
			player.invincible = true;
			
			do
			{
				player.position[0] += 0.25*(Math.random()-0.5);
				player.position[1] += 0.25*(Math.random()-0.5);
			}
			while (player.Collision());

			var hat = new Entity([player.position[0], player.position[1]+0.130],[0,0]);
			hat.frame = LoadTexture("data/hats/hat1_big.gif");
			hat.name = "Hat";
			//hat.Step = function() {this.position = player.position; this.position[1] += 0.130;}
			setTimeout(function() {hat.Die(); player.canJump = true; player.invincible = false;}, 600);
			gEntities.push(hat);
}

/**
 * Load the initial Entities
 */
function LoadEntities()
{
	oxCount = 0;
	foxCount = 0;
	roxCount = 0;
	for (var i = 0; i < gEntities.length; ++i)
		gEntities[i].Die();
	gEntities = [];
	
	// The player (Humphrey The Rabbit)
	player = new Entity([0,0],[0,0]);
	player.LoadSprites("data/rabbit");
	player.bounds = {min: [-32/canvas.width, -32/canvas.height], max: [32/canvas.width, 32/canvas.height]};
	player.frameRate = 3;
	player.canJump = true;
	player.acceleration = [0, -gravity]; // gravity
	player.speed = 0.7;
	player.stomp = 0.2;
	player.jumpSpeed = 1.2;
	RespawnPlayer();
	// Handle any keys pressed
	player.handleKeys = function(keys)
	{
		this.velocity[0] = 0;
		if (keys[37] || keys[65]) this.velocity[0] -= this.speed; // left or A
		if (keys[39] || keys[68]) this.velocity[0] += this.speed; // right or D
		if (this.canJump && (keys[38] || keys[87])) // up or W
		{
			this.velocity[1] = this.jumpSpeed;
			this.canJump = false;
		}
		if ((keys[40] || keys[83]) && this.velocity[1] > -3) // down or S
			this.velocity[1] -= this.stomp;
	}
	
	player.Death = function(cause)
	{
		if (player.invincible)
		{
			var collides = player.Collision()
			while (collides.GetName() != "Hat")
			{
				player.position[0] += 0.25*(Math.random()-0.5);
				player.position[1] += 0.25*(Math.random()-0.5);
			}

		}
		// The cause to show
		var showCause = cause;
		if (romanticMode)
		{ 
			// Romantic causes
			var messages = ["REJECTED", "SHOT DOWN", "SHUNNED", "JILTED", "SPURNED", "SCORNED", "DIVORCED", "JADED"];
			showCause = messages[Math.floor(Math.random()*messages.length)];
		}

		

		if (lives > 0)
		{
			lives -= 1;
			SetLives(lives);
			PostStats(this, "LOST HAT (" + cause + ")");
			RespawnPlayer();
			return;	
		}

		PostStats(this, cause);
		
		//for (var i in gEntities) gEntities[i].Draw();
		PauseGame();
		player = undefined;
		var splash = SquishScreen;
		if (cause == "EATEN")
			splash= EatenScreen;
		else if (cause == "STABBED")
			splash = StabbedScreen;
		else
			splash = SquishScreen;


		splash("YOU GOT " +showCause);
	
		
		// Restart the game
		setTimeout(StartGame,2000);
	}
	//player.Death = function(cause) {}
	// Handle collision with box
	player.HandleCollision = function(other, instigator)
	{
		if (other.GetName() == "Box")
		{
			//console.log("["+other.RelativeVelocity(this)+"]");
			if (!instigator && other.MovingTowards(this) && other.Above(this) && other.velocity[1] < -0.5)
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



/**
 * Set the level
 */
function SetLevel(l)
{
	startTime = new Date;
	stepCount = 0;
	foxesSquished = 0;
	foxesDazed = 0;
	boxesSquished = 0;
	runTime = 0;

	level = l;
	PauseGame();
	gEntities = [];
	LoadEntities();

	// Set lives
	SetLives(lives);

	var audio = document.getElementById("theme");
	if (audio)
	{
		while (audio.firstChild) audio.removeChild(audio.firstChild);
		var src = (level <= 1) ? "data/theme" : "data/theme"+level;
		var type = "";
		if (audio.canPlayType("audio/ogg"))
		{
			type = "ogg";
			src += ".ogg";
		}
		else// if (audio.canPlayType("audio/mpeg"))
		{
			type = "mpeg";
			src += "mp3";
		}
		var s = document.createElement("source");
		s.src = src; s.type = "audio/"+type;
		audio.appendChild(s);
		audio.load();
		audio.pause();
	}

	AddHat();
	AddWolf();


	if (level == 2)
	{
		AddOx();
		AddHat();
	}
	if (level == 3)
	{
		AddRox();
		AddHat();
	}

	ResumeGame();
	if (level < maxLevel)
		VictoryBox();
}


/**
 * Start the game
 */
function StartGame()
{
		
	Debug("GET READY!",true);
	setTimeout(function() {Debug("",true)}, stepRate*500);
	SetLevel(level);
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
	if (drawSceneTimer) clearTimeout(drawSceneTimer);
	if (addEnemyTimer) clearTimeout(addEnemyTimer);
	drawSceneTimer = setInterval(DrawScene, stepRate);
	addEnemyTimer = setInterval(AddEnemy, stepRate*300/Math.pow(level,0.5));

	var audio = document.getElementById("theme"); 
	if (audio)
	{
		audio.play();
	}
	var pause = document.getElementById("pause");
	if (pause)
	{
		pause.innerHTML = "pause";
		pause.onclick = PauseGame;
	}
}

function VictoryBox()
{
	var box = AddBox();
	box.acceleration = [0, -gravity];
	box.frames = [LoadTexture("data/box/box_victory1.gif"),
		LoadTexture("data/box/box_victory2.gif"),
		LoadTexture("data/box/box_victory3.gif"),
		LoadTexture("data/box/box_victory4.gif"),
		LoadTexture("data/box/box_victory5.gif"),
		LoadTexture("data/box/box_victory6.gif"),
	];
	box.frameNumber = 0;
	box.frame = box.frames[0];
	box.frameRate = 3;
	box.health = 1e5;
	box.HandleCollision = function(other, instigator) {
		if (!instigator && other == player)
		{
			if (other.MovingTowards(this) && other.Above(this) && other.velocity[1] < -1)
			{
				if (this.timeout) clearTimeout(this.timeout);
				Victory();
				this.Die();
			}
		}
		else if (other.GetName() == "Fox" || other.GetName() == "Ox")
		{
			if (other.Die) other.Die();
		}
		
		return BoxHandleCollision.call(this, other, instigator);
	};
	Debug("<b><em>LEVEL "+(level+1)+" AVAILABLE!</em></b>", true);
	if (addEnemyTimer) clearTimeout(addEnemyTimer);
	box.timeout = setTimeout(function() {
		Debug("<b><em>YOU SNOOZE, YOU LOSE</em></b>", true);
		box.Die();
		clearTimeout(addEnemyTimer);
		addEnemyTimer = setInterval(AddEnemy, stepRate*300/Math.pow(level,0.5));
		SetLevel(level);
	}, 20000);
}

/**
 * You win!
 * ...
 * Or did you?
 */
function Victory()
{
	if (level > 3)
		return;

	PostStats(player, "NEXT LEVEL");

	PauseGame();
	if (level == 1) 
	{
		SplashScreen([1,0,0,1],[1,1,1,1],"ox", "OX TIME!");
		setTimeout(function() {SetLevel(level+1)}, 2000);
	}
	else if (level == 2)
	{
		SplashScreen([1,0,0,1],[1,1,1,1],"rox", "LET'S ROC");
		setTimeout(function() {SetLevel(level+1)}, 2000);
	}
	else if (level == 3)
	{
		VictoryScreen();
		setTimeout(function() {
			Debug("<i><b>...</b></i>",true);
			setTimeout(function() {
				Debug("Or did you?",true);
				setTimeout(function() {
					Debug("<i><b>THERE IS NO ESCAPE</b></i>", true)
					setTimeout(function() {SetLevel(level)}, 2000);
				}, 2000);
			}, 2000);
		}, 3000);
	}
}
var game;
/**
 * The main function
 */
function main() 
{
	var audio = document.getElementById("theme");
	var canvas = document.getElementById("glcanvas");
	game = new Game(audio, canvas);
	
	document.onkeydown = function(event) {game.KeyDown(event)};
	document.onkeyup = function(event) {game.KeyUp(event)};
	
	
	if (/*@cc_on!@*/false) // check for Internet Explorer
	{ 
		//document.onfocusin = game.Resume.bind(game);;
		document.onfocusout = game.Pause.bind(game);;
	} 
	else 
	{
		//window.onfocus = game.Resume.bind(game);
		window.onblur = game.Pause.bind(game);
	}
	
	game.Start(1);
}

function SetLives(l)
{
	var dom = document.getElementById("lives");
	dom.innerHTML = l;
	if (l <= 0)
	{
		dom.style.color = "red";
		dom.style["text-decoration"] = "blink";
	}
	else
	{
		dom.style.color = "black";
		dom.style["text-decoration"] = "none";
	}
}

function About()
{
	PauseGame();
	StartScreen();
	alert("Humphrey The Rabbit: WebGL\n\nProgramming: Sam Moore\nGraphics: Nekopets, A Joseph Reume, Sam Moore\nMusic: Sam Moore\n\nControls: arrows\n\n\"Avoid the Foxes and Boxes\"\n\nGitHub: https://github.com/szmoore/htr-webgl\n\nLicense: Code - MIT, Graphics/Music - CC-SA");
	ResumeGame();
}



