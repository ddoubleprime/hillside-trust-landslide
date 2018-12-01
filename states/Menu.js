

var menuState ={
  create: function(){
    var worldW = 603, worldH = 504;
    g.add.image(0,0,'sky_dust')
    g.add.text(80, 120, "Choose a scenario to start!", {font:"30pt Times", stroke:"#000000", 
                                                       strokeThickness:4, fill: "#998355"});
    g.add.text(400, 480, "Version 0.1.3b, 2018-11-27", {font:"12pt Arial", stroke:"#000000", strokeThickness:0, fill: "#FFFF99"});

    var simpleSlopeButton = g.add.button(worldW/2 - 240, worldH/2, 'scene1_button', function(){g.state.start('play2')}, this,1,3,2,3);
    simpleSlopeButton.scale.setTo(1, 1); 
      
    var landscapeButton = g.add.button(worldW/2 + 18, worldH/2, 'scene2_button', function(){g.state.start('play')}, this,1,3,2,3);
    landscapeButton.scale.setTo(1, 1); 

  },


};
