

/**
 * And I was doing so well...
 */
Game.prototype.Tutorial = function(i)
{
	if (!this.tutorial)
		this.tutorial = {};
		
	// hack since theme0.ogg's duration is incorrectly set to 178 instead of 37
	if (this.audio && this.audio.currentTime >= 37) 
	{
		this.audio.currentTime = 0;
		this.audio.play();
	}
	switch (i)
	{
		case 0:
			this.overlay = {
				image : "",
				splashText : "WSAD/Arrows => Movement",
				message : "Pretty self explanatory."
			};
			break;
		case 1:
			this.overlay = {
				image : "",
				splashText : "Hold up to climb walls",
				message : "Wall jumping is essential."
			};
			break;
		case 2:
			this.overlay = {
				splashText : "Hat == Life+Shield",
				message : "Collect hats to live longer."
			};
			for (var j = 0; j < 10; ++j)
			{
				this.AddHat();
			}
			break;
		case 3:
			this.overlay = {
				splashText : "Box => Danger!",
				message : "Beware the boxes."
			};
			this.tutorial.box = new Box([0,0],[0,0],[0,0], this.canvas);
			this.AddEntity(this.tutorial.box);
			break;
		
		case 4:
			this.player.lives = 999;
			this.UpdateDOM(this.player);
			this.tutorial.box.acceleration = this.gravity;

			this.overlay = {
				splashText : "WATCH OUT!",
				message : "Box Time!"
			};
			break;	
			
		case 5:
			this.overlay = {
				splashText : "Push the box",
				message : "Go on it won't bite."
			};
			break;
		case 6:
			this.tutorial.cloud = new Cloud([-1.1,0],this.canvas);
			this.tutorial.cloud.velocity[0] = 0.4;
			this.AddEntity(this.tutorial.cloud);
			this.overlay = {
				splashText : "Clouds are safe.",
				message : "Relatively speaking",
				timeout : 2000
			};
			break;
		case 7:
			
			this.tutorial.cloud.velocity[0] = 0.001;
			this.overlay = {
				splashText : "Behold the glory of the cloud",
				message : "Big Data",
			};
			break;
			
		case 8:
			this.tutorial.fox = new Fox([0.9,0],[-0.5,0], this.gravity, this.canvas);
			this.tutorial.fox.Step = Entity.prototype.Step;
			this.AddEntity(this.tutorial.fox);
			this.overlay = {
				splashText : "Fox => Danger",
				message : "Oh noes!"
			};
			break;
		case 9:
			this.tutorial.fox.Step = Fox.prototype.Step;
			this.tutorial.fox.acceleration = this.gravity;
			this.overlay = {
				splashText : "Beware the fox!",
				message : "She'll eat you."
			};
			break;
		
		case 10:
			if (!this.tutorial.fox.sleep)
			{
				i-=1;
				
				this.overlay = {
					splashText : "Down => Stomp on the fox",
					message : "Wait until she is falling."
				};
			}
			else
			{
				this.overlay = {
					splashText : "Sleeping foxes will wake up...",
					message : "Careful!"
				};				
				this.tutorial.fox.sleep = 100;
			}
			break;
		case 11:
			this.overlay = {
				splashText : "WATCH OUT!",
				message : "I warned you!",
			};
			this.tutorial.fox.sleep = 0;
			break;
		case 12:
			this.overlay = {
				splashText : "We don't have all day...",
				message : "Deploying Anti-Fox Status Field",
			};
			
			this.tutorial.fox.Step = Entity.prototype.Step;
			this.tutorial.fox.velocity = [0,0];
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
			break;
		case 13:
			this.overlay = {
				splashText : "Foxes can be squished",
				message : "With boxes."
			};
			this.tutorial.cloud.position[0] = this.tutorial.fox.position[0]-2*this.tutorial.fox.Width();
			this.tutorial.box = new Box([this.tutorial.fox.position[0]-2*this.tutorial.fox.Width(),1], [0,0], this.gravity, this.canvas);
			this.AddEntity(this.tutorial.box);
			break;
			
		case 14:
			if (this.tutorial.fox.alive)
			{
				--i;
				this.overlay = {
					splashText : "Push the Box onto the Fox",
					message : "Such physics engine."
				};
			}
			else
			{
				this.overlay = {
					splashText : "CONGRATULATIONS!",
					message : "You have survived a 200 line switch statement."
				};
			}
			break;
		case 15:
			this.overlay = {
				splashText : "Prepare for Insertion",
				message : "It gets harder..."
			}; 
			break;
		default:
			delete this.overlay;
			delete this.tutorial;
			this.player.lives = 0;
			this.NextLevel();
			break;
			
	}
	if (this.overlay)
	{
		var timeout = (this.overlay.timeout) ? this.overlay.timeout : 4000;
		this.Message(this.overlay.message, 4000);
		this.AddTimeout("Tutorial", this.Tutorial.bind(this,i+1), timeout);
	}
}
