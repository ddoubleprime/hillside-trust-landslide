var background;
var bedrock;
var x_axis;
var soil_graphic,bedrock_graphic;
var bot_pts, top_pts;
var soilclr = 0x7C450D, rockclr = 0x003366;
var dx = 1, VE = 3;     // x-spacing in grid units, vertical exaggeration
var worldW = 603, worldH = 504;
var y_base, soil_surface, bedrock_surface;
var surf_amp=10,surf_wavelength=25,surf_shift=0;
var dx_canvas, dy_canvas, x_axis_canvas, soil_surface_canvas;
var soil_thickness;
var HrField = document.getElementById("Hreg");	// pull reg height from HTML slider
var Hr = Number(HrField.value);

var ti, tiEvent, timeRate = 10000;  // ms per real-world time unit
var timeKeeper, nowTime, worldTime = 0;
var timeDisplay;
        
var physBoxTest;
var box2d;

var shovelMode = false;
var dumpMode = false;
var shovelButton, dumpButton;
var changeFlag = false;
var adding_shovel, digging_shovel, landslide_shovel, active_shovel;

var esckey;
var slide_body;

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
        slide_body = g.add.graphics(0, 0);
        timeDisplay = g.add.text(5, 5, [], { fill: '#001122', font: '14pt Arial' });
        
                // Set up handlers for mouse events
        g.input.mouse.enabled = true
        g.input.onDown.add(this.mouseDragStart, this);
        g.input.addMoveCallback(this.mouseDragMove, this);
        g.input.onUp.add(this.mouseDragEnd, this);
        esckey = g.input.keyboard.addKey(Phaser.Keyboard.ESC);
        lkey = g.input.keyboard.addKey(Phaser.Keyboard.L)
        shovelButton = g.add.button(worldW-150, 20, 'shovel', this.toggleShovelMode, this);
        shovelButton.scale.setTo(0.025, 0.025);
        dumpButton = g.add.button(worldW-80, 20, 'dumptruck', this.toggleDumpMode, this);
        dumpButton.scale.setTo(0.25, 0.25);
        
        adding_shovel = new this.Shovel(2,-2); // (w,d)
        digging_shovel = new this.Shovel(2,2);
        landslide_shovel = new this.Shovel(5,15)
        
        x_axis = this.vector(0,100,dx); // grid units
        y_base = Array(x_axis.length); // grid units
        y_base.fill(0);

        console.log(worldW,worldH)
        
        //grid to canvas coordinates
        dx_canvas = worldW / (x_axis.length-1)/dx;   // pixels per grid unit
        dy_canvas = -dx_canvas * VE;                 // pixels per grid unit
        console.log(dx_canvas,dy_canvas);
        
        x_axis_canvas = this.arrayScale(x_axis,dx_canvas,0);
        
        // set the physics engine scale as the x-scale of this simulation
        // note y-scale may be different due to VE - may need to adjust physics parameters accordingly
        g.physics.box2d.setPTMRatio(dx_canvas);  
        
        // Default physics properties
        g.physics.box2d.gravity.y = 500;
        g.physics.box2d.density = 2; 
        g.physics.box2d.friction = 0.5; 
        g.physics.box2d.restitution = 0.1;
        // word bounds for physics
        //g.world.setBounds(-100, 0, worldW+100, worldH);
        g.physics.box2d.setBoundsToWorld();
        g.physics.box2d.collideWorldBounds = false;

        //g.debug.box2dWorld();
        
        console.log(g.physics.box2d);
        
        lkey.onDown.add(this.doLandslide, this)
        
        /* CREATE: SURFACE ARRAYS */
        
        // prepare the land surface array
        bedrock_surface = this.sinFunc(x_axis,surf_amp,surf_wavelength,surf_shift);
        this.rebaseFunc(bedrock_surface);
        // convert to canvas coordinates
        soil_surface = this.arrayScale(bedrock_surface,1,Hr);
        soil_surface_canvas = this.arrayScale(soil_surface,dy_canvas,worldH);
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

        // derive thickness array
        soil_thickness = this.arrayAdd(soil_surface,bedrock_surface,-1);
        
        
                
        /* CREATE: PHYSICS */
        
        house = g.add.sprite(worldW/4,100,'house');

        // assign physics bodies and properties        
        g.physics.box2d.enable(soil_graphic);
        g.physics.box2d.enable(bedrock_graphic);
        g.physics.box2d.enable(house);
                
        var bodypoly = this.boxPolygonArray( x_axis_canvas,soil_surface_canvas );
        
        soil_graphic.body.setChain(bodypoly);
        soil_graphic.body.static = true;
        
        bodypoly = this.boxPolygonArray( x_axis_canvas.concat([0]), bedrock_surface_canvas.concat([worldH]) );
        
        bedrock_graphic.body.setPolygon(bodypoly);
        bedrock_graphic.body.static = true;
        
        // house properties for reference; can use defaults for most objects
        house.body.setRectangle(40,55);
        house.body.collideWorldBounds = false;
        house.outOfBoundsKill = true;
        house.fixedRotation = false; 
        house.bullet = false; house.linearDamping = 0; house.body.angularDamping = 1; house.gravityScale = 1;
        // These will affect all fixtures on the body 
        house.sensor = true;
        house.body.friction = 0.9;
        house.body.restitution = 0;
        house.body.mass = 1; 
        
        /* CREATE: TIMING */
        ti.start();
            
    },


    /* UPDATER */
    
    update: function(){
        nowTime = ti.ms/timeRate;  // simulation world time
        timeDisplay.setText('Day: ' + Math.round(nowTime*10)/10);

        // get new thickness value
        if (Hr != Number(HrField.value)) {
            var HrNew = Number(HrField.value);
            soil_surface = this.arrayScale(soil_surface,1,HrNew-Hr);
            
            Hr = HrNew;
            // update soil thickness and redraw
            changeFlag = true;
    
        }
            
        
        /* Routine here for scooping / dumping 
            Uses something like a gaussian shape subtracted across the range of x-indices selected. These defined by a shovel_width parameter in world grid units.
        */
        if (shovelMode) {
            
            active_shovel = digging_shovel; 
            // glowing button
            shovelButton.tint = 0xFF9966;
            // change cursor
            g.canvas.style.cursor = "sw-resize";
            g.input.onDown.addOnce(this.digActiveShovel, this);
            
        } // shovelmode
        
        if (dumpMode) {
                
            active_shovel = adding_shovel;    
            
            // glowing button
            dumpButton.tint = 0xFF9966;
            // change cursor
            g.canvas.style.cursor = "cell";
            g.input.onDown.addOnce(this.digActiveShovel, this);
            
        } // shovelmode
        
        
         if (changeFlag == true) {
             
             this.updateLandscapeGraphics();
            
         }   // changeFlag

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
    
    arrayAdd: function(arr1,arr2,sign){        
        // adds arrays of the same length
        // elementwise, or subtracts array2 from array1
        // and returns result as a new array  
        if (arr1.length == arr2.length){
            
            var xa = Array(arr1.length);

            for (var i=0;i<arr1.length;i++) {
                xa[i] = arr2[i]*sign + arr1[i];
            }

        return xa; }
        else {console.log('arrayAdd: Arrays not of the same length')}
    },   

    arrayThresh: function (arr,thrsh){

        var xa = Array(arr.length);

        for (var i=0;i<arr.length;i++) {
            if (arr[i] < thrsh) {
                xa[i] = 0;
            } else {
                xa[i] = arr[i];
            }
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
        var base_val = Math.min.apply(Math,bedrock_surface);

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

    boxPolygonArray: function(xa,ya){
        // takes x,y matrices and interleaves them as x,y,x,y for use with box2D physics bodies
        // x and y must be the same length
        //console.log(xa,ya);
        var out = Array(xa.length * 2);
        
        for (var i=0; i<xa.length; i++) {
            out[2*i]=xa[i]; out[2*i+1]=ya[i];
        }
        return out;
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

    applyShovel: function(shvl,x,xa,ysurf) {
        
        // define the gaussian
        var sigma = shvl.width; // input as world grid units
        var mu = x / dx_canvas; // shvl.x is here in canvas units. check this if using world units.
            // operates over the +/- 3-sigma region of the grid
        var hole = Array(xa.length);
        var ynew = Array(xa.length);
        
        for (var i=0;i<xa.length;i++) {
            
            hole[i] = shvl.depth/(sigma * Math.sqrt(2*Math.PI)) *       Math.exp(-0.5*Math.pow((xa[i]-mu)/sigma,2) ) ;
                         
            if (xa[i] >= mu-3*sigma && xa[i] <= mu+3*sigma) {
                ynew[i] = (ysurf[i]-hole[i]);
            }
            else {ynew[i] = ysurf[i];}
        }
        
        return ynew;
        
    
    },
    
    doLandslide: function() {
        
        // use the landslide_shovel to get the "failure plane"
        
        var post_ls_surface = this.applyShovel(landslide_shovel,worldW*(3/4),x_axis,soil_surface);
        // update the soil surface using these points (as normal)
        // use old and new in the changed section as top and bottom for a new graphics body
        var slide_thickness = this.arrayAdd(soil_surface,post_ls_surface,-1);
        slide_thickness = this.arrayThresh(slide_thickness,0.2*Math.max.apply(Math,slide_thickness));
        
        
        // need the x-range of the body points (nonzero elements in thresholded thickness.)
        var slide_area_l = slide_thickness.findIndex(this.checkNonZero);
        var slide_thick_local = slide_thickness.filter(this.checkNonZero);
        var slide_area_r = slide_area_l+slide_thick_local.length;
        
        soil_surface = post_ls_surface;        
        changeFlag = true;
        
        this.updateLandscapeGraphics();
        this.slideBodyToBalls( slide_thick_local, post_ls_surface.slice(slide_area_l,slide_area_r),slide_area_l,slide_area_r );
        
        //this.drawSlideBody( slide_thick_local, post_ls_surface.slice(slide_area_l,slide_area_r),slide_area_l,slide_area_r );
        
    },
    
    drawSlideBody: function (arrH,arrB,lIdx,rIdx) {
        // draws a graphics object 
        // should probably add the new one to the stage here and then draw to it.
        // these will go in an array of multiple slide bodies if needed.
        var ls_surface = this.arrayAdd(arrH,arrB,1);
        var ls_surface_canvas = this.arrayScale(ls_surface,dy_canvas,worldH);
        var x_loc_canvas = this.arrayScale(x_axis.slice(lIdx,rIdx),dx_canvas,0);
        var y_base_loc_canvas = this.arrayScale(arrB,dy_canvas,worldH-2);
        
        // make canvas-unit coordinate pairs for drawing
        var bot_loc = this.two1dto2d(x_loc_canvas,y_base_loc_canvas);
        var top_loc = this.two1dto2d(x_loc_canvas,ls_surface_canvas);

        this.drawgraphic(slide_body,bot_loc,top_loc,soilclr);
                
        g.physics.box2d.enable(slide_body);

        bodypoly = this.boxPolygonArray( x_loc_canvas.concat(x_loc_canvas), ls_surface_canvas.concat(y_base_loc_canvas) );
        
        slide_body.body.setPolygon(bodypoly);
        slide_body.body.static = false;
        slide_body.body.collideWorldBounds = false;
        //slide_body.body.checkWorldBounds = true;
        slide_body.outOfBoundsKill = true;
        slide_body.bullet = false;
        
        slide_body.body.velocity.y = 0.05;
        
    },
    
    interp1: function(x_pts,y_pts,xi) {
        // interpolates position x=xi within the points defined by x_pts, y_pts
        // using a simple linear interpolation
        
        // find indices of nearest 2 x-points to xi
        var x1i = x_pts.findIndex( function(x) { return x >= xi })
        var x2i = x1+1; // need to code against on/out of bounds errors
                console.log(x1i,x2i)

        // then it's just (y2-y1)/(x2-x1) * (xi-x1) + x1
        
        
        return 8
        
    },
    
    slideBodyToBalls: function (arrH,arrB,lIdx,rIdx) {
        // takes the arrays that define a slide body and fills the space with rectangular physics bodies of a specifed size.
        var ls_surface = this.arrayAdd(arrH,arrB,1);
        var ls_surface_canvas = this.arrayScale(ls_surface,dy_canvas,worldH);
        var x_loc_canvas = this.arrayScale(x_axis.slice(lIdx,rIdx),dx_canvas,0);
        var y_base_loc_canvas = this.arrayScale(arrB,dy_canvas,worldH-2);
        
        // iterate along x axis at a spacing equal to (or very slightly greater than) the desired physics body size
        // at each x-position, iterate at increments of y-body-size from base to surface
        // if surface is lower than the next body increment, put a smaller body in that space
        // return the array that contains the bodies for use in adding sprites to them later
        var ball_container = [];
        var ballsize = 5;  // px
        for (var i = x_axis[lIdx]; i < x_axis[rIdx]; i+=(ballsize+0.01)/dx_canvas )
            {
                
                for (var j = this.interp1(x_axis.slice(lIdx,rIdx),arrB,i); j < this.interp1(x_axis,ls_surface,i); j+=(ballsize+0.01)/dy_canvas) {
                
                    var bx = i*dx_canvas, by = j*dx_canvas;                // dx used for both because these bodies are drawn in canvas pixel units and are not vertically exaggerated.
                    console.log(bx,by) 

                    var ball = new Phaser.Physics.Box2D.Body(this.game, null, bx, by);
                    ball.setCircle(ballsize,ballsize);
                    ball.bullet = true;
                    ball.collideWorldBounds=false;
                    ball.outOfBoundsKill = true;
                    ball.friction = 0.01;

                    ball_container.push(ball);
                
                }  // for j (y)
            } // for i (x)
    },
    
    checkNonZero: function (a) {
        return a != 0;
    },
        
    updateLandscapeGraphics: function() {
        // derive thickness array
        soil_thickness = this.arrayAdd(soil_surface,bedrock_surface,-1);
        
        soil_surface_canvas = this.arrayScale(soil_surface,dy_canvas,worldH);
        this.drawgraphic(soil_graphic,bot_pts,this.two1dto2d(x_axis_canvas,soil_surface_canvas),soilclr);

        g.world.bringToTop(bedrock_graphic);

        var bodypoly = this.boxPolygonArray( x_axis_canvas,soil_surface_canvas );

        soil_graphic.body.setChain(bodypoly);
        soil_graphic.body.static = true;

        changeFlag = false;
    },
    
    
/* CALLBACKS and INPUT EVENTS */    
    
    toggleShovelMode: function () {
        
        if (shovelMode == true) {
            shovelMode = false;
            shovelButton.tint = 0xFFFFFF;
            g.canvas.style.cursor = "default"
            // destroy shovel listeners
            esckey.onDown.remove(this.toggleShovelMode, this);
            g.input.onDown.remove(this.digActiveShovel, this);            
        } else {
            // one mode at a time. this approach will become unwieldy with more than a few buttons
            if (dumpMode) {
                this.toggleDumpMode();
            }            
            shovelMode = true;
            esckey.onDown.addOnce(this.toggleShovelMode, this);
        }
    },
    
    toggleDumpMode: function () {

        if (dumpMode == true) {
            dumpMode = false;
            dumpButton.tint = 0xFFFFFF;
            g.canvas.style.cursor = "default"
            // destroy shovel listeners
            esckey.onDown.remove(this.toggleDumpMode, this);
            g.input.onDown.remove(this.digActiveShovel, this);
        } else {            
            // one mode at a time. this approach will become unwieldy with more than a few buttons
            if (shovelMode) {
                this.toggleShovelMode();
            }
            dumpMode = true;
            esckey.onDown.addOnce(this.toggleDumpMode, this);
        }
    },
    
    digActiveShovel: function () {
        if (!shovelButton.input.pointerOver() && !dumpButton.input.pointerOver()) {

            soil_surface = this.applyShovel(active_shovel,g.input.x,x_axis,soil_surface);
            g.canvas.style.cursor = "default"
            changeFlag = true;
            
        }
    },

    mouseDragStart: function() {

        g.physics.box2d.mouseDragStart(g.input.mousePointer);

    },

    mouseDragMove: function () {

        g.physics.box2d.mouseDragMove(g.input.mousePointer);

    },

    mouseDragEnd: function () {

        g.physics.box2d.mouseDragEnd();

    },
    
/* CONSTRUCTORS */
    
    Shovel: function(win,din){
        this.width= win;
        this.depth= din;
    },
    

    render: function () {

       g.debug.box2dWorld();
        // Default color is white
        g.debug.body(soil_graphic);
        //g.debug.body(house,'rgb(0,0,0)');
        // Make falling block more red depending on vertical speed  
        var red = house.body.velocity.y * 0.5;
        red = Math.min(Math.max(red, 0), 255);
        var red = Math.floor(red);
        var blue = 255 - red;
        g.debug.body(house, 'rgb('+red+',0,'+blue+')');
  
    },
    

    
};