// ls_sim.js - gamified landslide sim. more comments later if this prototype pans out.
var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);
var reset = document.getElementById("Reset");	// reset button from HTML
var clrTrees = document.getElementById("ClearTrees");	// reset button from HTML
var b = new Bump(PIXI);

//An array that contains all the files you want to load
let thingsToLoad = [
  "ls-assets/bedrock_basic.png",
  "ls-assets/bg_sky_dusky.png",
  "ls-assets/bg_sky_gloomy.png",
  "ls-assets/bg_sky_strata.png",
  "ls-assets/button_rain_dn.png",
  "ls-assets/button_rain_ov.png",
  "ls-assets/button_rain_up.png",
  "ls-assets/cloud1.png",
  "ls-assets/cloud2.png",
  "ls-assets/grass.png",
  "ls-assets/house.png",
  "ls-assets/river.png",
  "ls-assets/shrub1.png",
  "ls-assets/soil_basic.png",
  "ls-assets/trees1.png",
  "ls-assets/trees2.png",
];

//Create a new Hexi instance, and start it
let g = hexi(603, 504, setup, thingsToLoad);

document.getElementsByTagName('canvas')[0].setAttribute('id', 'canvas');
var canvas = document.getElementById("canvas");

//g.fps = 30;
g.border = "2px black solid";

//Scale the game canvas to the maximum size in the browser
//g.scaleToWindow();

// scaling factors and other geometric constraints
let posFudge = 2;	// scaling factor between illustrator and canvas pixel measurements
let pix2meter = 10;	// scales Hr from slider (pixels) to meters of soil depth
let VE = 2;			// vertical exaggeration of the diagram
let numSegs = 7;	// number of slope segments


// "local global" declarations
let background, soil, bedrock, decorations, clouds, rainClouds, haze, gameScene, rainScene, treesBool = true, FSlabels, satLabel, labelBaseY;
let slopePositionsX = [], slopePositionsY = [], FSarray = [], slopeArray = [], Carray = [1,1,1,1,1,1,1], rainTotal = 0, saturation = 0;

const grav = 9.81;
// material properties
const rho_r = 1800;
const rho_w = 1000;
const phiR = Deg2Rad(17);       // angle of internal friction

let Cbase = 1000;       // cohesion, Pa
for (i=0;i<numSegs;i++) { Carray[i] = Cbase; };	// setting up for variable cohesion across the landscape e.g. due to trees
let treeSegs = [2,3,5,6];	// slope segment numbers, right to left, zero-based, with trees. Will change if trees are repositioned - would be better if this was eventually determined dynamically
for (i=0;i<treeSegs.length;i++) { Carray[treeSegs[i]] *= 1.5; }; // increase cohesion 50% where there are trees; could be made variable


// positions for labels on slope angle and FS - centers of slope segments
slopePositionsX = [15, 55, 93, 125, 155, 205, 250];
slopePositionsY = [125, 120, 133, 150, 170, 210, 220];
slopeArray = [25, 5, 35, 25, 40, 25, 0]; // slope segment angles, degrees

// apply fudge factors
let HrM = Hr / pix2meter;
for (i=0;i<numSegs;i++) { slopePositionsX[i] *= posFudge; };
for (i=0;i<numSegs;i++) { slopePositionsY[i] *= posFudge; };
for (i=0;i<numSegs;i++) { slopeArray[i] /= VE; };
for (i=0;i<numSegs;i++) { slopeArray[i] = Deg2Rad(slopeArray[i]); }; // convert slopeArray to radians

// Initial values of the FS
for (i=0;i<numSegs;i++) { FSarray[i] = calcFOS(Carray[i],saturation,slopeArray[i]); };



//Start Hexi
g.start();


/////////// Utility Functions ///////////

// Convert angles to radians
function Deg2Rad(angle) {

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


/////////// Game Setup ///////////

function setup() {
	//// Create the `chimes` sound object
	// chimes = g.sound("./sounds/chimes.wav");

	//Create the `gameScene` group
	gameScene = g.group();

	/* call this function whenever you added a new layer/container */
	gameScene.updateLayersOrder = function () {
		gameScene.children.sort(function(a,b) {
			a.zIndex = a.zIndex || 0;
			b.zIndex = b.zIndex || 0;
			return b.zIndex - a.zIndex
		});
	};


	// 	Create the `background` sprite
	background = g.sprite("ls-assets/bg_sky_dusky.png");
	background.x = 0;
	background.y = 0;
	background.zIndex = 0;

  xDisplay = g.text("0", "20px emulogic", "#00FF00", 400, 50);
  yDisplay = g.text("1", "20px emulogic", "#00FF00", 300, 50);
	// 	Create the `soil` sprite
	let soilH = Hr;		// current sprites can handle thickness up to 75.
	soil = g.sprite("ls-assets/soil_basic.png");
	soil.x = 0;
	soil.y = background.height - soil.height - soilH / 3 + 6;


	// Create the `bedrock` sprite
	bedrock = g.sprite("ls-assets/bedrock_basic.png");
	bedrock.x = 0;
	bedrock.y = background.height - bedrock.height + (2 * soilH / 3);

	// Create the `house` sprite
	house = g.sprite("ls-assets/house.png");
	house.x = 100;
	house.y = background.height - bedrock.height - soilH / 3 - house.height + 6;

	// Create the `trees1` sprite
	trees1 = g.sprite("ls-assets/trees1.png");
	trees1.x = 200;
	trees1.y = background.height - bedrock.height - soilH / 3 - 60;

	// Create the `trees2` sprite
	trees2 = g.sprite("ls-assets/trees2.png");
	trees2.x = 360;
	trees2.y = background.height - soil.height - soilH / 3 + 60;

	// Create the `shrub1` sprite
	shrub1 = g.sprite("ls-assets/shrub1.png");
	shrub1.x = 0;
	shrub1.y = background.height - bedrock.height - soilH / 3;

	// Create the `river` sprite
	river = g.sprite("ls-assets/river.png");
	river.x = background.width - 80;
	river.y = background.height - bedrock.height - (soilH / 3) + 174;

	// Create the "liner" sprite
// 	var l = new PIXI.Graphics();
// 	liner = l.lineStyle(2, 0xffffff)
//        .moveTo(0, 252)
//        .quadraticCurveTo(200,200,300,400);
//
//     liner.x = 100;

	decorations = g.group(trees1,trees2,shrub1,house);
    decorations.remove(trees1,trees2);
	rainButton = g.button([
	  "ls-assets/button_rain_up.png",
	  "ls-assets/button_rain_ov.png",
	  "ls-assets/button_rain_dn.png",
	]);
	rainButton.height = 60;
	rainButton.width = 60;
	rainButton.x = background.width - 80;
	rainButton.y = 20;

	gameScene.addChild(background);

	let clouds1 = makeClouds(5, "ls-assets/cloud1.png");
	let clouds2 = makeClouds(10, "ls-assets/cloud2.png");
	clouds = [clouds1,clouds2];

	gameScene.updateLayersOrder();

	gameScene.addChild(decorations);
	gameScene.addChild(soil);
	gameScene.addChild(bedrock);
	gameScene.addChild(river);
	gameScene.addChild(rainButton);

	//Set up the text overlays
	let satR = Math.round(saturation * 100);
	satLabel = g.text("Soil Saturation: " + satR.toString() + "%","24px Futura","blue",20,background.height - 40);
	FSlabels = g.group();
	for (i=0;i<numSegs;i++) { FSlabels.addChild(g.text(FSarray[i].toString(),"18px Futura","black",slopePositionsX[i],slopePositionsY[i])); if (FSarray[i] <= 1) {FSlabels.children[i].style.fill = "red";};};

	labelBaseY = FSlabels.y;  // reference position for array of labels

	gameScene.addChild(satLabel);
	gameScene.addChild(FSlabels);

	gameScene.visible = true;



	//Create a `rainScene` group
	rainScene = g.group();
	rainScene.visible = false;

	let clouds3 = makeRainClouds(30, "ls-assets/cloud1.png");
	let clouds4 = makeRainClouds(40, "ls-assets/cloud2.png");
	rainClouds = [clouds3,clouds4];
	haze = g.sprite("ls-assets/bg_sky_gloomy.png")
	haze.alpha = 0.5;
	g.pulse(haze,60,0.3)
	rainScene.addChild(haze);


	//set the game state to `play`
	g.state = play;


};  // setup()


/*
0-93,-100
94-175,-120
176-245, -85
246-310, -55
311-400, -20
400-475  +60
*/
var first = true;
/////////// Gameplay ////////////

function play() {

// g.contain(player,g.stage);

// game mechanics here

// Update soil thickness based on slider
	Hr = Number(HrField.value);
	let soilH = Hr;		// current sprites can handle thickness up to 75.
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
	shrub1.y = background.height - bedrock.height - soilH / 3;
	// update the `river` sprite
	river.y = background.height - bedrock.height - (soilH / 3) + 174;

	// update the text overlays
	satR = Math.round(saturation * 100);
	satLabel.content = "Soil Saturation: " + satR.toString() + "%";
	for (i=0;i<numSegs;i++) { FSlabels.children[i].content = FSarray[i].toString(); if (FSarray[i] <= 1) {FSlabels.children[i].style.fill = "red";} else {FSlabels.children[i].style.fill = "black";}; };
	FSlabels.y = labelBaseY + (2 * soilH / 3);

	// wrap cloud positions
	  clouds.forEach(cldgrp => {
		g.move(cldgrp)
		cldgrp.forEach(cloud => {
		if (cloud.x > background.width) {
			cloud.x = -cloud.width;
			cloud.y = 100 + g.randomInt(-100,100);
			}
	  }); // clouds.forEach
	  }); // clouds.forEach grp


// Handle user interaction with buttons
	rainButton.press = () => {
	  g.state = rain;
	};
	  rainButton.release = () => {
	  g.state = endRain;
	};



	// check for HTML element interaction
  if (first){
	reset.addEventListener('click',resetPage);
	clrTrees.addEventListener('click',handleTrees);
  first=false;
}

	// update saturation values
	if (rainScene.visible == true) { saturation += 0.02 / 30; };	// increases 4% per second, minus draining term
	if (saturation > 0) {saturation -= 0.05 * saturation / 120;};	// drain soil. rate declines as saturation declines
			saturation = Math.max(saturation, 0); 	// saturation values should be between zero and 1
			saturation = Math.min(saturation, 1);

	// update FOS
	HrM = Hr / pix2meter;
	for (i=0;i<numSegs;i++) { FSarray[i] = calcFOS(Carray[i],saturation,slopeArray[i]); };

function rain() {
  rainScene.visible = true;
  g.state = play;
}; //end()

function endRain() {
  rainScene.visible = false;
  g.state = play;
}; //end()

function resetPage() {
	// reset the webpage for a new sim
	location.reload(); // pretty hacky, but takes care of resetting the whole DOM as well as the canvas
};

function getClickPosition(e) {

  console.log("step 2");
    var xPosition = e.clientX;
    //console.log(xPosition);
    yPositions = yCord(xPosition);



    trees1.x=xPosition - 50;
    trees1.y= background.height - bedrock.height - soilH / 3 + yPositions;
    decorations.addChild(trees1);

};

function buttonReset(){
  clrTrees.addEventListener('click',handleTrees);
  canvas.removeEventListener("click", getClickPosition);
};


function yCord(xCord){

  var yPosition = 0;
 switch (true) {
  case xCord < 93 :
    yPosition = -100;
    break;
  case xCord < 175 :
    yPosition = -120;
    break;
  case xCord < 245 :
    yPosition = -85;
    break;
  case xCord < 310 :
    yPosition = -55;
    break;
  case xCord < 400 :
    yPosition = -20;
    break;
  case xCord < 475 :
    yPosition = 60;
    break;
  default:
    console.log("error");
 }
   console.log(yPosition);
 return yPosition;
};



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

};

}; //play()


//////////////// EOF //////////////////
