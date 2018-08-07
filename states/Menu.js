

var menuState ={
  create: function(){
    g.add.text(10, 10, "Press W to start game", {fill: "#ffffff"});
    g.add.text(10, 40, "Use the shovel to remove dirt", {fill: "#ffffff"});
    g.add.text(10, 70, "Use the dump truck to add dirt", {fill: "#ffffff"});

    var wkey = g.input.keyboard.addKey(Phaser.Keyboard.W);

    wkey.onDown.addOnce(this.start, this);
  },
  start: function(){
    g.state.start('play');
  }

};
