// ls_sim.js - gamified landslide sim. more comments later if this prototype pans out.
var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);
var reset = document.getElementById("Reset");	// reset button from HTML
var clrTrees = document.getElementById("ClearTrees");	// reset button from HTML
var emitter;
var rainButton;



var groundVertices = [0,259,35,245,58,233,83,229,113,229,171,236,186,238,204,245,235,268,265,285,306,308,330,326,357,345,394,380,416,395,443,413,477,425,501,432,550,433,604,433];

//An array that contains all the files you want to load


//Create a new Hexi instance, and start it
var g = new Phaser.Game(603, 504, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render, addShaders: addShaders });
// scaling factors and other geometric constraints
var posFudge = 2;	// scaling factor between illustrator and canvas pixel measurements
var pix2meter = 10;	// scales Hr from slider (pixels) to meters of soil depth
var VE = 2;			// vertical exaggeration of the diagram
var numSegs = 7;	// number of slope segments


// "local global" declarations
var background;
var soil, bedrock, decorations, clouds, rainClouds, haze, gameScene, rainScene, treesBool = true, FSlabels, satLabel, labelBaseY;
var slopePositionsX = [], slopePositionsY = [], FSarray = [], slopeArray = [], Carray = [1,1,1,1,1,1,1], rainTotal = 0, saturation = 0;

const grav = 9.81;
// material properties
const rho_r = 1800;
const rho_w = 1000;
const phiR = Deg2Rad(17);       // angle of internal friction

var Cbase = 1000;       // cohesion, Pa
for (i=0;i<numSegs;i++) { Carray[i] = Cbase; };	// setting up for variable cohesion across the landscape e.g. due to trees
var treeSegs = [2,3,5,6];	// slope segment numbers, right to left, zero-based, with trees. Will change if trees are repositioned - would be better if this was eventually determined dynamically
for (i=0;i<treeSegs.length;i++) { Carray[treeSegs[i]] *= 1.5; }; // increase cohesion 50% where there are trees; could be made variable


// positions for labels on slope angle and FS - centers of slope segments
slopePositionsX = [15, 55, 93, 125, 155, 205, 250];
slopePositionsY = [125, 120, 133, 150, 170, 210, 220];
slopeArray = [25, 5, 35, 25, 40, 25, 0]; // slope segment angles, degrees

// apply fudge factors
var HrM = Hr / pix2meter;
for (i=0;i<numSegs;i++) { slopePositionsX[i] *= posFudge; };
for (i=0;i<numSegs;i++) { slopePositionsY[i] *= posFudge; };
for (i=0;i<numSegs;i++) { slopeArray[i] /= VE; };
for (i=0;i<numSegs;i++) { slopeArray[i] = Deg2Rad(slopeArray[i]); }; // convert slopeArray to radians

// Initial values of the FS
for (i=0;i<numSegs;i++) { FSarray[i] = calcFOS(Carray[i],saturation,slopeArray[i]); };
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
       g.load.physics('physicsData', 'physicData.json');
       g.load.json('polygonData', 'physicData.json');
}
var droplet1;
var droplet2;
var droplet3;
var droplet4;
var droplet5;
var buttonOn;
var groundBody;
var saturate = false;
function create() {

  g.physics.startSystem(Phaser.Physics.BOX2D);
    g.physics.box2d.debugDraw.centerOfMass = true;
  g.physics.box2d.restitution = 0.2;
  g.physics.box2d.gravity.y = 250;
 bedrock = g.add.sprite(0, 230, 'bedrock');
//var soil = g.add.sprite(0, 0, 'soil');
  groundBody = new Phaser.Physics.Box2D.Body(g, bedrock, 0, 0, 0);
	groundBody.setChain(groundVertices);
  groundBody.static = true;
  var body = new Phaser.Physics.Box2D.Body(g, null, 0, 0, 0);
var phaserJSON = g.cache.getJSON('polygonData');
console.log(phaserJSON.soil_advanced.shape);
 background = g.add.image(0, 0, 'sky_dust');
  body.clearFixtures();
  body.loadPolygon('physicsData','soil_advanced');
 satR = Math.round(saturation * 100);
satLabel = g.add.text(300,60,"Soil Saturation: " + satR.toString() + "%", 'Arial' );
satLabel = g.add.text(300,70,"Soil Saturation: " + satR.toString() + "%", 'Arial' );
satLabel = g.add.text(300,80,"Soil Saturation: " + satR.toString() + "%", 'Arial' );
  FSlabels = g.add.group();
  for (i=0;i<numSegs;i++) { FSlabels.addChild(g.add.text(slopePositionsX[i],slopePositionsY[i]),FSarray[i].toString());};

  labelBaseY = FSlabels.y;

FSlabels.visible = true;

  //background.scale.setTo(2, 2);

  soil = g.add.sprite(0, 300, 'soil');
   cloud1 = g.add.sprite(0, 0, 'cloud1');
   cloud2 = g.add.sprite(0, 0, 'cloud2');
   bedrock = g.add.sprite(0, 230, 'bedrock');
   house = g.add.sprite(100, 0, 'house');
   trees1 = g.add.sprite(200, 0, 'trees1');
   trees2 = g.add.sprite(360, 0, 'trees2');
   shrub = g.add.sprite(0, 0, 'shrub');
   river = g.add.sprite(523, 0, 'river');
  //var water = g.add.sprite(0, 0, 'water');
var randy = [2,3,4,5,10];


rainButton = g.add.button(90, 400, 'rain_up', rainOnAction, this, 2, 1, 0);

fluid = g.add.group();


    // Add WebGL shaders to "liquify" the droplets
    addShaders();


    emitter = g.add.emitter(g.world.centerX, 0, 400);

  	emitter.width = g.world.width;
  	// emitter.angle = 30; // uncomment to set an angle for the rain.

  	emitter.makeParticles('rain');

    //emitter.enableBody = true;
    //emitter.enableBodyDebug = true;
    //emitter.physicsBodyType = Phaser.Physics.BOX2D ;

  	emitter.minParticleScale = 0.1;
  	emitter.maxParticleScale = 0.5;

  	emitter.setYSpeed(300, 500);
  	emitter.setXSpeed(-5, 5);

  	emitter.minRotation = 0;
  	emitter.maxRotation = 0;
emitter.start(false, 1600, 5, 0);
emitter.on= false


}



// check for empty variables
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
};








function update() {
//yPosition();
//g.physics.arcade.collide(emitter);
// Update soil thickness based on slider

Hr = Number(HrField.value);
var soilH = Hr;		// current sprites can handle thickness up to 75.
soil.y = background.height - soil.height - soilH / 3 + 6;
// update the `bedrock` sprite
bedrock.y = background.height - bedrock.height + (2 * soilH / 3);
// update the `house` sprite
house.y = background.height - bedrock.height - soilH / 3 - house.height + 6;
// update the `trees1` sprite

//trees1.y = background.height - bedrock.height - soilH / 3 -60;
// update the `trees2` sprite
trees2.y = background.height - soil.height - soilH / 3 + 60;
// update the `shrub1` sprite
//shrub1.y = background.height - bedrock.height - soilH / 3;
// update the `river` sprite
river.y = background.height - bedrock.height - (soilH / 3) + 174;

// update the text overlays
satR = Math.round(saturation * 100);
satLabel.text = "Soil Saturation: " + satR.toString() + "%";
for (i=0;i<numSegs;i++) { FSlabels.children[i].content = FSarray[i].toString(); if (FSarray[i] <= 1) {FSlabels.children[i].style.fill = "red";} else {FSlabels.children[i].style.fill = "black";}; };
FSlabels.y = labelBaseY + (2 * soilH / 3);




// update FOS


  // reference position for array of labels
}

/*function createRainDrop(){

      var randomX = g.rnd.between(0, g.width/2);
      //var randomY = g.rnd.pick(randy);
      //var scale = 1/randomY;






      droplet1 = g.add.sprite(115, 15, 'water');
      droplet2 = g.add.sprite(120, 20, 'water');
      droplet3 = g.add.sprite(125, 25, 'water');
      droplet4 = g.add.sprite(130, 30, 'water');
      droplet5 = g.add.sprite(110, 10, 'water');



      //var droplet = new Phaser.Physics.Box2D.Body(g, 'water', randomX, randomY);
      droplet1.scale.x = 0.3;
      droplet1.scale.y = 0.3;
      droplet2.scale.x = 0.3;
      droplet2.scale.y = 0.3;
      droplet3.scale.x = 0.3;
      droplet3.scale.y = 0.3;
      droplet4.scale.x = 0.3;
      droplet4.scale.y = 0.3;
      droplet5.scale.x = 0.3;
      droplet5.scale.y = 0.3;


      g.physics.box2d.enable(droplet1);
      g.physics.box2d.enable(droplet2);
      g.physics.box2d.enable(droplet3);
      g.physics.box2d.enable(droplet4);
      g.physics.box2d.enable(droplet5);
      droplet1.body.setCircle(droplet1.width * 0.3);
      droplet2.body.setCircle(droplet2.width * 0.3);
      droplet3.body.setCircle(droplet3.width * 0.3);
      droplet4.body.setCircle(droplet4.width * 0.3);
      droplet5.body.setCircle(droplet5.width * 0.3);

      // Enable physics for the droplet
      //g.physics.p2.enable(droplet);
      //droplet.collideWorldBounds = true;
      g.physics.box2d.ropeJoint(droplet1, droplet2, 10);
      g.physics.box2d.ropeJoint(droplet3, droplet2, 10);
      g.physics.box2d.ropeJoint(droplet1, droplet3, 10);
      g.physics.box2d.ropeJoint(droplet1, droplet4, 10);
      g.physics.box2d.ropeJoint(droplet4, droplet2, 10);
      g.physics.box2d.ropeJoint(droplet4, droplet3, 10);
      g.physics.box2d.ropeJoint(droplet5, droplet4, 10);

      // Add a force that slows down the droplet over time
      droplet1.damping = 0.3;
      droplet2.damping = 0.3;
      droplet3.damping = 0.3;
      droplet4.damping = 0.3;
      droplet5.damping = 0.3;

      // This makes the collision body smaller so that the droplets can get
      // really up close and goopy


      // Add the droplet to the fluid group
      fluid.add(droplet1);
      fluid.add(droplet2);
      fluid.add(droplet3);
      fluid.add(droplet4);
      fluid.add(droplet5);




  // Add WebGL shaders to "liquify" the droplets
  addShaders();

}*/
function rainOnAction () {

/*var xvert6 = groundVertices[11];
var yvert6 = groundVertices[12];
var xvert7 = groundVertices[13];
var yvert7 = groundVertices[14];
var xvert8 = groundVertices[15];
var yvert8 = groundVertices[16];

groundVertices[11] = xvert6 - 7;
groundVertices[12] = yvert6 - 7;
groundVertices[13] = xvert7 - 5;
groundVertices[14] = yvert7 - 5;
groundVertices[15] = xvert8 - 5;
groundVertices[16] = yvert8 + 2;*/



 if (buttonOn){
//createRainDrop();
emitter.on = true;
saturate = true;
buttonOn = false;
}
else{
  buttonOn = true;
  emitter.on =false;
  saturate = false;
}


}
function render() {

	g.debug.box2dWorld();

}

function addShaders(){
    var blurX = g.add.filter('BlurX');
    var blurY = g.add.filter('BlurY');
    blurX.blur = 16;
    blurY.blur = 16;
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
