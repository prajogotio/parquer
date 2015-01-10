var parquer = {PLAYER_ID:0, ENEMY_ID:1, BULLET_ID:2};
document.addEventListener('DOMContentLoaded', initializer);

function initializer(){
	parquer.display = document.getElementById('display');
	parquer.cache = document.getElementById('cache');
	parquer.scoreDisplay = document.getElementById('score');
	parquer.countdownDisplay = document.getElementById('counter');
	parquer.announcer = document.getElementById('announcer');
	generateCache();
	parquer.SPAWN_RATE = 0.11;
	parquer.MAX_ENEMY = 100;
	parquer.BOUNDING_RECTANGLE = 800;
	parquer.POWERUP_SPAWN_RATE = 0.005;
	parquer.MAX_POWERUP = 3;
	stateInitializer();
	registerEventListener();
	parquer.gamestate = 'idle';
	parquer.announcer.innerHTML = '==parquer==<br><br><br>Press Any Key to Start!<br><br>==Key commands:==<br>arrow up to move<br> arrow left/right to rotate<br> spacebar to shoot';
}

function stateInitializer(){
	parquer.player = new Player(parquer.display.width/2,parquer.display.height/2,0);
	parquer.bulletList = [];
	parquer.enemyList = [];
	parquer.explosionList = [];
	parquer.powerUpList = [];
	parquer.scoreValue = 0;
}

function generateCache(){
	generatePlayerShip();
	generateBullet();
	generateEnemy();
	generateExplosion();
	generatePowerUp();
}

function generatePlayerShip(){
	var ctx = parquer.cache.getContext('2d');
	var width = 10;
	var height = 30;
	var offset = 6;
	ctx.strokeStyle = 'white';
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.beginPath();
	ctx.moveTo(width,0);
	ctx.lineTo(0,height);
	ctx.bezierCurveTo(offset,height-offset,2*width-offset,height-offset,2*width,height);
	ctx.lineTo(width,0);
	ctx.stroke();
	ctx.fill();
	parquer.cache.SHIP_SRC_TOP = 0;
	parquer.cache.SHIP_SRC_LEFT = 0;
	parquer.cache.SHIP_WIDTH = 20;
	parquer.cache.SHIP_HEIGHT = 30;
}

function generateBullet(){
	var ctx = parquer.cache.getContext('2d');
	parquer.cache.BULLET_SRC_TOP = 50;
	parquer.cache.BULLET_SRC_LEFT = 0;
	parquer.cache.BULLET_WIDTH = 5;
	parquer.cache.BULLET_HEIGHT = 15;
	ctx.fillStyle = 'white';
	ctx.fillRect(parquer.cache.BULLET_SRC_LEFT,parquer.cache.BULLET_SRC_TOP,
		parquer.cache.BULLET_WIDTH,parquer.cache.BULLET_HEIGHT);
}

function generateEnemy(){
	var ctx = parquer.cache.getContext('2d');
	parquer.cache.ENEMY_SRC_TOP = 100;
	parquer.cache.ENEMY_SRC_LEFT = 0;
	parquer.cache.ENEMY_WIDTH = 14;
	parquer.cache.ENEMY_HEIGHT = parquer.cache.ENEMY_WIDTH;
	var radius = parquer.cache.ENEMY_WIDTH/2;
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.beginPath();
	ctx.arc(parquer.cache.ENEMY_SRC_LEFT + radius, parquer.cache.ENEMY_SRC_TOP + radius, 
		radius, 0, 2*Math.PI, false);
	ctx.fill();
}

function generateExplosion(){
	var ctx = parquer.cache.getContext('2d');
	parquer.cache.EXPLOSION_SRC_TOP = 150;
	parquer.cache.EXPLOSION_SRC_LEFT = 0;
	parquer.cache.EXPLOSION_WIDTH = 50;
	parquer.cache.EXPLOSION_HEIGHT = 50;
	var radius = 2;
	var opacity = 1;
	var offset = 0;
	var width = parquer.cache.EXPLOSION_WIDTH;
	for(var i = 0; i < 7; ++i){
		radius += i;
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')';
		ctx.arc(width/2 + offset, parquer.cache.EXPLOSION_SRC_TOP + parquer.cache.EXPLOSION_HEIGHT/2,
			radius, 0, Math.PI * 2, false);
		ctx.stroke();
		offset += width;
		opacity -= 0.08;
	}
}

function generatePowerUp(){
	var ctx = parquer.cache.getContext('2d');
	var top = 200;
	var left = 0;
	ctx.fillStyle = 'rgba(90,70,230,0.9)';
	ctx.fillRect(left,top,20,20);
	ctx.font = "20px helvetica"
	ctx.fillStyle = 'white';
	ctx.fillText('p', left+6, top+15);
	parquer.cache.POWERUP_SRC_TOP = top;
	parquer.cache.POWERUP_SRC_LEFT = left;
	parquer.cache.POWERUP_WIDTH = 20;
	parquer.cache.POWERUP_HEIGHT = 20;
}

function registerEventListener(){
	document.addEventListener('keydown',function(e){
		if(parquer.gamestate == 'idle'){
			startCounter();
			return;
		}
		if(e.which == 38){
			parquer.player.registerCommand('THRUST');
		}
		if(e.which == 37){
			parquer.player.registerCommand('ROTATE_ANTICLOCKWISE');
		}
		if(e.which == 39){
			parquer.player.registerCommand('ROTATE_CLOCKWISE');
		}
		if(e.which == 32){
			parquer.player.registerCommand('SHOOT');
		}
		if(e.which == 80){
			//clearInterval(parquer.gameloop);
		}
	})
	document.addEventListener('keyup',function(e){
		if(e.which == 38){
			parquer.player.deleteCommand('THRUST');
		}
		if(e.which == 37){
			parquer.player.deleteCommand('ROTATE_ANTICLOCKWISE');
		}
		if(e.which == 39){
			parquer.player.deleteCommand('ROTATE_CLOCKWISE');
		}
		if(e.which == 32){
			parquer.player.deleteCommand('SHOOT');
		}
	})
}

function gameInitalizer(){
	stateInitializer();
	clearInterval(parquer.gameloop);
	parquer.gameloop = setInterval(function(){
		updateAll();
		renderAll();
	},1000/60);
}

function updateAll(){
	quadTreeCollisionCheck(0,0,parquer.display.width, parquer.display.height, parquer.bulletList.concat(parquer.enemyList));
	updatePlayer();
	updateBullet();
	updateEnemy();
	updateExplosion();
	updatePowerUp();
}

function updatePlayer(){
	if(!parquer.player.alive)return;
	var hLeft = parquer.player.left - parquer.player.width/2;
	var hRight = parquer.player.left + parquer.player.width/2;
	var vUpper = parquer.player.top - parquer.player.height/2;
	var vLower = parquer.player.top + parquer.player.height/2;
	for (var i = 0; i < parquer.enemyList.length; ++i){
		if(hLeft <= parquer.enemyList[i].left &&
		   parquer.enemyList[i].left <= hRight &&
		   vUpper <= parquer.enemyList[i].top &&
		   parquer.enemyList[i].top <= vLower){
			parquer.player.setDead();
			parquer.enemyList[i].setDead();
		}
	}
	for (var i = 0; i < parquer.powerUpList.length; ++i){
		if(hLeft-9 <= parquer.powerUpList[i].left &&
		   parquer.powerUpList[i].left <= hRight+9 &&
		   vUpper-9 <= parquer.powerUpList[i].top &&
		   parquer.powerUpList[i].top <= vLower+9){
			parquer.player.poweredUp();
			parquer.powerUpList[i].setDead();
		}
	}
	parquer.player.update();
}

function updateBullet(){
	for(var i = 0; i < parquer.bulletList.length; ++i){
		parquer.bulletList[i].update();
	}
	i = 0;
	while(i < parquer.bulletList.length){
		if(parquer.bulletList[i].alive) ++i;
		else {
			parquer.bulletList.splice(i,1);
		}
	}
}

function updateEnemy(){
	if(parquer.enemyList.length < parquer.MAX_ENEMY && Math.random() < parquer.SPAWN_RATE) {
		var top = Math.random() * parquer.display.height;
		var left = Math.random() * parquer.display.width;
		var angle = Math.random() * 360;
		if(Math.random() > 0.5) top = (Math.random() > 0.5 ? -9 : parquer.display.height+9);
		else left = (Math.random() > 0.5 ? -9 : parquer.display.width+9);
		parquer.enemyList.push(new Enemy(left, top, angle));
	}
	i = 0;
	while(i < parquer.enemyList.length){
		if(parquer.enemyList[i].alive) ++i;
		else {
			parquer.enemyList.splice(i,1);
		}
	}
	for (var i = 0; i < parquer.enemyList.length; ++i){
		parquer.enemyList[i].enemyLogic();
		parquer.enemyList[i].update();
	}
}

function updateExplosion(){
	for(var i = 0; i < parquer.explosionList.length; ++i){
		parquer.explosionList[i].update();
		if(!parquer.explosionList[i].alive){
			parquer.explosionList.splice(i,parquer.explosionList.length - i);
			break;
		}
	}
}

function updatePowerUp(){
	if(parquer.powerUpList.length < parquer.MAX_POWERUP && Math.random() < parquer.POWERUP_SPAWN_RATE){
		parquer.powerUpList.push(new PowerUp(Math.random() * parquer.display.width, Math.random() * parquer.display.height));
	}
	var i = 0;
	while (i < parquer.powerUpList.length){
		if(parquer.powerUpList[i].alive) ++i;
		else {
			parquer.powerUpList.splice(i,1);
		}
	}
	for (var i = 0; i < parquer.powerUpList.length; ++i){
		parquer.powerUpList[i].update();
	}
}

function renderAll(){
	parquer.display.getContext('2d').clearRect(0,0,parquer.display.width,parquer.display.height);

	parquer.player.renderShip();

	for(var i = 0; i < parquer.bulletList.length; ++i){
		parquer.bulletList[i].renderBullet();
	}

	for(var i = 0; i < parquer.enemyList.length; ++i){
		parquer.enemyList[i].renderEnemy();
	}

	for(var i = 0; i < parquer.explosionList.length; ++i){
		parquer.explosionList[i].renderExplosion();
	}

	for(var i = 0; i < parquer.powerUpList.length; ++i){
		parquer.powerUpList[i].renderPowerUp();
	}
}

function Player(left, top, angle){
	this.id = parquer.PLAYER_ID;
	this.top = top;
	this.left = left;
	this.angle = angle;
	this.velocity = {speed : 0, alpha : 0};
	this.thrust = 0.5;
	this.inertia = 0.13;
	this.manouvre = 3.3;
	this.maxSpeed = 5;
	this.shootRate = 90;
	this.commandList = {};
	this.width = parquer.cache.SHIP_WIDTH;
	this.height = parquer.cache.SHIP_HEIGHT;
	this.alive = true;
	this.lastShot = Date.now() - this.shootRate;
	this.isPoweredUp = false;
}

Player.prototype.renderShip = function(){
	if(!this.alive) return;
	var ctx = parquer.display.getContext('2d');
	ctx.save();
	ctx.translate(this.left, this.top);
	ctx.rotate(Math.PI/180*this.angle);
	ctx.drawImage(parquer.cache, parquer.cache.SHIP_SRC_LEFT, parquer.cache.SHIP_SRC_TOP, 
		parquer.cache.SHIP_WIDTH, parquer.cache.SHIP_HEIGHT,
		-parquer.cache.SHIP_WIDTH/2, -parquer.cache.SHIP_HEIGHT/2, 
		parquer.cache.SHIP_WIDTH, parquer.cache.SHIP_HEIGHT);
	ctx.restore();
}

Player.prototype.registerCommand = function(command){
	this.commandList[command] = true;
}

Player.prototype.deleteCommand = function(command){
	if (this.commandList[command])
		delete this.commandList[command];
}

Player.prototype.update = function(){
	if(!this.alive)return;
	if(this.poweredUp) {
		if(Date.now() - this.lastPoweredUp < 4000){
			this.shootRate = 0;
		} else {
			this.shootRate = 90;
		}
	}
	this.deccelerate();
	this.handleCommands();
	this.updatePosition();
}

Player.prototype.deccelerate = function(){
	this.velocity.speed -= this.inertia;
	if(this.velocity.speed < 0) this.velocity.speed = 0;
}

Player.prototype.handleCommands = function(){
	if (this.commandList['THRUST']) {
		this.handleThrust();
	}
	if (this.commandList['ROTATE_CLOCKWISE']){
		this.handleRotate(this.manouvre);
	}
	if (this.commandList['ROTATE_ANTICLOCKWISE']){
		this.handleRotate(-this.manouvre);
	}
	if (this.commandList['SHOOT']){
		this.handleShoot();
	}
}

Player.prototype.handleThrust = function(){
	var velocity = this.getAxialVelocity(this.velocity);
	var accel = this.getAxialVelocity({speed : this.thrust, alpha : this.angle});
	velocity.top += accel.top;
	velocity.left += accel.left;
	this.velocity = this.getPolarVelocity(velocity);
	if(this.velocity.speed > this.maxSpeed)this.velocity.speed = this.maxSpeed;
}

Player.prototype.getAxialVelocity = function(polarVelocity){
	var axialVelocity = {
		top : -polarVelocity.speed * Math.cos(Math.PI/180 * polarVelocity.alpha),
		left : polarVelocity.speed * Math.sin(Math.PI/180 * polarVelocity.alpha)
	};
	return axialVelocity;
}

Player.prototype.getPolarVelocity = function(velocity){
	var polarVelocity = {};
	polarVelocity.speed = Math.sqrt(velocity.top * velocity.top + velocity.left * velocity.left);
	if(velocity.top != 0) polarVelocity.alpha = Math.atan(Math.abs(velocity.left)/Math.abs(velocity.top))/Math.PI * 180;
	else polarVelocity.alpha = 90;
	if(velocity.top < 0){
		if(velocity.left < 0) polarVelocity.alpha = 360 - polarVelocity.alpha;
	} else {
		if(velocity.left < 0) polarVelocity.alpha = 180 + polarVelocity.alpha;
		else polarVelocity.alpha = 180 - polarVelocity.alpha;
	}
	return polarVelocity;
}

Player.prototype.updatePosition = function(){
	var velocity = this.getAxialVelocity(this.velocity);
	this.left += velocity.left;
	this.top += velocity.top;
	if(this.left < 0)this.left = 0;
	if(this.top < 0)this.top = 0;
	if(this.left > parquer.display.width)this.left = parquer.display.width;
	if(this.top > parquer.display.height)this.top = parquer.display.height;
}

Player.prototype.handleRotate = function(angle){
	this.angle += angle;
}

Player.prototype.handleShoot = function(){
	var curTime = Date.now();
	var timeSinceLastShot = curTime - this.lastShot;
	if(timeSinceLastShot < this.shootRate) return;
	parquer.bulletList.push(new Bullet(this.top, this.left, this.angle));
	this.lastShot = curTime;
}	

Player.prototype.setDead = function(){
	parquer.explosionList.push(new Explosion(this.left, this.top));
	this.alive = false;
	indicateGameOver();
}

Player.prototype.poweredUp = function(){
	this.lastPoweredUp = Date.now();
	this.isPoweredUp = true;
}

function Bullet(top, left, angle){
	this.id = parquer.BULLET_ID;
	this.speed = 12;
	this.velocity = Player.prototype.getAxialVelocity({speed : this.speed, alpha : angle});
	this.top = top;
	this.left = left;
	this.angle = angle;
	this.alive = true;
}

Bullet.prototype.renderBullet = function(){
	if(!this.alive) return;
	var ctx = parquer.display.getContext('2d');
	ctx.save();
	ctx.translate(this.left, this.top);
	ctx.rotate(Math.PI/180 * this.angle);
	ctx.drawImage(parquer.cache, parquer.cache.BULLET_SRC_LEFT, parquer.cache.BULLET_SRC_TOP,
		parquer.cache.BULLET_WIDTH, parquer.cache.BULLET_HEIGHT,
		-parquer.cache.BULLET_WIDTH/2, -parquer.cache.BULLET_HEIGHT/2,
		parquer.cache.BULLET_WIDTH, parquer.cache.BULLET_HEIGHT);
	ctx.restore();
}

Bullet.prototype.update = function(){
	this.top += this.velocity.top;
	this.left += this.velocity.left;
	if(this.top < -10 || this.top > parquer.display.height + 10 ||
		this.left < -10 || this.left > parquer.display.width + 10){
		this.alive = false;
	}
}

Bullet.prototype.setDead = function(){
	this.alive = false;
}

function Enemy(left, top, angle) {
	Player.call(this, left, top, angle);
	this.id = parquer.ENEMY_ID;
	this.thrust = 0.16;
	this.maxSpeed = Math.random() + 0.5;
	this.registerCommand('THRUST');
	this.alive = true;
}

Enemy.prototype = Object.create(Player.prototype);

Enemy.prototype.enemyLogic = function(){
	var polar = Player.prototype.getPolarVelocity({
		top : parquer.player.top - this.top,
		left : parquer.player.left - this.left,
	});
	this.angle = polar.alpha;
}

Enemy.prototype.renderEnemy = function(){
	var ctx = parquer.display.getContext('2d');
	ctx.save();
	ctx.translate(this.left, this.top);
	ctx.drawImage(parquer.cache, parquer.cache.ENEMY_SRC_LEFT, parquer.cache.ENEMY_SRC_TOP,
		parquer.cache.ENEMY_WIDTH, parquer.cache.ENEMY_HEIGHT,
		-parquer.cache.ENEMY_WIDTH/2, -parquer.cache.ENEMY_HEIGHT/2,
		parquer.cache.ENEMY_WIDTH, parquer.cache.ENEMY_HEIGHT);
	ctx.restore();
}

Enemy.prototype.setDead = function(){
	parquer.explosionList.push(new Explosion(this.left, this.top));
	addScore();
	this.alive = false;
}

function quadTreeCollisionCheck(left, top, width, height, list){
	if(list.length == 1 || list.length == 0) return;
	if(width * height <= parquer.BOUNDING_RECTANGLE) {
		var allOneType = true;
		for(var i = 1; i < list.length; ++i){
			if(list[i].id != list[i-1].id){
				allOneType = false;
				break;
			}
		}
		if(!allOneType){
			for(var i = 1; i < list.length; ++i){
				list[i].setDead();
			}
		}
		return;
	}
	var quad = [[],[],[],[]];
	for(var i=0;i<list.length;++i){
		var state = 0;
		if(list[i].left > left + width/2) ++state;
		if(list[i].top > top + height/2) state += 2;
		quad[state].push(list[i]);
	}
	for(var i=0;i<4;++i){
		quadTreeCollisionCheck(left+(i%2==1 ? width/2 : 0), top+(i>=2 ? height/2 : 0), width/2, height/2, quad[i]);
	}
}

function Explosion(left, top){
	this.timeCreated = Date.now();
	this.left = left;
	this.top = top;
	this.timePerFrame = 50;
	this.alive = true;
	this.numOfFrame = 8;
	this.frame = 0;
}

Explosion.prototype.update = function(){
	var timeElapsed = Date.now() - this.timeCreated;
	var delta = Math.floor(timeElapsed / this.timePerFrame);
	if(delta > 8){
		this.alive = false;
		return;
	}
	this.frame = delta;
}

Explosion.prototype.renderExplosion = function(){
	var ctx = parquer.display.getContext('2d');
	ctx.save();
	ctx.translate(this.left, this.top);
	ctx.drawImage(parquer.cache, parquer.cache.EXPLOSION_SRC_LEFT + this.frame * parquer.cache.EXPLOSION_WIDTH, parquer.cache.EXPLOSION_SRC_TOP,
		parquer.cache.EXPLOSION_WIDTH, parquer.cache.EXPLOSION_HEIGHT,
		-parquer.cache.EXPLOSION_WIDTH/2, -parquer.cache.EXPLOSION_HEIGHT/2,
		parquer.cache.EXPLOSION_WIDTH, parquer.cache.EXPLOSION_HEIGHT);
	ctx.restore();
}

function addScore(){
	parquer.scoreValue++;
	parquer.scoreDisplay.innerHTML = parquer.scoreValue;
}

function startCounter(){
	parquer.announcer.style.setProperty('opacity', 0);
	parquer.gamestate = 'starting';
	parquer.countdown = 3;
	parquer.countdownDisplay.innerHTML = parquer.countdown;
	parquer.countdownDisplay.style.setProperty('opacity',1);
	parquer.counterloop = setInterval(function(){
		parquer.countdown--;
		if(parquer.countdown == 0){
			gameInitalizer();
			clearInterval(parquer.counterloop);
			parquer.countdownDisplay.style.setProperty('opacity',0);
		} else {
			parquer.countdownDisplay.innerHTML = parquer.countdown;
		}
	}, 760)
}

function indicateGameOver(){
	parquer.announcer.innerHTML = 'Game Over <br> Killed: ' + parquer.scoreValue;
	parquer.announcer.style.setProperty('opacity', 1);
	setTimeout(function(){
		parquer.gamestate = 'idle';
		parquer.announcer.innerHTML = '==parquer== <br><br> press any key to restart';
		clearInterval(parquer.gameloop);
	}, 1800);
}

function PowerUp(left,top){
	Enemy.call(this,left,top,0);
	this.thrust = 0.1;
	this.maxSpeed = 0.3;
	this.alive = true;
	this.timeCreated = Date.now();
	this.timeAlive = 4500;
}

PowerUp.prototype = Object.create(Enemy.prototype);

PowerUp.prototype.update = function(){
	var timeNow = Date.now();
	if(timeNow - this.timeCreated > this.timeAlive){
		this.setDead();
	} else {
		Enemy.prototype.update.call(this);
	}
}

PowerUp.prototype.setDead = function(){
	this.alive = false;
	parquer.explosionList.push(new Explosion(this.left, this.top));
}

PowerUp.prototype.renderPowerUp = function(){
	var ctx = parquer.display.getContext('2d');
	ctx.save();
	ctx.translate(this.left, this.top);
	ctx.drawImage(parquer.cache,
		parquer.cache.POWERUP_SRC_LEFT, parquer.cache.POWERUP_SRC_TOP,
		parquer.cache.POWERUP_WIDTH, parquer.cache.POWERUP_WIDTH,
		-parquer.cache.POWERUP_WIDTH/2, -parquer.cache.POWERUP_HEIGHT/2,
		parquer.cache.POWERUP_WIDTH, parquer.cache.POWERUP_HEIGHT);
	ctx.restore();
}