var scenario;

var menuState = {
    create: function(){
        var sceneParams = g.cache.getJSON('sceneParams');
        console.log(sceneParams)

        var worldW = 603, worldH = 504;
        g.add.image(0,0,'sky_dust')
        g.add.text(80, 120, "Choose a scenario to start:", {font:"30pt Times", stroke:"#000000", strokeThickness:4, fill: "#998355"});

        // populate menu
        var lineStr = "";
        var menuHandles = [];
        
        for (i=0; i<sceneParams.active_scenarios.length; i++) {
            menuHandles[i] = g.add.text(100, 180, lineStr+sceneParams[sceneParams.active_scenarios[i]].display_name, {font:"24pt Helvetica", stroke:"#333333", strokeThickness:5, fill: "#449955"});
            menuHandles[i].inputEnabled=true;
            menuHandles[i].scenario = sceneParams.active_scenarios[i];
            menuHandles[i].events.onInputOver.add(this.over, this);
            menuHandles[i].events.onInputOut.add(this.out, this);
            menuHandles[i].events.onInputDown.add(this.down, this);
            menuHandles[i].events.onInputUp.add(this.up, this);
            lineStr = lineStr+"\n";
        }

       
        // version text  
        g.add.text(400, 480, "Version 0.2.0b, 2019-01-21", {font:"12pt Arial", stroke:"#000000", strokeThickness:0, fill: "#FFFF99"});

        /*
        var simpleSlopeButton = g.add.button(worldW/2 - 240, worldH/2, 'scene1_button', function(){scenario = "simple_slope"; g.state.start('play')}, this,1,3,2,3);
        simpleSlopeButton.scale.setTo(1, 1); 

        var landscapeButton = g.add.button(worldW/2 + 18, worldH/2, 'scene2_button', function(){scenario = "standard_landscape"; g.state.start('play')}, this,1,3,2,3);
        landscapeButton.scale.setTo(1, 1); 
        */
    },

    over: function(item) {

        item.fill = "#ffff44";
        item.text = "clicked "  + " times";
        console.log(item.scenario)

    },

    out: function(item) {

        item.fill = "#ff0044";
        item.text = "click and drag me";

    },

    down: function(item) {

        item.text = "clicked ";

    },

    up: function(item) {

        item.text = "thanks for clicking!";

    }


};
