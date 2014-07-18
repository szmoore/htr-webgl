/**
 * @file graphics.js
 * @brief Graphics related functions and helpers
 */
 
/**
 * Convert sprite to RGBA 2D array
 * @returns {width, height, rgba[][]}
 */
function SpriteToRGBA(sprite1)
{
	var rgba1 = [];
	for (var x = 0; x < sprite1.width; ++x)
	{
		rgba1[x] = [];
		for (var y= 0; y < sprite1.height; ++y)
		{
			var index = (+x+ +y*sprite1.width)*4;
			var pix = [0,0,0,0];
			for (var i = 0; i < pix.length; ++i)
			{
				pix[i] = sprite1.data[+index + +i];
			}
			rgba1[x][y] = pix;
		}
	}
	return {width : sprite1.width, height : sprite1.height, rgba : rgba1};

}
/**
 * Sprite based collision checking
 */
function SpriteCollision(offset, sprite1, sprite2)
{
	for (var x = 0; x < sprite1.width; ++x)
	{
		var xx = +x + +offset[0];
		if (xx < 0 || xx >= sprite2.width) continue;
		for (var y = 0; y < sprite1.height; ++y)
		{
			var yy = +y + +offset[1];
			if (yy < 0 || yy >= sprite2.height) continue;
			var pix1 = sprite1.rgba[x][y];
			var pix2 = sprite2.rgba[xx][yy];
			if (pix1[3] > 10 && pix2[3] > 10) return true;
		}
	}
	return false;
}

/**
 * Construct a canvas for drawing things on
 * Should be used on a HTML5 canvas element
 */
function Canvas(element)
{
	// Commented out because on my testing laptop 
	//	with the latest graphics driver update this causes X to crash
	// *fglrx slow clap*
	//this.gl = element.getContext("experimental-webgl");
	this.ctx = element.getContext("2d");
	
	if (!this.gl && !this.ctx)
	{
		alert("Your browser does not support Humphrey The Rabbit\nTry with Firefox\n:-(");
	}
	else if (!this.gl)
	{
		//alert("Your browser does not support WebGL\nThis may cause performance issues\n:-(");
	}
	this.width = element.width;
	this.height = element.height;
	this.textures = {};
	
	if (this.gl) with(this.gl)
	{
		blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		enable(BLEND);
		clearColor(0.9, 0.9, 1.0, 1.0); // Set clear colour 
		viewport(0,0,this.width,this.height); // Set viewport (unnecessary?)
    		// Initialise the buffer objects
		InitBuffers(this.gl);
	    	// Initialize the shaders
		InitShaders(this.gl);		
	}
	// Start the Game.
}

/**
 * Convert coordinates in GL to pixels
 */
Canvas.prototype.LocationGLToPix = function(x, y)
{
	var xx = Math.round((1+x)*this.width/2);
	var yy = Math.round((1-y)*this.height/2);
	return [xx,yy];
}

Canvas.prototype.Text = function(text)
{
	var fontSize = 50 / (1 +Math.round(text.length/40));
	this.ctx.font = String(fontSize)+"px Comic Sans";
	this.ctx.fillStyle = "rgba(0,0,0,1)";
	this.ctx.beginPath();
	this.ctx.fillText(text,this.width/16, this.height/6, 14*this.width/16);
}

Canvas.prototype.SplashScreen = function(imagePath, text, backColour, onload)
{
	this.cancelSplash = false;
	var screen = new Entity([0,0], [0,0],[0,0],"");
	if (!text) text = "";
	if (!backColour) backColour = [0,0,0,0.9];
	screen.scale = [0.6, 0.6]; 
	screen.bounds = {min:[-this.width/2, -this.height/2], max:[this.width/2, this.height/2]};
	
	var f = function(onload, screen, imagePath) {
		//console.log("Splash for "+String(imagePath) + " loaded, onload is "+String(onload));
		
		if (this.cancelSplash)
			return;
		if (this.gl)
		{
			this.gl.clearColor(background[0], background[1], background[2], background[3]);
			this.gl.clear(gl.COLOR_BUFFER_BIT);
			this.gl.uniform4f(uColour,1,1,1,1); 
			//gl.uniform4f(uColour, blend[0], blend[1], blend[2], blend[3]);
			screen.Draw();
			this.gl.uniform4f(uColour,1,1,1,1); 
		}
		else if (this.ctx)
		{
			for (var i = 0; i < 3; ++i) 
				backColour[i] = Math.round(255*backColour[i]);
			this.ctx.fillStyle = "rgba("+backColour+")";
			
			this.ctx.fillRect(0,0,this.width, this.height);
			
			if (screen.frame)
			{
				var drawWidth = screen.frame.img.width;
				var drawHeight = screen.frame.img.height;
				if (drawWidth > this.width || this.width < 300 || drawWidth < 400) 
				{
					var scale = Math.max(drawWidth / this.width, drawHeight/this.height);
					drawWidth /= scale;
					drawHeight /= scale;
				}
				this.ctx.drawImage(screen.frame.img, this.width/2 - drawWidth/2, this.height/2 - drawHeight/2, drawWidth, drawHeight);
			}
			this.Text(text);
			
			var fontSize = 10;// / (1 +Math.round(text.length/40));
			this.ctx.font = String(fontSize)+"px Comic Sans";
			this.ctx.fillStyle = "rgba(1,0,0,0.5)";
			this.ctx.beginPath();
			this.ctx.fillText("If this Splash Screen takes more than 30s to disappear reload the page",this.width/16, 31*this.height/32	, 14*this.width/16);
		}
		
		
		if (typeof(onload) === "function")
		{
			//console.log("  Callback for splash " + String(imagePath) + " calling");
			onload();
		}
		//if (text)
		//	Debug("<b><i>"+text+"</i></b>", true);
	};
	
	if (imagePath)
		screen.frame = this.LoadTexture(imagePath, f.bind(this, onload, screen, imagePath));
	else
		f.bind(this, onload, screen)();
}


/**
 * Load texture
 */
Canvas.prototype.LoadTexture = function(imagePath, onload)
{
	if (imagePath in this.textures)
	{
		if (onload) {setTimeout(onload, 0)}
		return this.textures[imagePath];
	}
	
	var texture = (this.gl) ? this.gl.createTexture() : null;
	var image = new Image();
	this.textures[imagePath] = {tex: texture, img: image, data : null};
	if (onload)
	{
		var c = this;
		image.onload = function() {
			c.HandleTextureLoaded(c.textures[imagePath]); 
			onload();
		};
	}
	else
	{
		var c = this;
		image.onload = function() 
		{
			c.HandleTextureLoaded(c.textures[imagePath])
		};
	}

	image.src = imagePath; 
	return this.textures[imagePath];
}

/**
 * When a texture is loaded, do this
 */
Canvas.prototype.HandleTextureLoaded = function(texData)
{
	image = texData.img;
	texture = texData.tex;
 	if (this.gl && texture)
		 this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

	if (this.prepareSpriteCollisions || this.gl 
		&& ((image.width & (image.width - 1)) != 0 
		|| (image.height & (image.height - 1)) != 0))
	{
		console.log("scaling non power of 2 texture");
		var canvas = document.createElement("canvas");
		var w = image.width; var h = image.height;
		--w; for (var i = 1; i < 32; i <<= 1) w = w | w >> i; ++w;
		--h; for (var i = 1; i < 32; i <<= 1) h = h | h >> i; ++h;
		canvas.width = w;
		canvas.height = h;
		var ctx = canvas.getContext("2d");
		//ctx.rect(0,0,w,h);
		ctx.drawImage(image, w/2 - image.width/2, h/2 - image.height/2, image.width, image.height);
		// This is needed for webgl but not canvas2d, removing since I'm focusing on canvas2d for now
		// It is really slow.
		// Is webgl really better?
		// I mean, it might draw faster but it has to do all this work before it can draw
		//  (especially for a one off image) :S
		//texData.data = SpriteToRGBA(ctx.getImageData(0,0,w,h));
		texData.img = canvas;
	}

	if (this.gl && texture) with(this.gl)
	{
		texImage2D(TEXTURE_2D, 0, RGBA, RGBA, UNSIGNED_BYTE, texData.img);
		texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, LINEAR);
		texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR_MIPMAP_NEAREST);
		generateMipmap(TEXTURE_2D);
		bindTexture(TEXTURE_2D, null);
	}
}





/**
 * Initialises buffers that will be sent to the shaders
 */
function InitBuffers(gl) {with(gl)
{
	// Bind vertices (A rectangle)
	gl.verticesBuffer = createBuffer();
	bindBuffer(ARRAY_BUFFER, verticesBuffer);
	bufferData(ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,1]), STATIC_DRAW);

	// Bind vertex indices
	gl.verticesIndexBuffer = createBuffer();
	bindBuffer(ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	
	 // indices of vertices of two triangles that make a square 
	var indices = [0,1,2, 0,3,2];
	bufferData(ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), STATIC_DRAW);
	
	// Bind texture vertices
	gl.verticesTextureCoordBuffer = createBuffer();
	bindBuffer(gl.ARRAY_BUFFER, verticesTextureCoordBuffer);
	bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 1,1, 1,0, 0,0]), STATIC_DRAW);
}}
//
// InitShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function InitShaders(gl) {with(gl)
{
	var fragmentShader = GetShader(gl, "shader-fs");
	var vertexShader = GetShader(gl, "shader-vs");
  
	// Create the shader program
	gl.shaderProgram = createProgram();
	attachShader(shaderProgram, vertexShader);
	attachShader(shaderProgram, fragmentShader);
	linkProgram(shaderProgram);
	
	// If creating the shader program failed, alert
	if (!getProgramParameter(shaderProgram, LINK_STATUS)) 
	{
		alert("Unable to initialize the shader program.");
	}
  	useProgram(shaderProgram);
	
	// Texture attributes
	gl.aTextureCoord = getAttribLocation(shaderProgram, "aTextureCoord");
	enableVertexAttribArray(aTextureCoord);
	
	// Vertex attributes
	gl.aVertexPosition = getAttribLocation(shaderProgram, "aVertexPosition");
	enableVertexAttribArray(aVertexPosition); 
		
	// Set uniforms
	gl.uPosition = getUniformLocation(shaderProgram, "uPosition");
	gl.uAspectRatio = getUniformLocation(shaderProgram, "uAspectRatio");
	gl.uScale = getUniformLocation(shaderProgram, "uScale");
	gl.uColour = getUniformLocation(shaderProgram, "uColour");
	uniform4f(uColour, 1,1,1,1);
	// Set it
	//gl.uniform1f(uAspectRatio, canvas.width/canvas.height);
	uniform1f(uAspectRatio, 1);
}}

function GetShader(gl, id) 
{
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}
  
	// Walk through the source element's children, building the
	// shader source string.
	var theSource = "";
	var currentChild = shaderScript.firstChild;
  
	while(currentChild) 
	{
		if (currentChild.nodeType == 3)
			theSource += currentChild.textContent;
		currentChild = currentChild.nextSibling;
	}
  
	// Now figure out what type of shader script we have,
	// based on its MIME type.
	var shader;
	if (shaderScript.type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if (shaderScript.type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER);
	else return null;  
  
	// Send the source to the shader object
	gl.shaderSource(shader, theSource);
	// Compile the shader program
	gl.compileShader(shader);
  
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

Canvas.prototype.Clear = function(colour)
{
	
	if (this.gl)
	{
		this.gl.clearColor(colour[0], colour[1], colour[2], colour[3]);
	}
	else if (this.ctx)
	{
		if (colour)
		{
			for (var i = 0; i < colour.length; ++i) 
				colour[i] = Math.round(colour[i]*255);
			this.fillStyle = "rgba("+colour+")";		
		}
		this.ctx.fillStyle = this.fillStyle;
		this.ctx.fillRect(0,0,this.width,this.height);	
	}
}
