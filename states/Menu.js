

var menuState ={
  create: function(){
    g.add.text(10, 10, "Press W to start game", {fill: "#ffffff"});
    g.add.text(10, 40, "Press the shovel icon to enter/exit dirtmode,", {fill: "#ffffff"});
    g.add.text(10, 70, "Click on the screen to add dirt", {fill: "#ffffff"});
    g.add.text(10, 110, ", hold shift and click to remove it", {fill: "#ffffff"});
    g.add.text(10, 150, "Click the tree icon to enter/exit tree mode", {fill: "#ffffff"});
    g.add.text(10, 190, "Click on the screen to add trees", {fill: "#ffffff"});
    g.add.text(10, 230, "Click the rain button for rain effects", {fill: "#ffffff"});

    var wkey = g.input.keyboard.addKey(Phaser.Keyboard.W);

    wkey.onDown.addOnce(this.start, this);
  },
  start: function(){
    g.state.start('play');
  }

};
