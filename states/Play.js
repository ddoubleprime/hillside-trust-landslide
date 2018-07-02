var playState = {





  create: function(){
    var background;
    var soil, bedrock, decorations, clouds, rainClouds, haze, gameScene, rainScene, treesBool = true, FSlabels, satLabel, labelBaseY;
    var slopePositionsX = [], slopePositionsY = [], FSarray = [], slopeArray = [], Carray = [1,1,1,1,1,1,1], rainTotal = 0, saturation = 0;
    var HrField;	// pull reg height from HTML slider
    var Hr;
var upKey;
var downKey;
var shiftKey;
var soilbody;
var mouse;
var shovel;
var dirtbutton;
var objects;
var rainbtn;
var raining;
var treeplant;
var emitter;
var fluid;
var droplet;
var TKey;
var treebtn;
var pass;
var ti;
var overButton;
var buttonModesArray;
var one;
var objectSprite;
var shrubbtn;
var infobtn;
var buttonNumber;

var fs;
var Cohesion;
var saturation;
var failplane;
var internalfrict;
var slabthickness;
var cohensiontext;
var slabtext;
var saturationtext;
var failuretext;
var frictiontext;
var objectexists;
var FStext;
var grav;
var phi;
var Coh;
var k;
var rho_w;
var rho_r;
var sat_rate;
var drain_rate;
var m;
var theta;
var numpts;
var t;
var tmax;
var dx;
var x;
var Hr;
var xPoints;
var zPoints;
var Xmax;
var Xmin;
var numPoints;
var dots;
var raining;
var ukey;
var showdots;
var reddot;
var bluedot;
var reddot;
var bluedot;
var dotGroup;
var showdotmode;


this.background = g.add.image(0, 0, 'sky_dust');
 this.bedrock = g.add.sprite(0, 230, 'bedrock');
this.fs=1;
this.grav=9.81;
  var range = [];
  this.range = [0,171,172,330];
  this.graphic= g.add.graphics(0, 0);
  this.bottompoints = [[0,259],
  [35,247],[58,235],[83,232],[113,232],[171,239],[186,238],[204,245],[235,268],
  [265,285],[306,308],[330,326],[357,345],[394,380],[416,395],[443,413],[477,425],
  [501,432],[550,433],[604,433]];
  this.toppoints=[[604,383], [550,383], [501,382], [477,375], [443,363], [416,345],
  [394,330], [357,295], [330,276], [306,258], [265,235], [235,218], [204,195],
   [186,188], [171,186], [113,179], [83,179], [58,183], [35,195], [0,209]];
this.xPoints = [];
this.zPoints = [];
this.Xmax=this.toppoints[0][0]-1;
this.Xmin=this.bottompoints[0][0]+1;

this.HrField = document.getElementById("Hreg");
this.one = 0;
this.objects = g.add.group();
this.fluid = g.add.group();
this.dotGroup = g.add.group();


this.showdotmode=false;
this.upKey = g.input.keyboard.addKey(Phaser.Keyboard.UP);
this.downKey = g.input.keyboard.addKey(Phaser.Keyboard.DOWN);
this.shiftKey = g.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
this.TKey = g.input.keyboard.addKey(Phaser.Keyboard.T);
this.ukey = g.input.keyboard.addKey(Phaser.Keyboard.U);
this.soilbody = new Phaser.Physics.Box2D.Body(this.game, null, 0, 0, 0);
this.drawgraphic(this.graphic, this.bottompoints, this.toppoints);
this.dirtbutton = false;
this.raining = false;
this.treeplant = false;
this.overButton = false;
//0: dirtmode/ 1: treemode/ 2: rainmode, 3: bushes, 4 Info
this.buttonModesArray=[false, false, false, false, false];
this.objectexists=false;

this.Cohesion = "?";
this.saturation ="?";
this.failplane = "?";
this.internalfrict ="?";
this.slabthickness = "?";
//this.g = 9.81;       // m/s2
this.rho_w = 1000;   // kg/m3
this.rho_r = 1700;   // kg/m3
this.phi = 27;       // angle of internal friction, degrees
this.Coh = 12000;      // cohesion, Pa
this.k = .01;        // infiltration rate / conductivity term, scales the rate of progress of the wetting front
this.sat_rate = 0.07;    // saturation level increase per time step
this.drain_rate = 0.04;  // saturation decrease per time step per unit saturation

this.m0 = 0;          // initial fractional saturation, 0-1
this.theta = 32;      // degrees slope

this.numpts = 500;    // number of points

this.t = 0;          // initial model time, wks
this.tmax = 10 * 52; // maximum model run time, wks

this.dx = 1;
//this.x = -10:dx:10;
//this.Hr = 2*ones(size(x)) + randn(size(x))*0.1;

 this.cohensiontext = g.add.text(400, 20, "Cohesion:",  { font: "Bold 50px Arial", fill: '#000000' });
 this.slabtext = g.add.text(400, 40, "Slab Thickness:",  { font: "Bold 50px Arial", fill: '#000000' });
 this.saturationtext = g.add.text(400, 60, "Saturation:",  { font: "Bold 50px Arial", fill: '#000000' });
 this.failuretext = g.add.text(400, 80, "Failure Plane:",  { font: "Bold 50px Arial", fill: '#000000' });
 this.FStext = g.add.text(400, 100, "Factor of Safety:",  { font: "Bold 50px Arial", fill: '#000000' });
 //this.frictiontext = g.add.text(400, 100, "Angle of Internal Friction:",  { font: "Bold 50px Arial", fill: '#000000' });

this.dots = [];

this.emitter = g.add.emitter(g.world.centerX, 0, 400);
this.rainemitter(this.emitter);
this.showdots = g.add.button(260, 10, 'quest', this.showdotsmode, this, 2, 1, 0);
this.showdots.scale.setTo(0.2, 0.2);
this.shovel = g.add.button(10, 10, 'shovel', this.dirtmode, this, 2, 1, 0);
this.shovel.scale.setTo(0.02, 0.02);
this.rainbtn = g.add.button(100, 10, 'rain_ov', this.rainmode, this, 2, 1, 0);
this.rainbtn.scale.setTo(0.5, 0.5);
this.treebtn = g.add.button(50, 10, 'trees1', this.treemode, this, 2, 1, 0);
this.treebtn.scale.setTo(0.5, 0.5);
this.shrubbtn = g.add.button(160, 10, 'shrub', this.shrubMode, this, 2, 1, 0);
this.shrubbtn.scale.setTo(1.5, 1.5);
this.infobtn = g.add.button(210, 10, 'info', this.inspectmode, this, 2, 1, 0);
this.infobtn.scale.setTo(0.025, 0.025);
g.input.onTap.add(this.onTap, this);
 this.shovel.onInputOver.add(this.isover, this);
 this.shovel.onInputOut.add(this.out, this);
 this.rainbtn.onInputOver.add(this.isover, this);
 this.rainbtn.onInputOut.add(this.out, this);
 this.treebtn.onInputOver.add(this.isover, this);
 this.treebtn.onInputOut.add(this.out, this);
 this.shrubbtn.onInputOver.add(this.isover, this);
 this.shrubbtn.onInputOut.add(this.out, this);
 this.infobtn.onInputOver.add(this.isover, this);
 this.infobtn.onInputOut.add(this.out, this);
 this.showdots.onInputOver.add(this.isover, this);
 this.showdots.onInputOut.add(this.out, this);
 this.raining=true;
this.pass = false;
this.ti = g.time.create();
//this.ti.loop(50, this.waterdrops, this);
this.ti.start();
 this.addShaders();
 this.ti.pause();

},
  drawgraphic: function(graphic, bottompoints, toppoints){
    graphic.clear()
    graphic.beginFill(0x7C450D);
    graphic.lineStyle(1, 0x000000, 1);

    graphic.moveTo(bottompoints[0][0], bottompoints[0][1]);
    //console.log(bottompoints[0][1]);
//console.log('{' +bottompoints[0] + ',' + bottompoints[1] +'}');
    for (var t = 1; t < bottompoints.length; t++){
      //console.log(t);
      //console.log('{' +bottompoints[t] + ',' + bottompoints[t+1] +'}');
    graphic.lineTo(bottompoints[t][0],bottompoints[t][1]);
  }
for (var r = 0; r < toppoints.length; r++){
    //console.log(r);
  //  console.log('{' +toppoints[r] + ',' + toppoints[r+1] +'}');
 graphic.lineTo(toppoints[r][0],toppoints[r][1]);
  }

    graphic.endFill();

    g.world.bringToTop(this.bedrock);
},

pointsInArea: function (numPts) {
  let xp;
//console.log();
  for(let i = 0; i < numPts; i++){
//console.log("works:");
  xp = this.randomPoint(this.Xmin, this.Xmax );
  //console.log(xp);
  let zp = this.randomZPoint(xp, i);
//console.log(xp);
//console.log(zp);
//console.log(this.dots[i]);
  this.addDotToGroup(xp, zp);

}
},
randomPoint: function ( min, max) {
  return g.rnd.between(min, max);
},
randomZPoint: function (xpoint ) {
  let dot = [];
  let topR = this.checkXPosition(xpoint, this.toppoints, 1);
  let botR = this.checkXPosition(xpoint, this.bottompoints, -1);

  let TopXY = this.findPosition(topR, xpoint, this.toppoints, 1);
  let BotXY = this.findPosition(botR, xpoint, this.bottompoints, -1);

  let slope =  this.findSlope(botR, this.bottompoints, -1);
  let zp = this.randomPoint(TopXY[1], BotXY[1]);
  let width = this.bottompoints[botR][1]-zp;
  dot["xPoint"] = xpoint;
  dot["yPoint"]= zp;
  dot["zPoint"] = width;

  dot["theta"] = this.rad2Deg(Math.atan(slope));
  dot["m"]=0;
  dot["satDepth"]=0;
  dot["sH"]=BotXY[1]-TopXY[1];
  dot["Cohesion"]=this.Coh;
  dot["FS"]=this.FScalc(dot);


  this.dots.push(dot);


  return zp;

},
addDotToGroup: function(x,z) {

let dot = g.add.graphics(0, 0);
    // graphics.lineStyle(2, 0xffd900, 1);

    dot.beginFill(0xFF0000, 1);
    dot.drawCircle(x, z , 4);

    if(this.showdotmode){
      g.world.bringToTop(dot);
    }else{
      g.world.bringToTop(this.graphic);
      g.world.bringToTop(this.bedrock);
    }

this.dotGroup.add(dot);
},
FScalc: function (point) {
  return (point["Cohesion"] + (this.rho_r-point["m"]*this.rho_w)*this.grav*Math.cos(this.deg2Rad(point["theta"]))*Math.tan(this.deg2Rad(this.phi))*point["sH"])/(this.rho_r*this.grav*point["sH"]
  *Math.sin(this.deg2Rad(point["theta"])));
},
deg2Rad: function (val) {
  return val * Math.PI / 180;
},
rad2Deg: function(val){
  return val * 180 / Math.PI;;
},

rainingMath: function () {
  this.pointsInArea(this.numpts);

},

waterdrops: function() {
  var droplet = this.fluid.getFirstDead();
    let toplength = this.toppoints.length;
    if(this.one == 0){
      this.one = 1 ;
    }
    else{
      this.one = 0;
    }

     if (droplet) {
         // A recycled droplet was available, so reset it
         droplet.reset(this.toppoints[toplength-10]+this.one, this.toppoints[toplength-9]-20);
     } else {
         // No recycled droplets were available so make a new one

         droplet = g.add.sprite(this.toppoints[toplength-10]+this.one, this.toppoints[toplength-9]-20, 'water');

         // Enable physics for the droplet
         droplet.scale.x = 0.2;
        droplet.scale.y = 0.2;
         g.physics.box2d.enable(droplet);
         droplet.body.collideWorldBounds = true;

         // This makes the collision body smaller so that the droplets can get
         // really up close and goopy
         droplet.body.setCircle(droplet.width * 0.3);

         // Add a force that slows down the droplet over time
         droplet.body.damping = 0.3;

         // Add the droplet to the fluid group
         this.fluid.add(droplet);

     }

},
raindrop: function() {

  this.droplet.scale.x = 0.3;
  this.droplet.scale.y = 0.3;
  g.physics.box2d.enable(this.droplet);
  this.droplet.body.setCircle(this.droplet.width * 0.3);
  this.droplet.damping = 0.3;
},

isover: function() {
  //console.log("button is over");
  this.overButton =true;
},
out: function () {
//  console.log("button left");
  this.overButton =false;
},
rainemitter: function (emitter) {



  emitter.width = g.world.width;

  emitter.makeParticles('rain');



  emitter.minParticleScale = 0.1;
  emitter.maxParticleScale = 0.5;

  emitter.setYSpeed(300, 500);
  emitter.setXSpeed(-5, 5);

  emitter.minRotation = 0;
  emitter.maxRotation = 0;
  emitter.start(false, 1600, 5, 0);
  emitter.on = false;

},

/*areaFinder: function (x1, yb1, yu1 x2, yb2, yu2) {
let a = Phaser.Math.distance(x1,yb1,x1,yu1);
let b = Phaser.Math.distance(x2,yb2,x2,yu2);
let h = Phaser.Math.distance(x1,0,x2,0);
console.log(a);
console.log(b);
console.log(h);

let area = ((a+b)/2)h;
  console.log(area);
},*/

adddirt: function(x) {

//console.log(this.toppoints);
  let r = this.checkXPosition(x, this.toppoints);
  //var r = this.checkXPosition(x, this.toppoints);


      if (this.toppoints[r+1][0] != 0){

        this.toppoints[r+2][1]=this.toppoints[r+2][1]-1;
      }
      if (this.toppoints[r][0] != 604){
          this.toppoints[r-1][1]=this.toppoints[r-1][1]-1;
      }
      this.toppoints[r][1]=this.toppoints[r][1]-2;
      this.toppoints[r+1][1]=this.toppoints[r+1][1]-2;
        this.checkObjectsPositions(r);


},
checkXPosition: function(x, pointsArray, move){
  for (var r = 0; r < pointsArray.length; r++){
    if (pointsArray[r][0] >= x && pointsArray[r+move][0] < x ){

      return r;
    }
  }

},
showdotsmode: function () {
  if(this.showdotmode){
    this.showdotmode=false;
  }else{
    this.showdotmode = true;
  }

  if(this.showdotmode && this.raining){
    g.world.bringToTop(this.dotGroup);
  }else{
    g.world.bringToTop(this.graphic);
    g.world.bringToTop(this.bedrock);
  }
},
removedirt: function(x) {
  var r = this.checkXPosition(x, this.toppoints);
      if (this.toppoints[r+1][0] != 0){

        this.toppoints[r+2][1]=this.toppoints[r+2][1]+1;
      }
      if (this.toppoints[r][0] != 604){
          this.toppoints[r-1][1]=this.toppoints[r-1][1]+1;
      }
      this.toppoints[r][1]=this.toppoints[r][1]+2;
      this.toppoints[r+1][1]=this.toppoints[r+1][1]+2;
      this.checkObjectsPositions(r);


},
pointfinder: function (xpoint, ypoint) {
  let dist;
  let close = 1000;
  let r;
  for(let t = 0; t < this.numpts-1; t++){
    dist = Phaser.Math.distance(xpoint, ypoint, this.dots[t]["xPoint"], this.dots[t]["yPoint"]);
    if(close > dist){
      r =t;
      close = dist;
    }
  }
  return r;

},
infoShower: function (xpoint, ypoint) {
let r = this.pointfinder(xpoint, ypoint)


 this.cohensiontext.setText("Cohesion:"+ this.dots[r]["Cohesion"]);
 this.slabtext.setText("Slab Thickness:"+this.dots[r]["sH"]);
 this.saturationtext.setText("Saturation:"+this.dots[r]["m"]);
 this.failuretext.setText("Failure Plane:"+this.dots[r]["theta"]);
 this.FStext.setText("Factor of Safety:"+this.dots[r]["FS"]);
 //this.frictiontext.setText("Angle of Internal Friction:"+this.dots[][]);
},

infoHider: function () {
 this.cohensiontext.setText("Cohesion:");
 this.slabtext.setText("Slab Thickness:");
 this.saturationtext.setText("Saturation:");
 this.failuretext.setText("Failure Plane:");
 //this.frictiontext.setText("Angle of Internal Friction:");
this.FStext.setText("Factor of Safety:");
},


checkObjectsPositions: function (r) {
  //console.log("checkOP");
  this.objects.forEach(this.alterChild, this, true, r);

},
alterChild: function (child, r) {
  //console.log("altkid");
  if(this.doesObjectExistInRange(child.x, this.toppoints[r+6], this.toppoints[r-4]))
  {
    let e;
    e = this.checkXPosition(child.x, this.toppoints);
    let pos = this.findPosition(e, child.x, this.toppoints, 1);
    child.x = pos[0];
    child.y = pos[1];
  }
},


buttonReset: function (disbutton) {
  for(var y=0; y < this.buttonModesArray.length; y++){
    if(y != disbutton){
      this.buttonModesArray[y]=false;
    }
  }



  if(!this.buttonModesArray[disbutton])
    this.buttonModesArray[disbutton] = true;
  else
      this.buttonModesArray[disbutton] = false;

},



findArrayYpoint: function(xpoints) {
let ypoint = [];
for(let i = 0; i < xpoints; i++){
  ypoint.push(this.checkXPosition(xpoints[i])+1, this.toppoints);
}

  return ypoint;
},
//uses array y points
erosionlowerdirtheight: function( YPoints, endYPointHeight) {

  let keepgoing = true;
  while(keepgoing){
    keepgoing = false;
  for(let i =0 ; i < endYPointsHeight.length; i++){
      if(this.toppoints[YPoints[i]] != endendYPointsHeight[i]){
        this.toppoints[YPoints[i]]=this.toppoints[YPoints[i]]+1;
        keepgoing = true;
      }
  }
}
},

erosionraisedirtheight: function() {

},
mudReplacer: function(){
let dirtArea = this.trapizoidArea();

},
trapizoidArea: function (ax1, ay1, bx1, by1, ax2, ay2, bx2, by2) {
  let line1 = Math.distance(ax1, ay1, bx1, by1);
  let line2 = Math.distance(ax2, ay2, bx2, by2);
  let height = Math.distance(200, by1, 200, by2);
  let area = ((line1+line2)*height)/2;
  return area;
},

areaComparer: function () {

},

eroder: function(r, rate) {

},

factorOfSafetyChecker(alpha, omega, ps, pw, cohesion, m){
  let z=(cohesion)/(grav*((pw*m*Math.cos(omega)*Math.tan(alpha))-(ps*Math.cos(omega)*Math.tan(alpha))+(fs*ps*Math.sin(omega))));
  console.log(z);
  return z;
},

dirtmode: function () {
  this.buttonReset(0);
},
inspectmode: function () {
  this.buttonReset(4);
},
rainmode: function () {
  if(this.raining){
    this.raining=false;
  }else{
    this.raining = true
  }

  if(this.raining){
    //this.ti.resume();
    this.emitter.on= true;
    this.rainingMath();
  }
  else{
    //this.ti.pause();
    this.emitter.on= false;
  }
},


treemode: function () {

   this.buttonReset(1);
   this.buttonNumber =1;
   this.objectSprite = "trees1";
},
shrubMode: function() {
  this.buttonReset(3);
  this.buttonNumber = 3;
  this.objectSprite = "shrub";
},
addObject: function(x, sprite) {


  let r = this.checkXPosition(x, this.toppoints);
  this.objectexists=false;
this.objects.forEach(this.tester, this, true, r);

  let pos = this.findPosition(r, x, this.toppoints, 1);
if(!this.objectexists){
let object = g.add.sprite(pos[0], pos[1] , sprite);
object.anchor.x = 0.5;
object.anchor.y = 0.9;

this.objects.add(object);
g.world.bringToTop(this.graphic);
}



},

tester: function (r) {
  if(this.doesObjectExistInRange(r, this.toppoints[r+1][0],this.toppoints[r][0])){
    this.objectexists=true;
  }
},



doesObjectExistInRange: function (x, min, max) {

  if(max > x  && x > min){
    return true;
  }

},

onTap: function (pointer) {
  if(this.buttonModesArray[this.buttonNumber]  && !this.overButton){
    this.addObject(pointer.x, this.objectSprite);
  }

},





findPosition: function (i, x, pointsArray, move) {
  let slope = this.findSlope(i, pointsArray, move);
  let xy = [];
  let y = slope*(x - pointsArray[i][0]) + pointsArray[i][1];
  xy[0] = x;
  xy[1] = y;
  return xy;
},


findFailurePlainAngle: function (i){
  let slope = this.findSlope(i, this.toppoints, 1);
  let failure = Math.atan(slope);
  this.failplane = failure * 180 / Math.PI;
},


findSlope: function (i, pointsArray, move) {
  //console.log(i);
  let y = pointsArray[i][1]-pointsArray[i+move][1];
  let x = pointsArray[i][0]-pointsArray[i+move][0];
  let slope = y/x;
  return slope;
},




update: function(){
  this.drawgraphic(this.graphic, this.bottompoints, this.toppoints);
  this.soilbody.setChain(this.toppoints);
this.Hr = Number(this.HrField.value);

if(this.buttonModesArray[4]  && !this.overButton){

    if(g.input.mousePointer.isDown){
      this.infoShower(g.input.mousePointer.x, g.input.mousePointer.y);
    }

}
else if (!this.buttonModesArray[4]){
  this.infoHider();
}


if(this.buttonModesArray[0]  && !this.overButton){
  if (this.shiftKey.isDown){
    if (g.input.mousePointer.isDown){
          this.removedirt(g.input.mousePointer.x);


      }
    }
  else if (g.input.mousePointer.isDown){

      this.adddirt(g.input.mousePointer.x);


  }
}
this.fluid.forEachAlive(function(droplet) {
    if (droplet.y > g.height - 15) {
      droplet.body.velocity.x = 0;
      droplet.body.velocity.y = 0;
      droplet.kill();
    }
}, this);


},
render: function() {
  //g.debug.text("Cohesion:"+this.Cohesion , 300,20);
  //g.debug.text("Slab Thickness:"+this.slabthickness, 300, 40);
  //g.debug.text("Saturation:"+this.saturation ,300, 60);
  //g.debug.text("Failure Plane:"+this.failplane, 300, 80);
  //g.debug.text("Angle of Internal Friction:"+this.internalfrict, 300, 100);

	//g.debug.box2dWorld();

},
addShaders: function(){
    var blurX = g.add.filter('BlurX');
    var blurY = g.add.filter('BlurY');
    blurX.blur = 16;
    blurY.blur = 16;
    var threshShader = g.add.filter('Threshold');
    this.fluid.filters = [ blurX, blurY, threshShader];
    this.fluid.filterArea = g.camera.view;
}

};
