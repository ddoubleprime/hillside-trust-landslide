// ls_sim.js - gamified landslide sim. more comments later if this prototype pans out.
var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);
var reset = document.getElementById("Reset");	// reset button from HTML
var clrTrees = document.getElementById("ClearTrees");	// reset button from HTML




var groundVertices = [0,259,35,245,58,233,83,229,113,229,171,236,186,238,204,245,235,268,265,285,306,308,330,326,357,345,394,380,416,395,443,413,477,425,501,432,550,433,604,433];
//An array that contains all the files you want to load


//Create a new Hexi instance, and start it
var g = new Phaser.Game(603, 504, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render, addShaders: addShaders });


//g.physics.startSystem(Phaser.Physics.BOX2D);
//g.fps = 30;
//g.border = "2px black solid";

function preload() {
      g.load.image('sky_dust', 'ls-assets/bg_sky_dusky.png');
      g.load.image('sky_gloom', 'ls-assets/bg_sky_gloomy.png');
      g.load.image('sky_strata', 'ls-assets/bg_sky_strata.png');
      g.load.image('bedrock', 'ls-assets/bedrock_basic.png');
      g.load.image('rain_dn', 'ls-assets/button_rain_dn.png');
      g.load.image('rain_ov', 'ls-assets/button_rain_ov.png');
      g.load.image('rain_up', 'ls-assets/button_rain_up.png');
      g.load.image('cloud1', 'ls-assets/cloud1.png');
      g.load.image('cloud2', 'ls-assets/cloud2.png');
      g.load.image('grass', 'ls-assets/grass.png');
      g.load.image('house', 'ls-assets/house.png');
      g.load.image('river', 'ls-assets/river.png');
      g.load.image('shrub', 'ls-assets/shrub1.png');
      g.load.image('soil', 'ls-assets/soil_basic.png');
      g.load.image('trees1', 'ls-assets/trees1.png');
      g.load.image('trees2', 'ls-assets/trees2.png');
      g.load.spritesheet('rain', 'ls-assets/rain.png', 17, 17);
      g.load.image('water', '/ls-assets/ball.png');
      g.load.script('filterX', 'js/phaser-ce-2.10.0/filters/BlurX.js');
      g.load.script('filterY', 'js/phaser-ce-2.10.0/filters/BlurY.js');
      g.load.script('threshold', 'js/phaser-ce-2.10.0/filters/Thershold.js');

}

function create() {

  g.physics.startSystem(Phaser.Physics.BOX2D);
  g.physics.box2d.restitution = 0.2;
  g.physics.box2d.gravity.y = 250;

  var groundBody = new Phaser.Physics.Box2D.Body(g, null, 0, 0, 0);
	groundBody.setChain(groundVertices);
  groundBody.static = true;
  var background = g.add.image(0, 0, 'sky_dust');
  //background.scale.setTo(2, 2);

  var soil = g.add.sprite(0, 0, 'soil');
  var cloud1 = g.add.sprite(0, 0, 'cloud1');
  var cloud2 = g.add.sprite(0, 0, 'cloud2');
  var bedrock = g.add.sprite(0, 230, 'bedrock');
  var house = g.add.sprite(100, 0, 'house');
  var trees1 = g.add.sprite(200, 0, 'trees1');
  var trees2 = g.add.sprite(360, 0, 'trees2');
  var shrub = g.add.sprite(0, 0, 'shrub');
  var river = g.add.sprite(0, 0, 'river');
  //var water = g.add.sprite(0, 0, 'water');



  fluid = g.add.group();
      for (var i = 0; i < 400; i++) {
          var randomX = g.rnd.between(0, g.width);
          var randomY = g.rnd.between(0, g.height);


          var droplet = g.add.sprite(randomX, randomY, 'water');
          //var droplet = new Phaser.Physics.Box2D.Body(g, 'water', randomX, randomY);
          droplet.scale.x = 0.4;
          droplet.scale.y = 0.4;


          g.physics.box2d.enable(droplet);
          droplet.body.setCircle(droplet.width * 0.3);
          // Enable physics for the droplet
          //g.physics.p2.enable(droplet);
          droplet.collideWorldBounds = true;

          // Add a force that slows down the droplet over time
          droplet.damping = 0.3;

          // This makes the collision body smaller so that the droplets can get
          // really up close and goopy


          // Add the droplet to the fluid group
          fluid.add(droplet);
      }

      // Add WebGL shaders to "liquify" the droplets
      addShaders();




  var emitter = g.add.emitter(g.world.centerX, 0, 400);

  	emitter.width = g.world.width;
  	// emitter.angle = 30; // uncomment to set an angle for the rain.

  	emitter.makeParticles('rain');

  	emitter.minParticleScale = 0.1;
  	emitter.maxParticleScale = 0.5;

  	emitter.setYSpeed(300, 500);
  	emitter.setXSpeed(-5, 5);

  	emitter.minRotation = 0;
  	emitter.maxRotation = 0;

  	emitter.start(false, 1600, 5, 0);


}

function update() {
//yPosition();

}

function render() {

	//g.debug.box2dWorld();

}

function addShaders(){
    var blurX = g.add.filter('BlurX');
    var blurY = g.add.filter('BlurY');
    blurX.blur = 32;
    blurY.blur = 32;
    var threshShader = g.add.filter('Threshold');
    fluid.filters = [ blurX, blurY, threshShader];
    fluid.filterArea = g.camera.view;
};
/*function yPosition() {
  river.x = background.width - 80;
  trees1.y = background.height - bedrock.height - soilH / 3 - 60;
  trees2.y = background.height - soil.height - soilH / 3 + 60;
  shrub.y = background.height - bedrock.height - soilH / 3;
  house.y = background.height - bedrock.height - soilH / 3 - house.height + 6;
  bedrock.y = background.height - bedrock.height + (2 * soilH / 3);
  soil.y = background.height - soil.height - soilH / 3 + 6;
  river.x = background.width - 80;
}*/

/*function Deg2Rad(angle) {

	return angleR = angle * (Math.PI / 180);

}

// check for empty variables
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
};

// make array of cloud sprites
function makeClouds(numClouds, spritePath) {
	let clouds = []; // array of clouds
	for (i=0; i < numClouds; i++) {
		let cloud = g.sprite(spritePath);
		cloud.x = g.randomInt(-cloud.width, background.width);
		cloud.y = 100 + g.randomInt(-100,100);
		cloud.height = g.randomInt(cloud.height / 10, cloud.height);
		cloud.width = g.randomInt(cloud.width / 2, cloud.width);
		cloud.zIndex = -cloud.height * cloud.width;

		cloud.vx = (8e-6) * -cloud.zIndex;

		clouds.push(cloud);
		gameScene.addChild(cloud);

	}; // for

	return clouds;

	}; // makeClouds()

// make array of rain clouds - refactor so above makeClouds can be used more generally
function makeRainClouds(numClouds, spritePath) {
	let rainClouds = []; // array of clouds
	for (i=0; i < numClouds; i++) {
		let cloud = g.sprite(spritePath);
		cloud.x = g.randomInt(-cloud.width, background.width);
		cloud.y = 100 + g.randomInt(-100,60);
		cloud.height = g.randomInt(cloud.height / 10, cloud.height);
		cloud.width = g.randomInt(cloud.width / 2, cloud.width);
		cloud.zIndex = -cloud.height * cloud.width;

		cloud.vx = (7e-6) * -cloud.zIndex;

		rainClouds.push(cloud);
		rainScene.addChild(cloud);

	}; // for

	return rainClouds;

	}; // makeClouds()

// Saturation response curve after Iverson, 2000
function satResponse(ts,Ts) {

	if (ts <= Ts) {
		var Rout = R0(ts);
	} else {
		var Rout = R0(ts) - R0(ts-Ts);
	}

	function R0(t) {
		var Rbase = Math.sqrt(t/Math.pi) * Math.exp(-1/t) - ( 1-math.erf(1/sqrt(t)) );
		return Rbase
	}

	return Rout
}

function calcFOS(C, m, thetaR) {		// Hr eventually will be variable in space as well, but for now it's not

	// function that calculates factor of safety
	let FS = (C + (rho_r - m*rho_w) * grav * HrM * Math.cos(thetaR) * Math.tan(phiR)) / (rho_r * grav * HrM * Math.sin(thetaR));           // e.g., Bierman and Montgomery, Key Concepts in Geomorphology
	return FS = Math.round( FS * 100 ) / 100;

}

function rain() {
  rainScene.visible = true;
  g.state = play;
} //end()

function endRain() {
  rainScene.visible = false;
  g.state = play;
} //end()

function resetPage() {
	// reset the webpage for a new sim
	location.reload(); // pretty hacky, but takes care of resetting the whole DOM as well as the canvas
}

function getClickPosition(e) {

  console.log("step 2");
    var xPosition = e.clientX;
    //console.log(xPosition);
    yPositions = yCord(xPosition);



    trees1.x=xPosition - 50;
    trees1.y= background.height - bedrock.height - soilH / 3 + yPositions;
    decorations.addChild(trees1);

}

function buttonReset(){
  clrTrees.addEventListener('click',handleTrees);
  canvas.removeEventListener("click", getClickPosition);
}






function handleTrees() {
console.log("step 1");
  clrTrees.removeEventListener("click", handleTrees);
  clrTrees.addEventListener("click", buttonReset);
  canvas.addEventListener("click", getClickPosition);





  /*
	if (treesBool == true) {
	// remove the trees
	decorations.remove(trees1,trees2);
	clrTrees.textContent = 'Plant Trees';
	// adjust cohesion values
	for (i=0;i<treeSegs.length;i++) { Carray[treeSegs[i]] = Cbase; }; // reset cohesion to baseline where there were trees
	treesBool = false;
	} else {
	decorations.addChild(trees1,trees2);
	clrTrees.textContent = 'Clear Trees';
	// adjust cohesion values
	for (i=0;i<treeSegs.length;i++) { Carray[treeSegs[i]] *= 1.5; }; // increase cohesion 50% where there are trees
	treesBool = true;
};*/
