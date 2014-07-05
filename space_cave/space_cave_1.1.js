/* Copyright 2014 Tyler Keddy
 *
 * ___ DISCLAIMER ___
 * ^^^^^^^^^^^^^^^^^^
 * This code is a dog's breakfast.
 * I just hacked it together for fun as a personal project.  It's not meant 
 * to be maintainable/efficient/scalable/enterprise ready/highly cohesive/
 * loosely coupled/<insert more buzzwords here>. If you're a potential employer
 * that's creeping me online, look away now :)
 */

var pointsElement = $('#points');
var gameContainerElement = $('#gameContainer');
var speedElement = $('#speed');
var finalPointsElement = $('#finalPoints');
var resetContainerElement = $('#resetContainer');
var worldCanvasElement = $('#world');
var playerCanvasElement = $('#player');
var fps = 30;
var millisecondsInSecond = 1000;
var playerImageFile = 'saucer.png';
var playerContext = playerCanvasElement[0].getContext('2d');
var worldContext = worldCanvasElement[0].getContext('2d');
//var lastDraw;

var player = {
	'directions' : {UP : 'UP', DOWN : 'DOWN', STILL : 'STILL'},
	'image' : new Image(),
	'leftOffset' : 3, // number of elements over in caveTop
	'direction' : '',
	'upTickFrequency' : millisecondsInSecond / 200,
	'downTickFrequency' : millisecondsInSecond / 175,
	'idleTickFrequency' : millisecondsInSecond,
	'x' : 0,
	'y' : 0,
	'size' : 25,
	'pixelsForError' : 125,
	'score' : 0,
	'draw' : function(){
		playerContext.clearRect(player.x - player.size, player.y - player.size, player.size*2, player.size*2);
		playerContext.drawImage(player.image, player.x - player.size / 2, player.y - player.size / 2);
	},
	'tick' : function() {
		// collision detection
		if (player.y <= world.caveTop[player.leftOffset] ||
			player.y >= world.caveTop[player.leftOffset] + player.size + player.pixelsForError)
		{
			gameContainerElement.slideUp(function(){
				finalPointsElement.text(pointsElement.text());
				resetContainerElement.show("explode");
			});
			return;
		}

		// move
		if (player.direction == player.directions.UP)
		{
			player.y = player.y + -1;
			setTimeout(function(){player.tick();}, player.upTickFrequency);
			return;
		}
		else if (player.direction == player.directions.DOWN)
		{
			player.y = player.y + 1;
			setTimeout(function(){player.tick();}, player.downTickFrequency);	
			return;
		}

		setTimeout(function(){player.tick();}, player.downTickFrequency);
	},
	'initialize' : function() {
		player.x = player.leftOffset * world.caveLineThickness;
		player.y = world.caveTop[0] + player.size + (player.pixelsForError / 2);
		player.image.src = playerImageFile;
		player.direction = player.directions.STILL;
	},
	'moveUp' : function() {
		player.direction = player.directions.UP;
	},
	'moveDown' : function() {
		player.direction = player.directions.DOWN;
	}
};

var world = {
	'caveLineThickness' : 20,
	'levelTickDecrease' : 2,
	'levelInterval' : millisecondsInSecond * 5,
	'pointInterval' : millisecondsInSecond / 5,
	'maxTickFrequency' : millisecondsInSecond / 150,
	'caveTop' : new Array(),
	'tickFrequency' : millisecondsInSecond / 30,
	'maxCaveVariance' : 10,
	'top' : 0,
	'bottom' : worldCanvasElement.height(),
	'left' : 0,
	'right' : worldCanvasElement.width(),
	'draw' : function() {
		worldContext.clearRect(world.top, world.left, world.right, world.bottom);
		for (x = world.left; x < world.right; x = x + world.caveLineThickness)
		{
			var elementInCaveTop = x / world.caveLineThickness;
			
			worldContext.beginPath();
			worldContext.moveTo(x, world.caveTop[elementInCaveTop]);
			worldContext.lineTo(x, world.caveTop[elementInCaveTop] + player.size + player.pixelsForError);
			worldContext.stroke();
		}
	},
	'determineCaveWall' : function (basePosition) {
		// move up or down in a direction
		var direction = Math.random() < 0.5 ? -1 : 1;
		var delta = (Math.floor((Math.random() * world.maxCaveVariance) + 1)) * direction;
		
		// top screen bounds check
		if (delta + basePosition < world.top)
		{
			return world.top;
		}

		// lower screen bounds check
		if (delta + basePosition + player.pixelsForError + player.size > world.bottom)
		{
			return (delta * -1) + basePosition;
		}

		return delta + basePosition;
	},
	'tick' : function () {

		if (player.direction != player.directions.STILL)
		{
			// shift all elements except last
			for (i = 0; i < world.caveTop.length - 1; i++)
			{
				world.caveTop[i] = world.caveTop[i + 1];
			}

			// determine element farthest right
			world.caveTop[world.caveTop.length - 1] = world.determineCaveWall(world.caveTop[world.caveTop.length - 1]);
		}

		setTimeout(function(){world.tick();}, world.tickFrequency);
	},
	'initialize' : function() {
		
		worldContext.lineWidth = world.caveLineThickness;
		
		for (x = world.left; x < world.right; x = x + world.caveLineThickness)
		{
			var elementInCaveTop = x / world.caveLineThickness;
			
			if (x == world.left)
			{
				world.caveTop[elementInCaveTop] = world.bottom / 2; // start in center
			}
			else
			{
				world.caveTop[elementInCaveTop] = world.determineCaveWall(world.caveTop[elementInCaveTop - 1]);
			}
		}
	},
	'adjustDifficulty' : function()	{
		
		if (world.maxTickFrequency < world.tickFrequency && player.direction != player.directions.STILL)
		{
			speed = parseInt(speedElement.text(), 10);
			speedElement.text(speed + 1);
			world.tickFrequency = world.tickFrequency - world.levelTickDecrease;
		}
		setTimeout(function(){world.adjustDifficulty();}, world.levelInterval);
	},
	'adjustPoints' : function () {
		
		if (player.direction != player.directions.STILL)
		{
			points = parseInt(pointsElement.text(), 10);
			pointsElement.text(points + 1);
			
		}
		setTimeout(function(){world.adjustPoints();}, world.pointInterval);
	}
};

function draw()
{
//	if (lastDraw == undefined || 
//			new Date().getTime() - lastDraw >= (millisecondsInSecond / fps))
//	{
		world.draw();
		player.draw();
		setTimeout(function(){draw();}, millisecondsInSecond / fps);
//		lastDraw = new Date().getTime();
//		requestAnimationFrame(draw);
//	}
}

function initializeGame()
{
	gameContainerElement.on('mousedown', function() {
		player.moveUp();
	});
	
	gameContainerElement.on('touchstart', function() {
		player.moveUp();
	});
	
	gameContainerElement.on('touchend', function() {
		player.moveDown();
	});

	gameContainerElement.on('mouseup', function() {
		player.moveDown();
	});

	world.initialize();
	player.initialize();
	world.tick();
	player.tick();
	world.adjustDifficulty();
	world.adjustPoints();
	draw();
}

initializeGame();

