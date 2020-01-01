

Game.prototype.tutorial = {
	"start" : function () {
		this.message = "Move around";
		this.tutorialState = "move1";
		this.tutorialTimeout = 2000;
		this.player.lives = 0;
	},

	"move1" : function() {
		if (g_touchBarCookie === "yes") {
			this.message = "Use buttons";
		} else {
			this.message = "Touch: Guide with finger."
		}
		this.tutorialState = "move2";
		this.tutorialTimeout = (g_isMobile) ? 8000 : 1;
	},

	"move2" : function() {
		this.message = "Keyboard: W,S,A,D or Arrow keys"
		this.tutorialState = "climb";
		this.tutorialTimeout = (g_isMobile) ? 1 : 8000;
	},

	"move3" : function() {
		this.message = "Mouse: Hold down and move";
		this.tutorialState = "climb";
		this.tutorialTimeout = 5000;
	},

	"climb" : function () {
		this.message = "Try climbing the walls";
		this.tutorialState = "hat1";
		this.tutorialTimeout = 4000;
	},
	
	"hat1" : function () {
		this.message = "Hats are lives";
		this.tutorialState = "hat2";
		this.tutorial.hat = new Hat([0,0.25],[0,0],[0,0],this.canvas);
		this.AddEntity(this.tutorial.hat);
	},

	"hat2" : function() {

		if (this.player.lives > 0)
		{
			this.message = "Quick thinking!";
			this.tutorialState = "box1";
			return;
		}
		this.tutorial.hat.acceleration = this.gravity;
		this.tutorial.hat.position = [0,0.25];
		this.tutorial.hat.velocity = [0,0];
		this.message = "Get the Hat!";
		this.tutorialState = "hat3";
	},

	"hat3" : function() {
		if (this.player.lives <= 0)
		{
			this.tutorial.hat = new Hat([0,0.25],[0,0],this.gravity,this.canvas);
			this.AddEntity(this.tutorial.hat);
			this.message = "Try again!";
			this.tutorialState = "hat3";
		}
		else
		{
			this.tutorialState = "box1";
			this.message = "Well done!";
		}
	},

	"box1" : function() {
		this.tutorial.box = new Box([0,0.25],[0,0],[0,0],this.canvas);
		this.AddEntity(this.tutorial.box);
		this.message = "Dodge the Boxes";
		this.tutorialState = "box2";
	},

	"box2" : function() {
		this.tutorial.box.acceleration = this.gravity;
		this.message = "Watch out!";
		this.tutorialState = "box3";
	},

	"box3" : function() {
		if (this.player.lives > 0)
		{
			this.message = "Well done!";
		}
		else
		{
			this.message = "You're going to need more lives for the next bit...";
			for (var i = 0; i < 4; ++i)
				this.AddHat();
		}
		this.player.lives = 999;
		this.tutorialState = "cloud1";
	},

	"cloud1" : function() {
		this.message = "Clouds are safe";
		this.tutorial.cloud = new Cloud([-1.1,0.3],this.canvas);
		this.tutorial.cloud.velocity[0] = 0.5;
		this.AddEntity(this.tutorial.cloud);
		this.tutorialTimeout = 2000;
		this.tutorialState = "cloud2";
	},

	"cloud2" : function() {
		this.message = "Behold the glory of the cloud";
		this.tutorialState = "cloud3";
		this.tutorial.cloud.velocity = [0.0001,0];
	},

	"cloud3" : function() {
		this.message = "You can move through it (from below)"
		this.tutorialState = "cloud4";
	},

	"cloud4" : function() {
		if (this.player.position[1] < this.tutorial.cloud.position[1]-this.player.Height()/2)
		{
			this.message = "Stand on the cloud";
			this.tutorialState = "cloud4";
			this.tutorialTimeout = 1000;
		}
		else
		{
			this.message = "2.4KB of Big Data";
			this.tutorialState = "fox1";
		}

	},

	"fox1" : function() {
		this.message = "Fox => Danger!";
		this.tutorial.fox = new Fox([0,-0.5],[0,0], this.gravity, this.canvas);
		this.tutorial.fox.Step = Entity.prototype.Step;
		this.AddEntity(this.tutorial.fox);
		this.tutorialState = "fox2";
	},

	"fox2" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive || this.tutorial.fox.sleep)
		{
			this.tutorial["fox5"].call(this);
			return;
		}
		this.tutorial.fox.Step = Fox.prototype.Step;
		this.message = "Beware the Fox";
		this.tutorialState = "fox3";
	},

	"fox3" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive || this.tutorial.fox.sleep)
		{
			this.tutorial["fox5"].call(this);
			return;
		}
		this.message = "Stomp (down) on the Fox";
		this.tutorialState = "fox4";
	},


	"fox4" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive || this.tutorial.fox.sleep)
		{
			this.tutorial["fox5"].call(this);
			return;
		}
		this.message = "Hit her as she is falling";
		this.tutorialState = "fox4.5";
	},

	"fox4.5" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive || this.tutorial.fox.sleep)
		{
			this.tutorial["fox5"].call(this);
			return;
		}
		this.message = "Try gaining some height";
		this.tutorialState = "fox4.5";
	},

	"fox5" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		this.message = "Well done!";
		this.tutorial.fox.sleep = Infinity;
		this.tutorialState = "fox6";
	},

	"fox6" : function() {

		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		this.message = "Sleeping Foxes will wake up...";
		this.tutorial.fox.sleep = Infinity;
		this.tutorialState = "fox7";
	},

	"fox7" : function() {

		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		this.message = "WATCH OUT!";
		this.tutorial.fox.sleep = 0;
		this.tutorialState = "fox8";
	},

	"fox8" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		this.message = "We don't have all day...";
		this.tutorial.fox.Step = Entity.prototype.Step;
		this.tutorial.fox.velocity = [0,0];
		if (Math.abs(this.tutorial.fox.position[0]) > 0.4)
			this.tutorial.fox.position[0] = 0.4*(this.tutorial.fox.position[0])/Math.abs(this.tutorial.fox.position[0]);
		this.tutorial.foxPrison = new Entity(this.tutorial.fox.position,
		this.tutorial.fox.velocity,this.gravity, this.canvas);
		this.tutorial.foxPrison.Step = function(game) {};
		this.tutorial.foxPrison.name = "FoxPrison";
		this.tutorial.fox.ignoreCollisions["FoxPrison"] = true;
		this.tutorial.foxPrison.ignoreCollisions["Fox"] = true;
		this.tutorial.foxPrison.frame = this.canvas.LoadTexture("data/sfx/shield1.png");
		this.tutorial.fox.Die = function(reason,other,game)
		{
			Fox.prototype.Die.call(this,reason,other,game);
			game.tutorial.foxPrison.Die();
		}
		this.AddEntity(this.tutorial.foxPrison);
		this.tutorialState = "squish1";
	},

	"squish1" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		this.message = "Foxes can be squished";
		this.tutorial.squishRepeat = 0;
		var xx = this.tutorial.fox.position[0];
		if (xx > 0)
			xx -= this.tutorial.fox.Width();
		else
			xx += this.tutorial.fox.Width();


		this.tutorial.box = new Box([xx,1],[0,0],this.gravity,this.canvas);
		this.AddEntity(this.tutorial.box);
		this.tutorial.cloud.position[0] = xx;
		this.tutorialState = "squish2";
	},

	"squish2" : function() {
		if (!this.tutorial.fox || !this.tutorial.fox.alive)
		{
			this.tutorial["done"].call(this);
			return;
		}
		if (Math.abs(this.tutorial.fox.position[0]) > 0.4)
			this.tutorial.fox.position[0] = 0.4*(this.tutorial.fox.position[0])/Math.abs(this.tutorial.fox.position[0]);

		var xx = this.tutorial.fox.position[0];
		if (xx > 0)
			xx -= this.tutorial.fox.Width();
		else
			xx += this.tutorial.fox.Width();


		this.tutorial.cloud.position[0] = xx;
		this.tutorialTimeout = 3000;
		if (this.tutorial.box.position[1] <= -0.5)
		{
			if (this.squishRepeats < 11) {
				this.message = "(-_-) Try again.";
			}
			this.tutorial.box.Die();
			this.tutorial.box = new Box([xx,1],[0,0],this.gravity,this.canvas)
			this.AddEntity(this.tutorial.box);
		}
		else
		{
			this.tutorial.squishRepeat = (!this.tutorial.squishRepeat) ? 1 : this.tutorial.squishRepeat+1;
			switch (this.tutorial.squishRepeat)
			{
				case 1:
					this.message = "Push the Box onto the Fox";
					break;
				case 2:
					this.message = "Would you kindly push the Box onto the Fox";
					break;
				case 3:
					this.message = "Do it!";
					break;

				case 4:
					this.message = "It's self defence.";
					break;
				case 5:
					this.message = "Look, let's be reasonable";
					break;
				case 6:
					this.message = "I'm sure we can talk this through";
					break;
				case 7:
					this.message = "Nope I've run out of silly statements";
					break;
				case 8:
					this.message = "I'll just let her go then.";
					break;
				case 9:
					this.message = "I hope this is what you wanted.";
					this.player.lives = 1;
					this.tutorial.foxPrison.Die();
					this.tutorial.fox.Step = Fox.prototype.Step;
					this.tutorial.fox.Die = Fox.prototype.Die;
					this.tutorial.fox.sleep = 0;
					break;
				case 10:
					this.message = "It's her or you!";
					break;
				case 11:
					this.message = "This is only the beginning";
					break;
				case 12:
				case 13:
				case 14:
				case 15:
				case 16:
				case 17:
				case 18:
				case 19:
				case 20:
					this.message = "The killing will never stop.";
					break;
				case 21:
					this.message = "Alright. Be that way.";
					this.AddVictoryBox();
					this.settings.pacifistMode = true;
					this.ApplySettings();
					break;

				default:
					this.message = "76561198002357979";
					break;
			}
		}
		this.tutorialState = "squish2";
	},

	"done" : function() {
		this.message = "CONGRATULATIONS!";
		this.tutorialState = "done2";
	},

	"done2" : function() {
		this.message = "Warning: Stomping / Squishing will not work on all enemies.";
		this.tutorialState = "realworld1";
	},

	"realworld1" : function() {
		this.message = "Get Ready for the Real World (TM)!";
		this.tutorialState = "realworld2";
	},

	"realworld2" : function() {
		this.message = "";
		delete this.tutorial;
		delete this.tutorialState;
		this.player.lives = 0;
		this.playedTutorial = true;
		this.AddVictoryBox();
	},
};

/**
 * And I was doing so well...
 */
Game.prototype.Tutorial = function(state)
{
	if (!this.tutorial || this.level != 0) {
		return;
	}

	// hack since theme0.ogg's duration is incorrectly set to 178 instead of 37
	if (this.audio && this.audio.currentTime >= 37)
	{
		this.audio.currentTime = 0;
		this.audio.play();
	}


	var fn = this.tutorial[state];
	if (!fn)
		return;

	this.tutorialTimeout = 0;
	fn.call(this);

	if (this.tutorialState)
	{
		var timeout = this.tutorialTimeout ? this.tutorialTimeout : 6000;
		this.AddTimeout("Tutorial", this.Tutorial.bind(this, this.tutorialState), timeout);
	}
}
