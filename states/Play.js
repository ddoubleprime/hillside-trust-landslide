var background;
var bedrock;
var x_axis;
var soil_graphic,bedrock_graphic;
var bot_pts, top_pts;
var soilclr = 0x7C450D, rockclr = 0xFF6666;
var dx = 1, VE = 3;     // x-spacing in grid units, vertical exaggeration
var worldW = 603, worldH = 504;
var y_base, soil_surface, bedrock_surface;
var surf_amp=10,surf_wavelength=25,surf_shift=0;
var dx_canvas, dy_canvas, x_axis_canvas, soil_surface_canvas;

var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);

var ti, tiEvent, timeRate = 10000;  // ms per real-world time unit
var timeKeeper, worldTime = 0;

var playState = function(game) {
    
};


playState.prototype = {

    create: function(){
        ti = g.time.create();
        tiEvent = g.time.create();
        background = g.add.image(0, 0, 'sky_dust');
        //bedrock = g.add.sprite(0, 230, 'bedrock');
        soil_graphic = g.add.graphics(0, 0);
        bedrock_graphic = g.add.graphics(0, 0);
        
        x_axis = this.vector(0,100,dx); // grid units
        y_base = Array(x_axis.length); // grid units
        y_base.fill(0);

        console.log(worldW,worldH)
        
        //grid to canvas coordinates
        dx_canvas = worldW / (x_axis.length-1)/dx;   // pixels per grid unit
        dy_canvas = -dx_canvas * VE;                 // pixels per grid unit
        console.log(dx_canvas,dy_canvas);
        
        x_axis_canvas = this.arrayScale(x_axis,dx_canvas,0);
        
        // prepare the land surface array
        bedrock_surface = this.sinFunc(x_axis,surf_amp,surf_wavelength,surf_shift);
        this.rebaseFunc(bedrock_surface);
        // convert to canvas coordinates
        soil_surface_canvas = this.arrayScale(bedrock_surface,dy_canvas,worldH+Hr*dy_canvas);
        y_base_canvas = this.arrayScale(y_base,dy_canvas,worldH);
        
        // make canvas-unit coordinate pairs for drawing
        bot_pts = this.two1dto2d(x_axis_canvas,y_base_canvas);
        top_pts = this.two1dto2d(x_axis_canvas,soil_surface_canvas);

        this.drawgraphic(soil_graphic,bot_pts,top_pts,soilclr)
        
        // prepare the bedrock surface array
        bedrock_surface_canvas = this.arrayScale(bedrock_surface,dy_canvas,worldH);
        // make canvas-unit coordinate pairs for drawing
        top_pts = this.two1dto2d(x_axis_canvas,bedrock_surface_canvas);

        this.drawgraphic(bedrock_graphic,bot_pts,top_pts,rockclr)
        
        ti.start()
        timeKeeper = g.time.events.loop(timeRate, function(){   
            var nowTime = ti.ms / timeRate;
            console.log(Math.round(nowTime));                                                
                if (nowTime > 3) {
                    tiEvent.start();
                    console.log(tiEvent.ms);
                };
                                                            
                                  });
        
    },


/* UPDATER */

    update: function(){
        // get new thickness value
        if (Hr != Number(HrField.value)) {
            Hr = Number(HrField.value);
        
            // update soil thickness and redraw
            soil_surface_canvas = this.arrayScale(bedrock_surface,dy_canvas,worldH+Hr*dy_canvas);
            this.drawgraphic(soil_graphic,bot_pts,this.two1dto2d(x_axis_canvas,soil_surface_canvas),soilclr);
            g.world.bringToTop(bedrock_graphic);
        
        }
        

    },

    
/* SUPPORT FUNCTIONS */
    
    vector: function(mn,mx,step) {
        // creates a 1D array from mn to max by step. 
        // Rounds down to nearest step interval.
        var xa = [];
        
        for (var i=0; i<= (mx-mn) / step; i++) {
            xa[i] = mn+i*step;
        }
        
        return xa;
        
    },
    
    zeros: function(length) {
        // creates a 1D array of zeros of specified integer length
        var za = [];
        
        for (var i=0;i<length;i++) {
            za[i] = 0;
        }
        
        return za;
        
    },
    
    arrayScale: function(arr,factor,canvas_origin) {
        // multiplies all array elements by a constant factor 
        // aligns them to origin (canvas units)
        // and returns result as a new array  
        var xa = Array(arr.length);

        for (var i=0;i<arr.length;i++) {
            xa[i] = arr[i]*factor + canvas_origin;
        }
        
        return xa;
        
    },
    
    sinFunc: function(arr,amp,pd,phase) {
        // returns an array with a shifted sinusoid
        var xa = Array(arr.length);

        for (var i=0;i<arr.length;i++) {
            xa[i] = Math.sin((arr[i]-phase)/pd)*amp;
        }
        
        return xa;
        
    },
    
    rebaseFunc: function(arr) {
        // updates an array by subtracting the lowest value from each element, 
        // such that the lowest value is now zero
        var base_val = Math.min.apply(Math,arr);
        
        for (var i=0;i<arr.length;i++) {
            arr[i] = arr[i]-base_val;
        }
        
        //return arr;
    },
    
    two1dto2d: function (a, b) {
        var c = [];
        
        for (var i = 0; i < a.length; i++) {
            c.push([a[i], b[i]]);
        }
        
        return c;
    },

    
    drawgraphic: function(graphic, bottompoints, toppoints, fillclr){
        graphic.clear()
        graphic.beginFill(fillclr);
        graphic.lineStyle(1, 0x000000, 1);
                
        graphic.moveTo(bottompoints[0][0], bottompoints[0][1]);

        for (var t = 1; t < bottompoints.length; t++){
            graphic.lineTo(bottompoints[t][0],bottompoints[t][1]);
        }
        for (var r = toppoints.length-1; r >= 0; r--){
            graphic.lineTo(toppoints[r][0],toppoints[r][1]);
        }

        graphic.endFill();

        //g.world.bringToTop(this.bedrock);
    },




};