var scenario;

var menuState ={
  create: function(){
    var sceneParams = g.cache.getJSON('sceneParams');
      console.log(sceneParams)
    
    var worldW = 603, worldH = 504;
    g.add.image(0,0,'sky_dust')
    g.add.text(80, 120, "Choose a scenario to start:\n"+sceneParams[sceneParams.active_scenarios[0]].display_name+"\n"+sceneParams[sceneParams.active_scenarios[1]].display_name, {font:"30pt Times", stroke:"#000000", strokeThickness:4, fill: "#998355"});
      
      
    g.add.text(400, 480, "Version 0.2.0b, 2019-01-21", {font:"12pt Arial", stroke:"#000000", strokeThickness:0, fill: "#FFFF99"});

/*
    var simpleSlopeButton = g.add.button(worldW/2 - 240, worldH/2, 'scene1_button', function(){scenario = "simple_slope"; g.state.start('play')}, this,1,3,2,3);
    simpleSlopeButton.scale.setTo(1, 1); 

    var landscapeButton = g.add.button(worldW/2 + 18, worldH/2, 'scene2_button', function(){scenario = "standard_landscape"; g.state.start('play')}, this,1,3,2,3);
    landscapeButton.scale.setTo(1, 1); 
*/
  },


};
