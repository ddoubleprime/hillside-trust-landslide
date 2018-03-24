var playState = {

  create: function(){
    var background;
    var soil, bedrock, decorations, clouds, rainClouds, haze, gameScene, rainScene, treesBool = true, FSlabels, satLabel, labelBaseY;
    var slopePositionsX = [], slopePositionsY = [], FSarray = [], slopeArray = [], Carray = [1,1,1,1,1,1,1], rainTotal = 0, saturation = 0;
var upKey;
var downKey;
var shiftKey;
var soilbody;
var mouse;
var shovel;
var dirtbutton;
var trees;
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
var one;
  background = g.add.image(0, 0, 'sky_dust');
  bedrock = g.add.sprite(0, 230, 'bedrock');
  var range = [];
  this.range = [0,171,172,330];
  this.graphic= g.add.graphics(0, 0);
  this.bottompoints= [0,259,35,247,58,235,83,232,113,232,171,239,186,238,204,245,235,268,265,285,306,308,330,326,357,345,394,380,416,395,443,413,477,425,501,432,550,433,604,433];
  this.toppoints=[604,383, 550,383, 501,382, 477,375, 443,363, 416,345, 394,330, 357,295, 330,276, 306,258, 265,235, 235,218, 204,195, 186,188,171,186,113,179,83,179,58,183,35,195,0,209];

this.one = 0;
this.trees = g.add.group();
this.fluid = g.add.group();
this.upKey = g.input.keyboard.addKey(Phaser.Keyboard.UP);
this.downKey = g.input.keyboard.addKey(Phaser.Keyboard.DOWN);
this.shiftKey = g.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
this.TKey = g.input.keyboard.addKey(Phaser.Keyboard.T);
this.soilbody = new Phaser.Physics.Box2D.Body(this.game, null, 0, 0, 0);
this.drawgraphic(this.graphic, this.bottompoints, this.toppoints);
this.dirtbutton = false;
this.raining = false;
this.treeplant = false;

this.emitter = g.add.emitter(g.world.centerX, 0, 400);
this.rainemitter(this.emitter);
this.shovel = g.add.button(10, 10, 'shovel', this.dirtmode, this, 2, 1, 0);
this.shovel.scale.setTo(0.02, 0.02);
this.rainbtn = g.add.button(100, 10, 'rain_ov', this.rainmode, this, 2, 1, 0);
this.rainbtn.scale.setTo(0.5, 0.5);
this.treebtn = g.add.button(50, 10, 'trees1', this.treemode, this, 2, 1, 0);
this.treebtn.scale.setTo(0.5, 0.5);
g.input.onTap.add(this.onTap, this);
this.pass = false;
this.ti = g.time.create();


},
  drawgraphic: function(graphic, bottompoints, toppoints){
    graphic.clear()
    graphic.beginFill(0x7C450D);
    graphic.lineStyle(1, 0x000000, 1);

    graphic.moveTo(bottompoints[0], bottompoints[1]);
//console.log('{' +bottompoints[0] + ',' + bottompoints[1] +'}');
    for (var t = 2; t < bottompoints.length; t += 2){
      //console.log(t);
      //console.log('{' +bottompoints[t] + ',' + bottompoints[t+1] +'}');
    graphic.lineTo(bottompoints[t],bottompoints[t+1]);
  }
for (var r = 0; r < toppoints.length; r += 2){
    //console.log(r);
  //  console.log('{' +toppoints[r] + ',' + toppoints[r+1] +'}');
 graphic.lineTo(toppoints[r],toppoints[r+1]);
  }

    graphic.endFill();

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

adddirt: function(x) {

//console.log(this.toppoints);
  var r = this.checkXPosition(x);
      if (this.toppoints[r+2] != 0){

        this.toppoints[r+5]=this.toppoints[r+5]-1;
      }
      if (this.toppoints[r] != 604){
          this.toppoints[r-1]=this.toppoints[r-1]-1;
      }
      this.toppoints[r+1]=this.toppoints[r+1]-2;
      this.toppoints[r+3]=this.toppoints[r+3]-2;
        this.checkObjectsPositions(r);

},
checkXPosition: function(x){
  for (var r = 0; r < this.toppoints.length; r += 2){
    if (this.toppoints[r] > x && this.toppoints[r+2] < x ){
      return r;
    }
  }

},

removedirt: function(x) {
  var r = this.checkXPosition(x);
      if (this.toppoints[r+2] != 0){

        this.toppoints[r+5]=this.toppoints[r+5]+1;
      }
      if (this.toppoints[r] != 330){
          this.toppoints[r-1]=this.toppoints[r-1]+1;
      }
      this.toppoints[r+1]=this.toppoints[r+1]+2;
      this.toppoints[r+3]=this.toppoints[r+3]+2;
      this.checkObjectsPositions(r);


},
checkObjectsPositions: function (r) {
  console.log("checkOP");
  this.trees.forEach(this.alterChild, this, true, r);

},
alterChild: function (child, r) {
  console.log("altkid");
  if(this.doesObjectExistInRange(child.x, this.toppoints[r+6], this.toppoints[r-4]))
  {
    let e;
    e = this.checkXPosition(child.x);
    let pos = this.findPosition(e, child.x);
    child.x = pos[0];
    child.y = pos[1];
  }
},


buttonReset: function (disbutton) {

  if(!disbutton)
    button = true;
  else
      button = false;
  return button;
},
dirtmode: function () {
  this.dirtbutton = this.buttonReset(this.dirtbutton);
},
rainmode: function () {
  this.raining = this.buttonReset(this.raining);

  if(this.raining){
    this.ti.loop(50, this.waterdrops, this);
    this.ti.start();
     this.addShaders();
    this.emitter.on= true;
  }
  else{
    this.ti.pause();
    this.emitter.on= true;
  }
},
treemode: function () {

  this.treeplant = this.buttonReset(this.treeplant);
},
addtree: function(x) {
  let r = this.checkXPosition(x);

    let pos = this.findPosition(r, x)
  let tree = g.add.sprite(pos[0], pos[1] ,'trees1')
tree.anchor.x = 0.5;
tree.anchor.y = 0.9;

this.trees.add(tree);

},

doesObjectExistInRange: function (x, min, max) {
  if(max > x  && min < x ){
    return true;
  }

},

onTap: function (pointer) {
  if(this.treeplant){
    this.addtree(pointer.x);
  }

},

findPosition: function (i, x) {
  let slope = this.findSlope(i);
  let xy = [];
  let y = slope*(x - this.toppoints[i]) + this.toppoints[i+1];
  xy[0] = x;
  xy[1] = y;
  return xy;
},

findSlope: function (i) {
  let y = this.toppoints[i+1]-this.toppoints[i+3];
  let x = this.toppoints[i]-this.toppoints[i+2];
  let slope = y/x;
  return slope;
},
update: function(){
  this.drawgraphic(this.graphic, this.bottompoints, this.toppoints);
  this.soilbody.setChain(this.toppoints);

if(this.dirtbutton){
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
