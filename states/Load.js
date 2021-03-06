
var loadState = {
preload: function(){
  g.load.image('sky_dust', 'ls-assets/bg_sky_dusky.png');
  g.load.image('sky_gloom', 'ls-assets/bg_sky_gloomy.png');
  g.load.image('sky_strata', 'ls-assets/bg_sky_strata.png');
  g.load.image('bedrock', 'ls-assets/bedrock_basic.png');
  //g.load.image('rain_dn', 'ls-assets/button_rain_dn.png');
  //g.load.image('rain_ov', 'ls-assets/button_rain_ov.png');
  //g.load.image('rain_up', 'ls-assets/button_rain_up.png');
  g.load.spritesheet('rain_button','ls-assets/button_rain.png',112,112)
  g.load.spritesheet('menu_button','ls-assets/button_menu.png',111,41)
  g.load.spritesheet('reset_button','ls-assets/button_reset.png',111,41)
  g.load.spritesheet('scene1_button','ls-assets/buttons_scenarios-01.png',222,82)
  g.load.spritesheet('scene2_button','ls-assets/buttons_scenarios-02.png',222,81)
    
  g.load.image('cloud1', 'ls-assets/cloud1.png');
  g.load.image('cloud2', 'ls-assets/cloud2.png');
  g.load.image('grass', 'ls-assets/grass.png');
  g.load.image('house', 'ls-assets/house.png');
  g.load.spritesheet('housebtn','ls-assets/button_house.png',66,59)
  g.load.image('river', 'ls-assets/river.png');
  g.load.image('shrub', 'ls-assets/shrub1.png');
  g.load.spritesheet('shovel', 'ls-assets/shovel.png',256,256);
  g.load.image('soil', 'ls-assets/soil_basic.png');
  g.load.image('trees1', 'ls-assets/trees1.png');
  g.load.image('quest', 'ls-assets/question.png');
  g.load.spritesheet('dumptruck', 'ls-assets/button_dumptruck.png',256,256);
  g.load.spritesheet('clods','ls-assets/clods.png',32,32);
  g.load.image('trees2', 'ls-assets/trees2.png');
  g.load.spritesheet('rain', 'ls-assets/rain.png', 17, 17);
  g.load.image('water', '/ls-assets/ball.png');
  g.load.image('info', 'ls-assets/glass.png');
  g.load.script('filterX', 'js/phaser-ce-2.10.0/filters/BlurX.js');
  g.load.script('filterY', 'js/phaser-ce-2.10.0/filters/BlurY.js');
  g.load.script('threshold', 'js/phaser-ce-2.10.0/filters/Threshold.js');
  g.load.json('sceneParams','sim_params.json')
},
create: function() {
  g.add.text(g.world.width/2-20, g.world.height/2, "Loading...", {fill: "#CCCCff"});

  g.state.start('menu');
}

};
