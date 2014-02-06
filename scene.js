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
 * Sprites were taken from an artificial life simulator called "Biots". Unfortunately the site shutdown some time in 2012.
 * I am not sure what the license on the sprites was, but no one has sued me yet.
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

/** GL Buffers **/
var gVerticesBuffer;
var gVerticesTextureCoordBuffer;
var gVerticesIndexBuffer;

/** Other globals **/
var stepRate = 15;

/**
 * Debug; display information on the page (for most things this is much nicer than Alt-Tabbing to and fro with Firebug)
 */
function Debug(html, clear)
{
	var div = document.getElementById("debug");
	if (clear)
		div.innerHTML = html;
	else
		div.innerHTML += html;
}

/**
 * Game Entity
 */
function Entity(position, velocity)
{
	this.position = position;
	this.velocity = velocity;
	this.frame = null;
}

/**
 * Step
 */
Entity.prototype.Step = function()
{
	var currentTime = (new Date()).getTime();
	if (!this.lastUpdateTime)
	{
		this.lastUpdateTime = currentTime;
		return;
	}
	var delta = currentTime - this.lastUpdateTime;

	this.lastPosition = []; for (var i in this.position) this.lastPosition[i] = this.position[i];

	// Update position
	for (var i in this.position)
		this.position[i] += delta * this.velocity[i] / 1000;

	// Check for collisions
	if (this.bounds)
	{
		for (var i in gEntities)
		{
			if (gEntities[i] != this) this.HandleCollision(gEntities[i]);
		}
	}

	// Check object in bounds.
	if (this.position[0] < -1)
		this.Bounce([1,0]);
	else if (this.position[0] > 1)
		this.Bounce([-1,0]);
	else if (this.position[1] < -1)
		this.Bounce([0,1]);
	else if (this.position[1] > 1)
		this.Bounce([0,-1]);

	// Update frame
	if (this.frames && this.frameRate)
	{
		this.frameNumber += delta * this.frameRate / 1000;
		this.frame = this.frames[Math.floor(this.frameNumber) % this.frames.length]
	}

	// Finalise step
	this.lastUpdateTime = currentTime;
	for (var i in this.position) this.lastPosition[i] = this.position[i];

	Debug("<p>Position: ["+this.position+"]</p><p>Velocity: ["+this.velocity+"]</p>",true);
	Debug("<p>FrameNum: "+this.frameNumber+"</p>");
}

/**
 * Detect collision
 */
Entity.prototype.Collides = function(other)
{
	if (!other.bounds || !this.bounds) return;
	for (var i in this.position)
	{
		alert("unimplemented");
	}
	
}

/**
 * Handle collision
 */
Entity.prototype.HandleCollision = function(other)
{
	var n = this.Collides(other);
	if (n)
	{
		this.Bounce(n);
		other.Bounce(n);
	}
	return n;
}

/**
 * Bounce off a surface with normal vector n
 */
Entity.prototype.Bounce = function(n)	
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

        for (var j in this.velocity)
        {
                this.velocity[j] = - (2.0 * dot * n[j] - this.velocity[j]);
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
	gl.bindTexture(gl.TEXTURE_2D, this.frame);
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

	// Set vertex indices and then draw the rectangle
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gVerticesIndexBuffer);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);

	//Debug("<p>Position: ["+this.position+"]</p><p>Velocity: ["+this.velocity+"]</p>",true);
}

/**
 * The main function
 */
function main() 
{
	canvas = document.getElementById("glcanvas");
	InitWebGL(canvas);      // Initialize the GL context

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
	
	gEntities = [];

	var rabbit = new Entity([0,0], [0,0]);

	var texture = gl.createTexture();
	var image = new Image();
	image.src = "data/rabbit/left1.gif";
	image.onload = function() {HandleTextureLoaded(image, texture);}
	var tex2 = gl.createTexture();
	var image2 = new Image();
	image2.src = "data/rabbit/left2.gif";
	image2.onload = function() {HandleTextureLoaded(image2, tex2);}

	rabbit.frames = [texture, tex2];
	rabbit.frame = texture;
	rabbit.frameNumber = 0;
	rabbit.frameRate = 3;

	rabbit.bounds = {min : [0,0], max : [1,1]};

	gEntities[gEntities.length] = rabbit;

	// Draw the Scene every stepRate ms	
	setInterval(DrawScene, stepRate);
}

/**
 * Draw the Scene and perform Steps
 */
function DrawScene()
{
	for (var i in gEntities)
	{
		gEntities[i].Step();
		gEntities[i].Draw();
	}
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
 * When a texture is loaded, do this
 */
function HandleTextureLoaded(image, texture)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
	gl.uniform1f(uScale, 32/640);
	// Set it
	gl.uniform1f(uAspectRatio, canvas.width/canvas.height);
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
