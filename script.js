var canvas = document.querySelector("#canvas");
var ctx = canvas.getContext("2d");
var tx = window.innerWidth;
var ty = window.innerHeight;
canvas.width = tx;
canvas.height = ty;

var ball_list = [];

var INCREMENT_ID = 1;
var GRAVITY  = 1e-4 * 5;
var MAX_VEL = 2e-2;

var damping_bounce = .9;
var damping_friction = 4e-3;
var comp_min_delta = 1/Math.max(tx,ty); //less than a pixel
var comp_exceed_allow = 1e-11;

var last_click_pos = [0,0];
var is_run = false;

// re-use code from Roger Van-Hout
function randomColor() {
  return (
    "rgba(" +
    Math.round(Math.random() * 200) +
    "," +
    Math.round(Math.random() * 200) +
    "," +
    Math.round(Math.random() * 200) +
    "," +
    Math.ceil(Math.random() * 10) / 10 +
    ")"
  );
}

function Ball(x,y,r){
	this.id = INCREMENT_ID++;
	this.color = randomColor();
	this.x = x;
	this.y = y;
	this.r = r;
	this.vx = MAX_VEL*(Math.random()-0.5)*2;
	this.vy = 0;
	this.dx = 0;
	this.dy = 0;
	this.px = x*tx;
	this.py = y*ty;
	this.pr = r*Math.min(tx,ty);
	
	this.is_stop = false;
	this.ishold = false;
	this.shake_direction = 1;
	this.count = function(){
		// r is using ratio of minimum of width/height dimension.
		// this ratio is not going to apply to either x-axis or y-axis if w != h.
		// Account for the axes-range reduction due to radius with rx-ry pair here
		this.rx = r*Math.min(tx,ty)/tx;
		this.ry = r*Math.min(tx,ty)/ty;
		
		
		// count motion in 0-1 scale
		// bounce back condition
		if (this.x-this.rx < 0) this.vx = Math.abs(this.vx)*damping_bounce;
		if (this.x+this.rx > 1) this.vx = -Math.abs(this.vx)*damping_bounce;
		if (this.y-this.ry < 0) this.vy = Math.abs(this.vy)*damping_bounce;
		if (this.y+this.ry > 1) this.vy = -Math.abs(this.vy)*damping_bounce;
		
		
		this.vx *= (1-damping_friction);
		this.vy *= (1-damping_friction);
		
		this.dx = this.vx;
		this.dy = this.vy + 2*GRAVITY;
		
		// remove "vibration" due to uncertain fps
		if (Math.abs(this.dy) < comp_min_delta) this.dy = 0;
		if (Math.abs(this.dx) < comp_min_delta) this.dx = 0;
		
		// capture stationary ball to purge
		if ((Math.abs(this.vx) < comp_min_delta*0.5) && 
		    (Math.abs(this.vy) < comp_min_delta*0.5)&&
		    (this.y >= 1-this.ry+comp_exceed_allow) && 
			(this.ishold == false))
		{
			this.is_stop = true;
		}
		else 
		{
			this.is_stop = false;
		}
		
		
		// wringling around the pointer
		if (this.ishold == true)
		{
			//defy gravity
			this.shake_direction *= -0.99;
			this.x += this.vx*this.shake_direction;
			this.y += this.vy*this.shake_direction;
		}
		else
		{
			//follow gravity
			this.vy += GRAVITY;
			this.x += this.dx;
			this.y += this.dy;
		}
		
		// need the ball to exceed the window "view" slightly so...
		// that ball will bounce back on next update...
		this.x = Math.min(this.x, 1-this.rx+comp_exceed_allow);
		this.x = Math.max(this.x, this.rx-comp_exceed_allow);
		this.y = Math.min(this.y, 1-this.ry+comp_exceed_allow);
		this.y = Math.max(this.y, this.ry-comp_exceed_allow);
		
		this.px = this.x*tx;
		this.py = this.y*ty;
		this.pr = r*Math.min(tx,ty);
	}
	
	this.bounce_up = function(){
		this.vy -= MAX_VEL;
	}
	
	this.update = function(){
		drawCircle(this.px,this.py,this.pr,this.color);
	}
}

ball_list.push(new Ball(0.1,0.0,0.1));

function add_ball(){
	var x = Math.random()*(1-0.11)+0.11;
	var y = Math.random()*0.2+0.11;
	var r = Math.random()*0.05+0.05;
	ball_list.push(new Ball(x,y,r));
}

function drawCircle(x,y,r,color){
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.arc(x,y,r,0,2*Math.PI);
	ctx.fill();
	return;
}

function animate()
{
	tx = window.innerWidth;
	ty = window.innerHeight;
	if (canvas.width != tx || canvas.height != ty)
	{
		canvas.width = tx;
		canvas.height = ty;
	}
	
	// remove "old" ball
	for (var i = 0; i < ball_list.length; i++) 
	{
	  if ((is_run == true) && (ball_list[i].is_stop == true))
	  {
		  ball_list.splice(i,1);
		  --i;
	  }
	}
	
	// count all first so that canvas "clear" state is minimal
	for (var i = 0; i < ball_list.length; i++) 
	{
	  ball_list[i].count();
	}
	
	// clear canvas here
	ctx.clearRect(0, 0, tx, ty);
	// ... and draw immediately
	for (var i = 0; i < ball_list.length; i++) 
	{
	  ball_list[i].update();
	}
	
	requestAnimationFrame(animate);
}

// press space to bounce the ball up
function space_to_bounce()
{
	if (event.code == "Space"){
		ball_list.forEach( e => e.bounce_up() );
		ball_list.forEach( e => e.vx = Math.random()*0.5*MAX_VEL );
	}
}

// press a to add new balls
function keyA_to_add()
{
	if (event.code == "KeyA"){
		add_ball();
	}
}

// press r if boring
function keyR_to_run()
{
	if (event.code == "KeyR"){
		is_run = (is_run == false);
	}
}

// see some balls??
function live_show(){
	if (is_run){
		add_ball();
	}
}

// hold the ball
function click_to_hold()
{
	last_click_pos = [event.x,event.y];
	ball_list.forEach(function(ball){
		px = event.x / tx;
		py = event.y / ty;
		if ((px > ball.x - ball.r) &&
			(px < ball.x + ball.r) &&
			(py > ball.y - ball.r) &&
			(py < ball.y + ball.r))
		{
			ball.ishold = true;
		}
	});
}

// release the ball
function unclick_to_release()
{
	ball_list.forEach(function(ball){
		ball.ishold=false;
	});
}

// drag and shoot'able ball
function drag_ball()
{
	var e = event;
	var a = typeof(e.x);
	dx = e.x - last_click_pos[0];
	dy = e.y - last_click_pos[1];
	dx /= tx;
	dy /= ty;
	ball_list.forEach(function(ball){
		if (ball.ishold==true)
		{
			ball.x += dx;
			ball.y += dy;
			ball.vx = dx;
			ball.vy = dy;
		}
	});
	last_click_pos = [event.x,event.y];
}

addEventListener("keypress",space_to_bounce);
addEventListener("keypress",keyA_to_add);
addEventListener("keypress",keyR_to_run);
addEventListener("mousedown",click_to_hold);
addEventListener("mouseup",unclick_to_release);
addEventListener("mousemove",drag_ball);

setInterval(live_show,1000);

animate();