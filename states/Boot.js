


var bootState = {
  create: function(){
    //g.time.desiredFPS = 30;
    g.physics.startSystem(Phaser.Physics.BOX2D);
    g.physics.box2d.restitution = 0.2;
    g.physics.box2d.gravity.y = 250;
    g.state.start('load');

  }
};
