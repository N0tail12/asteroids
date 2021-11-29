const FPS = 30;
const FRICTION = 0.6;
const GAME_LIFE = 3;
const LASER_MAX = 10; // 10 lasers
const LASER_SPEED = 500; // 10 lasers
const LASER_DIST = 0.5;
const ASTEROIDS_NUM = 1;
const ASTEROIDS_JAG = 0.4; //jaggedness
const ASTEROIDS_SIZE = 100;
const ASTEROIDS_SPEED = 50; //max start speed of asteroids
const ASTEROIDS_VERT = 10; //number of vertices
const SHIP_SIZE = 30;
const SHIP_THRUST = 5; // gia toc
const SHIP_EXPLODE_DUR = 0.3; // time ship explode
const LASER_EXPLODE_DUR = 0.1;
const SHIP_IDV_DUR = 3; // invisibility time
const SHIP_BLINK_DUR = 0.1; // blink time
const TURN_SPEED = 360;
const SHOW_BOUNDING = false;
const TEXT_FADE_TIME = 2;
const TEXT_SIZE = 40; // text font
/** @type {HTMLCanvasElement} */

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

var level, asteroids, ship, text, textAlpha, lives;
newGame();

// event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// game go
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  asteroids = [];
  let x, y;
  for (let i = 0; i < ASTEROIDS_NUM + level; ++i) {
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (
      distBetweenPoints(ship.x, ship.y, x, y) <
      ASTEROIDS_SIZE * 2 + ship.r
    );
    asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 2)));
  }
}

function destroyAsteroids(index) {
  let x = asteroids[index].x;
  let y = asteroids[index].y;
  let r = asteroids[index].r;

  //split in 2
  if (r == Math.ceil(ASTEROIDS_SIZE / 2)) {
    asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 4)));
    asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 4)));
  } else if (r == Math.ceil(ASTEROIDS_SIZE / 4)) {
    asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 8)));
    asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 8)));
  }
  asteroids.splice(index, 1);

  // new level
  if (asteroids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, color = "white") {
  ctx.strokeStyle = color;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    // rear left
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    // rear right
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}

function gameOVer() {
  ship.dead = true;
  text = "Game Over!";
  textAlpha = 1.0;
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  if (ship.dead) {
    return;
  }
  switch (ev.keyCode) {
    case 32: //space bar
      shootLaser();
      break;
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
  if (ship.dead) {
    return;
  }
  switch (ev.keyCode) {
    case 32: //space bar
      ship.canShoot = true;
      break;
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

function newAsteroid(x, y, r) {
  let lvlMult = 1 + 0.1 * level;
  let asteroid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * ASTEROIDS_SPEED * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    yv:
      ((Math.random() * ASTEROIDS_SPEED * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, //radius
    vert: Math.floor(Math.random() * (ASTEROIDS_VERT + 1) + ASTEROIDS_VERT / 2),
    offs: [],
  };
  for (let i = 0; i < asteroid.vert; ++i) {
    asteroid.offs.push(Math.random() * ASTEROIDS_JAG * 2 + 1 - ASTEROIDS_JAG);
  }
  return asteroid;
}

function newGame() {
  level = 0;
  lives = GAME_LIFE;
  ship = newShip();
  newLevel();
}

function newLevel() {
  text = "Level" + (level + 1);
  textAlpha = 1.0;
  createAsteroidBelt();
}

function newShip() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: SHIP_SIZE / 2,
    a: (90 / 180) * Math.PI,
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    blinkNum: Math.ceil(SHIP_IDV_DUR / SHIP_BLINK_DUR),
    explodeTime: 0,
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0,
    },
    canShoot: true,
    lasers: [],
    dead: false,
  };
}

function shootLaser() {
  // create lasers
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPEED * Math.cos(ship.a)) / FPS,
      yv: -(LASER_SPEED * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0,
    });
  }
  ship.canShoot = false;
}

function update() {
  let blinkOn = ship.blinkNum % 2 == 0;
  let exploding = ship.explodeTime > 0;
  //draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // thrust the ship
  if (ship.thrusting && !ship.dead) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    //draw thruster
    if (!exploding && blinkOn) {
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
    }
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }
  //draw triangular ship
  if (!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }

    //blinking
    if (ship.blinkNum > 0) {
      ship.blinkTime--;
      if (ship.blinkTime == 0 && !ship.dead) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
      }
    }
  } else {
    // draw explode
    ctx.fillStyle = "darkred";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 1.7, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
    ctx.fill();
  }
  if (SHOW_BOUNDING) {
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }
  // draw asteroid

  var x, y, r, a, vert, offs;
  for (let i = 0; i < asteroids.length; ++i) {
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;
    x = asteroids[i].x;
    y = asteroids[i].y;
    r = asteroids[i].r;
    a = asteroids[i].a;
    vert = asteroids[i].vert;
    offs = asteroids[i].offs;
    // path
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
    // shape
    for (let j = 1; j < vert; ++j) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();
    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "lime";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }
  }

  // draw the laser
  for (let i = 0; i < ship.lasers.length; ++i) {
    if (ship.lasers[i].explodeTime == 0) {
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        SHIP_SIZE / 15,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    } else {
      // laser explode
      ctx.fillStyle = "orangered";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.75,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.5,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.25,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    }
  }

  // draw the game text
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, " + textAlpha + ")";
    ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.75);
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  }

  // draw lives
  let lifeColour;
  for (let i = 0; i < lives; i++) {
    lifeColour = exploding && i == lives - 1 ? "red" : "white";
    drawShip(
      SHIP_SIZE + i * SHIP_SIZE * 1.2,
      SHIP_SIZE,
      0.5 * Math.PI,
      lifeColour
    );
  }

  // detect laser hits
  var ax, ay, ar, lx, ly;
  for (let i = asteroids.length - 1; i >= 0; i--) {
    ax = asteroids[i].x;
    ay = asteroids[i].y;
    ar = asteroids[i].r;
    for (let j = ship.lasers.length - 1; j >= 0; j--) {
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;
      if (
        ship.lasers[j].explodeTime == 0 &&
        distBetweenPoints(ax, ay, lx, ly) < ar
      ) {
        //remove asteroids and explosions
        destroyAsteroids(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
        break;
      }
    }
  }

  // check for collisions
  if (!exploding) {
    if (ship.blinkNum == 0 && !ship.dead) {
      for (let i = 0; i < asteroids.length; ++i) {
        if (
          distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) <
          ship.r + asteroids[i].r
        ) {
          explodeShip();
          destroyAsteroids(i);
          break;
        }
      }
    }

    //rotate ship
    ship.a += ship.rot;

    //move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    ship.explodeTime--;
    if (ship.explodeTime == 0) {
      lives--;
      if (lives <= 0) {
        gameOVer();
      } else {
        ship = newShip();
      }
    }
  }
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

  // move the laser
  for (let i = ship.lasers.length - 1; i >= 0; i--) {
    if (ship.lasers[i].dist > LASER_DIST * canvas.width) {
      ship.lasers.splice(i, 1);
      continue;
    }

    // handle explosions
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--;
      //destroy laser
      if (ship.lasers[i].explodeTime == 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;
      ship.lasers[i].dist += Math.sqrt(
        Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
      );
    }
  }

  // move asteroids
  for (let i = 0; i < asteroids.length; ++i) {
    asteroids[i].x += asteroids[i].xv;
    asteroids[i].y += asteroids[i].yv;
    // handle edge
    if (asteroids[i].x < 0 - asteroids[i].r) {
      asteroids[i].x = canvas.width + asteroids[i].r;
    } else if (asteroids[i].x > canvas.width + asteroids[i].r) {
      asteroids[i].x = 0 - asteroids[i].r;
    }
    if (asteroids[i].y < 0 - asteroids[i].r) {
      asteroids[i].y = canvas.height + asteroids[i].r;
    } else if (asteroids[i].y > canvas.height + asteroids[i].r) {
      asteroids[i].y = 0 - asteroids[i].r;
    }
  }
}
