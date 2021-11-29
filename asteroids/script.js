const FPS = 30;
const FRICTION = 0.6;
const ASTEROIDS_NUM = 3;
const ASTEROIDS_JAG = 0.4; //jaggedness
const ASTEROIDS_SIZE = 100;
const ASTEROIDS_SPEED = 50; //max start speed of asteroids
const ASTEROIDS_VERT = 10; //number of vertices
const SHIP_SIZE = 30;
const SHIP_THRUST = 5; // gia toc
const TURN_SPEED = 360;
/** @type {HTMLCanvasElement} */

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
//ship
var ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: SHIP_SIZE / 2,
  a: (90 / 180) * Math.PI,
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0,
  },
};
// asteroids
var asteroids = [];
createAsteroidBelt();

// event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// game go
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    asteroids = [];
    let x, y;
    for(let i = 0; i < ASTEROIDS_NUM; ++i) {
        do{
        x = Math.floor(Math.random() * canvas.width);
        y = Math.floor(Math.random() * canvas.height);
        }while(distBetweenPoints(ship.x, ship.y, x, y) < ASTEROIDS_SIZE * 2 + ship.r);
        asteroids.push(newAsteroid(x, y));
    }
}
function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 37: // left
      ship.rot = ((TURN_SPEED / 360) * Math.PI) / FPS;
      break;
    case 38: // up
      ship.thrusting = true;
      break;
    case 39: // right
      ship.rot = ((-TURN_SPEED / 360) * Math.PI) / FPS;
      break;
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 37: // stop left
      ship.rot = 0;
      break;
    case 38: // up
      ship.thrusting = false;
      break;
    case 39: // stop right
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y) {
    let asteroid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROIDS_SPEED / FPS * (Math.random() < 0.5 ? 1: -1),
        yv: Math.random() * ASTEROIDS_SPEED / FPS * (Math.random() < 0.5 ? 1: -1), 
        r: ASTEROIDS_SIZE / 2,
        a: Math.random() * Math.PI * 2, //radius
        vert: Math.floor(Math.random() * (ASTEROIDS_VERT + 1) + ASTEROIDS_VERT / 2),
        offs: [],
    };
    for(let i = 0; i < asteroid.vert; ++i){
        asteroid.offs.push(Math.random() * ASTEROIDS_JAG * 2 + 1 - ASTEROIDS_JAG);
    }
    return asteroid;
}

function update() {
  //draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // thrust the ship
  if (ship.thrusting) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    //draw thruster
    ctx.fillStyle = "red";
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = SHIP_SIZE / 10;
    ctx.beginPath();
    ctx.moveTo(
      // rear left
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
    );
    ctx.lineTo(
      // rear center
      ship.x - ship.r * ((6 / 3) * Math.cos(ship.a)),
      ship.y + ship.r * ((6 / 3) * Math.sin(ship.a))
    );
    ctx.lineTo(
      // rear right
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }
  //draw triangular ship
  ctx.strokeStyle = "white";
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    // rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    // rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();

    // draw asteroid
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;
    var x, y, r, a, vert, offs;
    for(let i = 0; i < asteroids.length; ++i){
        x = asteroids[i].x;
        y = asteroids[i].y;
        r = asteroids[i].r;
        a = asteroids[i].a;
        vert = asteroids[i].vert;
        offs = asteroids[i].offs;
        // path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a),
        );
        // shape
            for(let j = 1; j < vert; ++j){
                ctx.lineTo(
                    x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                    y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert),
                )
            }
        ctx.closePath();
        ctx.stroke();
        // move
            asteroids[i].x += asteroids[i].xv;
            asteroids[i].y += asteroids[i].yv;
        // handle edge
            if(asteroids[i].x < 0 - asteroids[i].r){
                asteroids[i].x = canvas.width + asteroids[i].r;
            }else if(asteroids[i].x > canvas.width + asteroids[i].r){
                asteroids[i].x = 0 - asteroids[i].r;
            }
            if(asteroids[i].y < 0 - asteroids[i].r){
                asteroids[i].y = canvas.height + asteroids[i].r;
            }else if(asteroids[i].y > canvas.height + asteroids[i].r){
                asteroids[i].y = 0 - asteroids[i].r;
            }
    }

  //rotate ship
  ship.a += ship.rot;
  //move the ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    // if ship float to left edge
    ship.x = canvas.width + ship.r;
  } else if (ship.x > canvas.width + ship.r) {
    //if ship float to right edge
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    // if ship float to left edge
    ship.y = canvas.height + ship.r;
  } else if (ship.y > canvas.height + ship.r) {
    //if ship float to right edge
    ship.y = 0 - ship.r;
  }

}
