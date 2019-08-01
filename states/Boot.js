
var bootState = {
  create: function(){

    g.physics.startSystem(Phaser.Physics.BOX2D);
    g.physics.box2d.restitution = 0.2;
    g.physics.box2d.gravity.y = 250;

    g.add.text(g.world.width/2-30, g.world.height/2-20, "Loading...", {fill: "#CCCCff"});

    g.state.start('load');

  }
};
