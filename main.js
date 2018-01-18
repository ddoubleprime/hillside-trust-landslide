// ls_sim.js - gamified landslide sim. more comments later if this prototype pans out.
var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);
var reset = document.getElementById("Reset");	// reset button from HTML
var clrTrees = document.getElementById("ClearTrees");	// reset button from HTML



//An array that contains all the files you want to load


//Create a new Hexi instance, and start it
let g = new Phaser.Game(603, 504, Phaser.AUTO, '', { preload: preload, create: create, update: update,  });


//g.physics.startSystem(Phaser.Physics.BOX2D);
//g.fps = 30;
//g.border = "2px black solid";

function preload() {
      g.load.image('sky_dust', 'ls-assets/bg_sky_dusky.png');
    /*  game.load.image('sky_gloom', 'ls-assets/bg_sky_gloomy.png');
      game.load.image('sky_strata', 'ls-assets/bg_sky_strata.png');
      game.load.image('bedrock', 'ls-assets/bedrock_basic.png');
      game.load.image('rain_dn', 'ls-assets/button_rain_dn.png');
      game.load.image('rain_ov', 'ls-assets/button_rain_ov.png');
      game.load.image('rain_up', 'ls-assets/button_rain_up.png');
      game.load.image('cloud1', 'ls-assets/cloud1.png');
      game.load.image('cloud2', 'ls-assets/cloud2.png');
      game.load.image('grass', 'ls-assets/grass.png');
      game.load.image('house', 'ls-assets/house.png');
      game.load.image('river', 'ls-assets/river.png');
      game.load.image('shrub', 'ls-assets/shrub1.png');
      game.load.image('soil', 'ls-assets/soil_basic.png');
      game.load.image('trees1', 'ls-assets/trees1.png');
      game.load.image('trees2', 'ls-assets/trees2.png');*/

}

function create() {
  background = g.add.image(0, 0, 'sky_dust').anchor.set(0.5);


/*  soil = g.sprite.add(0, 0, 'soil');
  cloud1 = g.sprite.add(0, 0, 'cloud1');
  cloud2 = g.sprite.add(0, 0, 'cloud2');
  bedrock = g.sprite.add(0, 0, 'bedrock');
  house = g.sprite.add(100, 0, 'house');
  trees1 = g.sprite.add(200, 0, 'trees1');
  trees2 = g.sprite.add(360, 0, 'trees2');
  shrub = g.sprite.add(0, 0, 'shrub');
  river = g.sprite.add(0, 0, 'river');*/



}

function update() {
//yPosition();

}

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
