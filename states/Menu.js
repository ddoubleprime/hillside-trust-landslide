var scenario;

var menuState = {
    create: function(){
        var sceneParams = g.cache.getJSON('sceneParams');
        console.log(sceneParams)

        var worldW = 603, worldH = 504;
        g.add.image(0,0,'sky_dust')
        g.add.text(80, 120, "Choose a scenario to start:", {font:"30pt Times", stroke:"#000000", strokeThickness:4, fill: "#998355"});

        // populate menu
        var yTextPos = 180;
        var menuHandles = [];
        
        for (i=0; i<sceneParams.active_scenarios.length; i++) {
            menuHandles[i] = g.add.text(100, yTextPos, sceneParams[sceneParams.active_scenarios[i]].display_name, {font:"24pt Helvetica", stroke:"#333333", strokeThickness:4, fill: "#449955"});
            menuHandles[i].inputEnabled=true;
            menuHandles[i].scenario = sceneParams.active_scenarios[i];
            menuHandles[i].events.onInputOver.add(this.over, this);
            menuHandles[i].events.onInputOut.add(this.out, this);
            menuHandles[i].events.onInputDown.add(this.down, this);
            menuHandles[i].events.onInputUp.add(this.up, this);
            yTextPos = yTextPos+40;
        }

       
        // version text  
        g.add.text(400, 480, "Version 0.2.0b, 2019-01-21", {font:"12pt Arial", stroke:"#000000", strokeThickness:0, fill: "#FFFF99"});


    },

    over: function(item) {

        g.canvas.style.cursor = "pointer"
        item.fill = "#ffff44";

    },

    out: function(item) {
        
        g.canvas.style.cursor = "default"
        item.fill = "#449955";

    },

    down: function(item) {

        item.stroke = "ffff00";
        item.strokeThickness = 4

    },

    up: function(item) {

        scenario = item.scenario; 

        g.state.start('play');

    }


};
