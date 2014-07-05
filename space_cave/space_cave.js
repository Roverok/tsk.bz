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

// jquery stuff
var canvasElement = $('#game');
var pointsElement = $('#points');
var gameContainerElement = $('#gameContainer');
var speedElement = $('#speed');
var finalPointsElement = $('#finalPoints');
var resetContainerElement = $('#resetContainer');

// 'constants'
var context = canvasElement[0].getContext('2d');
var fps = 60;
var millisecondsInSecond = 1000;
var playerImageFile = 'saucer.png';

var player = {
	'directions' : {UP : 'UP', DOWN : 'DOWN', STILL : 'STILL'},
	'image' : new Image(),
	'leftOffset' : 5,
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
		context.drawImage(player.image, player.x - player.size / 2, player.y - player.size / 2);
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
		player.x = world.caveLineThickness * player.leftOffset;
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
	'levelTickDecrease' : 2,
	'levelInterval' : millisecondsInSecond * 5,
	'pointInterval' : millisecondsInSecond / 5,
	'maxTickFrequency' : millisecondsInSecond / 150,
	'caveLineThickness' : 5,
	'caveTop' : new Array(),
	'tickFrequency' : millisecondsInSecond / 30,
	'maxCaveVariance' : 10,
	'top' : 0,
	'bottom' : canvasElement.height(),
	'left' : 0,
	'right' : canvasElement.width(),
	'draw' : function() {
		for (i = world.left; i < world.right; i = i + world.caveLineThickness)
		{
			context.beginPath();
			context.moveTo(world.left+i, world.caveTop[i / world.caveLineThickness]);
			context.lineTo(world.left+i, world.caveTop[i / world.caveLineThickness] + player.size + player.pixelsForError);
			context.stroke();
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
		
		context.lineWidth = world.caveLineThickness;
		for (i = world.left; i < world.right / world.caveLineThickness; i++)
		{
			if (i == world.left)
			{
				world.caveTop[i] = world.bottom / 2; // start in center
			}
			else
			{
				world.caveTop[i] = world.determineCaveWall(world.caveTop[i - 1]);
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
	context.clearRect(world.left, world.top, world.right, world.bottom);
	world.draw();
	player.draw();
	setTimeout(function(){draw();}, 1000 / fps);
	//requestAnimationFrame(draw);
}

function initializeGame()
{
	gameContainerElement.bind('mousedown', function() {
		player.moveUp();
	});

	gameContainerElement.bind('mouseup', function() {
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

