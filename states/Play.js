var background;
var bedrock;
var x_axis;
var soil_graphic,bedrock_graphic;
var bot_pts, top_pts;
var soilclr = 0x998355, rockclr = 0x333333;
var dx, VE;     // x-spacing in grid units, vertical exaggeration
var worldW = 603, worldH = 504;
var y_base, soil_surface, bedrock_surface;
//var surf_amp=15,surf_wavelength=25,surf_shift=127;
var dx_canvas, dy_canvas, x_axis_canvas, soil_surface_canvas, bedrock_surface_canvas, y_base_canvas;
var soil_thickness, soil_surface_old;
var Hr, soilThinFactor;

var rho_r = 1500;
var rho_w = 1000;
var grav = 9.81;

var dots;
var dotGroup;
var ptDensity = .9;   // points per sq phys unit
var showdotmode = true;
var house, tree;

var ksat = 0.1;        // infiltration rate / conductivity term, scales the rate of progress of the wetting front
var defaultCohesion, defaultSaturation, defaultPhi, slopeWindowFactor = 2;
var ti, tiEvent, timeRate = 10000;  // ms per real-world time unit
var timeKeeper, nowTime, worldTime = 0;
var timeDisplay, rainDisplay, rainTime, rainStartTime;
var slopetext, saturationtext, FStext;
var checkForLSInterval = 3000, queryInterval = 250;     // in ms
        
var physBoxTest;
var box2d;

var shovelMode = false;
var dumpMode = false;
var infoMode = false;
var infoPoint = 0;
var shovelButton, dumpButton, rainButton, houseButton, treeButton, infoButton, menuButton, resetButton;
var rainFlag = false;
var changeFlag = false;
var activeLS = false, newLS = false, slideStopFlag = false;
var slideStopTime = 0;
var active_ls_balls;
var adding_shovel, digging_shovel, landslide_shovel, active_shovel;

var esckey;
var slide_body;
var lkey, hkey, rkey, qkey, onekey, twokey;



var playState = function (game) {
    
};


playState.prototype = {

    create: function () {
        
        var sceneParams = g.cache.getJSON('sceneParams');
        this.populateVariables(sceneParams);
                
        ti = g.time.create();
        tiEvent = g.time.create();
        background = g.add.image(0, 0, 'sky_dust');
        rain_emitter = g.add.emitter(g.world.centerX, 0, 400);
        this.rainemitter(rain_emitter);
        soil_graphic = g.add.graphics(0, 0);
        bedrock_graphic = g.add.graphics(0, 0);
        slide_body = g.add.graphics(0, 0);
        timeDisplay = g.add.text(worldW/2, 5, [], { fill: '#001122', font: '14pt Arial' });
        timeDisplay.visible = false;
        slopetext = g.add.text(worldW/5-30, 13, "Slope gradient:",  { font: '14pt Arial', fill: '#001155' });
        saturationtext = g.add.text(worldW/5-30, 33, "Saturation:",  { font: '14pt Arial', fill: '#001155' });
        FStext = g.add.text(worldW/5-30, 53, "Factor of Safety:",  { font: '14pt Arial', fill: '#001155' });
        this.infoToggle(infoMode);
        
        
        // Set up handlers for mouse events
        g.input.mouse.enabled = true;
        g.input.onDown.add(this.mouseDragStart, this);
        g.input.addMoveCallback(this.mouseDragMove, this);
        g.input.onUp.add(this.mouseDragEnd, this);
        esckey = g.input.keyboard.addKey(Phaser.Keyboard.ESC);
        lkey = g.input.keyboard.addKey(Phaser.Keyboard.L);
        hkey = g.input.keyboard.addKey(Phaser.Keyboard.H);
        rkey = g.input.keyboard.addKey(Phaser.Keyboard.R);
        qkey = g.input.keyboard.addKey(Phaser.Keyboard.Q);
        onekey = g.input.keyboard.addKey(Phaser.Keyboard.ONE);
        twokey = g.input.keyboard.addKey(Phaser.Keyboard.TWO);

        this.makeToolButtons(sceneParams.scenario.tools)
                
        dots = new Array(0);
        dotGroup = g.add.group();
        active_ls_balls = new Array(0);

        adding_shovel = new this.Shovel(3,-2); // (w,d)
        digging_shovel = new this.Shovel(2,2);
        landslide_shovel = new this.Shovel(5,15);
        
        x_axis = this.vector(0,100,dx); // grid units
        y_base = new Array(x_axis.length); // grid units
        y_base.fill(0);

        console.log(worldW,worldH);
        
        //grid to canvas coordinates
        dx_canvas = worldW / (x_axis.length-1)/dx;   // pixels per grid unit
        dy_canvas = -dx_canvas * VE;                 // pixels per grid unit
        console.log(dx_canvas,dy_canvas);
        
        x_axis_canvas = this.arrayScale(x_axis,dx_canvas,0);
        
        /* CREATE: PHYSICS */
        
        // set the physics engine scale as the x-scale of this simulation
        // note y-scale may be different due to VE - may need to adjust physics parameters accordingly
        g.physics.box2d.setPTMRatio(dx_canvas);
        
        // Default physics properties
        g.physics.box2d.gravity.y = -dy_canvas*9.81;
        g.physics.box2d.density = 2000;
        g.physics.box2d.friction = 0.5;
        g.physics.box2d.restitution = 0.2;
        // word bounds for physics
        //g.world.setBounds(-100, 0, worldW+100, worldH);
        g.physics.box2d.setBoundsToWorld();
        g.physics.box2d.collideWorldBounds = false;
        
        console.log(g.physics.box2d);
        
        lkey.onDown.add(this.doLandslide, this);
        hkey.onDown.add(function() {this.newHouse(worldW/2,10)}, this);
        rkey.onDown.add(this.toggleRain, this);
        twokey.onDown.addOnce(function() {g.state.start('play2')} );

        /* CREATE: SURFACE ARRAYS */
        
        // prepare the bedrock surface array
        // generator options are "sin" and "linear", defaults to "linear"
        if (sceneParams.scenario.landscape.generator == "sin") {
            bedrock_surface = this.sinFunc(x_axis,sceneParams.scenario.generators.sin.amplitude,sceneParams.scenario.generators.sin.wavelength,sceneParams.scenario.generators.sin.shift);
        } else {
            bedrock_surface = this.arrayScale(x_axis,sceneParams.scenario.generators.linear.slope,0);
        }
        // rebase so lowest point is at the bottom of the canvas
        this.rebaseFunc(bedrock_surface);
        // convert to canvas coordinates
        bedrock_surface_canvas = this.arrayScale(bedrock_surface,dy_canvas,worldH);
        
        // prepare the soil surface array
        // soilThinFactor scales the thickness so that soil can be e.g. thinner at the tops of hills
        soil_surface = this.arrayScale(bedrock_surface,soilThinFactor,Hr);

        
        /* Apply scenario-specific modifiers */
        for (var i = 0; i < sceneParams.scenario.landscape.modifiers.length; i++) {
            
            var currentModifier = sceneParams.scenario.landscape.modifiers[i];
            var modParams;
            modParams = sceneParams.scenario.modifiers[currentModifier];
            // right now these are input as array index coordinates, which should be changed to physical space coordinates in the future.
            // here we can unpack the input params, convert to indices, and pass them to the code below, which split out as a function will also serves as core of the grading tool.
            
            // sets the level of a range of cells to that of the "level_reference" cell, plus/minus an offset if desired
            for (var im=modParams.start_pos;im<modParams.end_pos;im++) {
                soil_surface[im] = soil_surface[modParams.level_reference]+modParams.level_offset;
            }
            
        }
        


        // Distribute houses, trees, etc.
        house = this.newHouse(0.12*worldW, 130);

       
        
        /*  End scenario modifications */
        
        soil_surface_old = this.arrayScale(soil_surface,1,0);  // makes a copy of soil_surface

        // assign physics bodies and properties        
        g.physics.box2d.enable(soil_graphic); // not necessary - make surface a free body?

        y_base_canvas = this.arrayScale(y_base,dy_canvas,worldH);
        
        // make canvas-unit coordinate pairs for drawing
        bot_pts = this.two1dto2d(x_axis_canvas,y_base_canvas);
        

        this.updateLandscapeGraphics();
        
        this.pointsInArea(ptDensity,x_axis,soil_surface,bedrock_surface);        
        
        // make canvas-unit coordinate pairs for drawing and draw bedrock graphic
        top_pts = this.two1dto2d(x_axis_canvas,bedrock_surface_canvas);
        this.drawgraphic(bedrock_graphic,bot_pts,top_pts,rockclr);
        
                            
        /* CREATE: TIMING */
        g.time.events.loop(queryInterval, function () {this.updateAnalysisPoints(dots)}, this);
        g.time.events.loop(checkForLSInterval, this.landslideListener, this);
        ti.start();
    },


    /* UPDATER */
    
    update: function() {
        nowTime = ti.ms/timeRate;  // simulation world time
        timeDisplay.setText('Day: ' + Math.round(nowTime*10)/10);

        if (rainFlag) {            
            rainTime = nowTime - rainStartTime;
        }
       
        /* Routine here for scooping / dumping 
            Uses something like a gaussian shape subtracted across the range of x-indices selected. These defined by a shovel_width parameter in world grid units.
        */
        if (shovelMode) {
            
            active_shovel = digging_shovel; 
            // glowing button
            shovelButton.alpha = 1;
            shovelButton.setFrames(1, 3, 2, 2);
            // change cursor
            g.canvas.style.cursor = "sw-resize";
            g.input.onDown.addOnce(this.digActiveShovel, this);
            
        } // shovelmode
        
        if (dumpMode) {
                
            active_shovel = adding_shovel;    
            
            // glowing button
            dumpButton.alpha = 1;
            dumpButton.setFrames(1, 2, 2, 2);
            // change cursor
            g.canvas.style.cursor = "cell";
            g.input.onDown.addOnce(this.digActiveShovel, this);
            
        } // shovelmode
 
        if (infoMode) {

            if (!shovelMode && !dumpMode && !this.overButton()) {
                
                g.canvas.style.cursor = "help";
                
                if (g.input.mousePointer.isDown) {
                    var pickX = g.input.mousePointer.x;
                    var pickY = g.input.mousePointer.y;
                    infoPoint = this.findNearestPoint(pickX, pickY);
                }
            }
                this.infoShower(infoPoint);
        }                
                
        if (activeLS) {
            var n_stopped = this.checkBalls( active_ls_balls,x_axis_canvas, this.arrayMin(soil_surface_canvas,bedrock_surface_canvas) );
            
            if (n_stopped == active_ls_balls.length) {
                if (slideStopFlag == false) {
                    console.log('setting stopflag')
                    slideStopFlag = true;
                    slideStopTime = ti.ms+0;
                }
                
                if (slideStopFlag == true && ti.ms-slideStopTime > 1500) {
                    activeLS = false;
                    slideStopFlag = false;
                    console.log('recovering surface!')
                    soil_surface = this.restoreSurface(x_axis,soil_surface,active_ls_balls);
                    this.doSurfaceChangedUpdates();

                    changeFlag = true;
                }
                
            } else if (n_stopped != active_ls_balls.length && slideStopFlag == true) { 
                slideStopFlag = false; 
                console.log('resetting stopFlag')
            } 
            
            if (this.isEmpty(active_ls_balls)) {activeLS = false; slideStopFlag = false;}
        }
        
        if (changeFlag == true) {
             
                this.doSurfaceChangedUpdates();
            
         }   // changeFlag

    },

    
/* ARRAY FUNCTIONS */
    
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
        var za = Array(length);        
        za.fill(0);
        
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
        // elementwise, or subtracts array2 from array1 if sign is negative
        // and returns result as a new array  
        if (arr1.length == arr2.length){
            
            var xa = Array(arr1.length);

            for (var i=0;i<arr1.length;i++) {
                xa[i] = arr2[i]*Math.sign(sign) + arr1[i];
            }

        return xa; }
        else {console.log('arrayAdd: Arrays not of the same length')}
    },   
    
    arrayAreaBetween: function(arr1,arr2,dx) {
        // sums the area between two arrays. assumes units, dx, and length are the same for both.
        if (arr1.length == arr2.length){
            var adiff = this.arrayAdd(arr1,arr2,-1);
            var area = adiff.reduce( function(total,num){return (total+num*dx)} )
            return Math.round( Math.abs(area) );}
        else {console.log('arrayAreaBetween: Arrays not of the same length')}
        
    },

    arrayThresh: function (arr,thrsh) {

        var xa = Array(arr.length);
        var xi = [];

        for (var i=0;i<arr.length;i++) {
            if (arr[i] < thrsh) {
                xa[i] = 0;
            } else {
                xa[i] = arr[i];
                xi.push(i);
            }
        }

        return [xa,xi];

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
    
    interp1: function(x_pts,y_pts,xi) {
        // interpolates position x=xi within the points defined by x_pts, y_pts
        // using a simple linear interpolation

        // find indices of nearest 2 x-points to xi
        var idxpts = this.getAdjacentXPoints(x_pts,xi);
        var x2i = idxpts[1];
        var x1i = idxpts[0]; 

        // then it's just (y2-y1)/(x2-x1) * (xi-x1) + y1
        var interppt = (y_pts[x2i]-y_pts[x1i])/(x_pts[x2i]-x_pts[x1i]) * (xi-x_pts[x1i]) + y_pts[x1i];
        //console.log(x1i,x2i,interppt)
        return interppt;
},
    
    arrayRunningMean: function(xa,ya,n) {
        // calculates the n-point running mean of ya. end points are calculated based on a linear extrapolation of interior points. n needs to be odd.
        if (xa.length == ya.length && n % 2 != 0) {
            
            var tail = (n-1)/2
            var rm = Array(ya.length);
            for (var i=tail; i<ya.length-tail; i++) {
                var rmRunning = 0;
                for (j=-tail; j<tail; j++) {
                    rmRunning += ya[i+j];
                }
                rm[i] = rmRunning / n;
            }
            
            var interior = rm.slice(tail,ya.length-tail);

            for (var ii=0;ii<tail;ii++) {                
                rm[ii] = this.interp1(xa.slice(tail,ya.length-tail),interior,xa[ii]);
                rm[ya.length-1-ii] = this.interp1(xa.slice(tail,ya.length-tail),interior,xa[ya.length-1-ii]);
                
            }

            return rm;
        }
        else {console.log('arrayRunningMean: Arrays not of the same length or n is not odd')}
        
    },
    
    arrayMin: function(arr1,arr2){
        
        // from arrays of the same length, takes
        // elementwise the lowest value from either array
        // and returns result as a new array  
        if (arr1.length == arr2.length){
            
            var xa = Array(arr1.length);

            for (var i=0;i<arr1.length;i++) {
                xa[i] = Math.min(arr1[i],arr2[i]);
            }

        return xa; }
        else {console.log('arrayMin: Arrays not of the same length')}
        
    },
    
    arrayMax: function(arr1,arr2){
        
        // from arrays of the same length, takes
        // elementwise the lowest value from either array
        // and returns result as a new array  
        if (arr1.length == arr2.length){
            
            var xa = Array(arr1.length);

            for (var i=0;i<arr1.length;i++) {
                xa[i] = Math.max(arr1[i],arr2[i]);
            }

        return xa; }
        else {console.log('arrayMax: Arrays not of the same length')}
        
    },
    
    isEmpty: function(arr){
        if (!Array.isArray(arr) || !arr.length) {
            // array does not exist, is not an array, or is empty
            return true;
        } else { return false }
        
    },
    
    getAdjacentXPoints: function(x_pts,xi) {
        // input an x position, returns a 2-element array with the two adjacent indices of the input x-array. assumes input x-array is monotonic increasing to the right
        // returns two nearest, so if beyond either end of the array returns the two endmost elements
        var idxout = Array(2);

        // check that xi is within array bounds  
        var xlen = x_pts.length;
        if (xi >= x_pts[xlen-1]) { 
                idxout = [xlen-2,xlen-1];
            } else if (xi <= x_pts[0]) {
                idxout = [0,1];  
            } else {

            // find indices of nearest 2 x-points to xi
            idxout[1] = x_pts.findIndex( function(x) { return x >= xi } );
            idxout[0] = idxout[1]-1; 

        } // if xi
        
        return idxout;
    },
    
    getRegionalSlope: function(x_arr,y_arr,xpt,wdw) {
        // input an x,y array pair defining evenly-spaced points, a location along x at which to compute the slope, and the parameter windowsize defining the averaging window (x units)
        // returns the local slope averaged over the range xpt±(1/2)*windowsize
        // points outside of edges will be extrapolated linearly from the two endmost points of y
        var x2 = xpt+0.5*wdw;
        var x1 = xpt-0.5*wdw;
        
        var y2 = this.interp1(x_arr,y_arr,x2);
        var y1 = this.interp1(x_arr,y_arr,x1);
        
        var slp = (y2-y1)/(x2-x1);
        return slp;
        
    },
    
    
/* SUPPORT FUNCTIONS */
    
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
    
    doSurfaceChangedUpdates: function () {
        this.updateLandscapeGraphics();
        this.pointsInArea(ptDensity,x_axis,soil_surface,soil_surface_old);
        soil_surface_old = this.arrayScale(soil_surface,1,0);  // resets this to the new soil_surface
        this.checkBalls( active_ls_balls,x_axis_canvas,            this.arrayMin(soil_surface_canvas,bedrock_surface_canvas) );
        dots = this.updateAnalysisPoints(dots);
        changeFlag = false;
    },
 
    doLandslide: function () {
        
        var slide_thickness = this.failurePlane(x_axis,dots,6*dx);

        var trash;
        [slide_thickness, trash] = this.arrayThresh(slide_thickness,0.1*Math.max.apply(Math,slide_thickness));
        
        slide_surface = this.arrayScale(soil_surface,1,0);
        slide_thickness = this.arrayRunningMean(x_axis,slide_thickness,5);
        
        var post_ls_surface = this.arrayAdd(soil_surface,slide_thickness,-1);
        // base of slide body needs to be above bedrock!
        post_ls_surface = this.arrayMax(post_ls_surface,bedrock_surface);
        // correct thickness based on corrected surface
        slide_thickness = this.arrayAdd(soil_surface,post_ls_surface,-1)
        

        
        // need the x-range of the body points (nonzero elements in thresholded thickness.)
        var slide_area_l = 0;
        //var slide_thick_local = slide_thickness.filter(this.checkNonZero);
        var slide_area_r = x_axis.length-1;
            
        var slide_base_padded = this.arrayScale(post_ls_surface,1,0.001);
        
        // before passing the base array to slidebodytoballs, need to isolate the part of the body that is above the bedrock surface
        var ballsize = 6;  // px
        var newballs = this.slideBodyToBalls( slide_thickness,slide_base_padded,slide_area_l,slide_area_r, ballsize );
        
        // add new balls to balls array
        active_ls_balls = active_ls_balls.concat(newballs);
        
        // update the soil surface using these points (as normal)
        soil_surface = post_ls_surface;        

        this.doSurfaceChangedUpdates();

        
        activeLS = true;
        
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
    
    slideBodyToBalls: function (arrH,arrB,lIdx,rIdx,ballsize) {
        // takes the arrays that define a slide body and fills the space with rectangular physics bodies of a specifed size.
        var ls_surface = this.arrayAdd(arrH,arrB,1);
        var ls_surface_canvas = this.arrayScale(ls_surface,dy_canvas,worldH);
        var x_loc = x_axis.slice(lIdx,rIdx);
        var x_loc_canvas = this.arrayScale(x_loc,dx_canvas,0);
        var y_base_loc_canvas = this.arrayScale(arrB,dy_canvas,worldH);

        // iterate along x axis at a spacing equal to (or very slightly greater than) the desired physics body size
        // at each x-position, iterate at increments of y-body-size from base to surface
        // return the array that contains the bodies 
        var ball_container = [];
        var i_dx = (1.41*ballsize+0.01)/dx_canvas;        
        for (var i = x_axis[lIdx]; i <= x_axis[rIdx]-i_dx; i+=i_dx )
            {

                var ymin = this.interp1(x_loc,arrB,i);
                var ymax = this.interp1(x_loc,ls_surface,i);
                var jdy = (1*ballsize+0.01)/dy_canvas;
                for (var j = ymin-jdy; j <= ymax; j-=jdy) {
                    var bx = i*dx_canvas, by = worldH + j*dy_canvas;
                    var clodFrame = Math.ceil(Math.random()*4);
                    var ball = g.add.sprite(bx,by,'clods');
                    ball.frame = clodFrame;
                    //var ball = g.add.sprite(bx,by,)
                    ball.width = 2.5*ballsize; ball.height = 2.5*ballsize;
                    ball.tint = soilclr;
                    ball.anchor.x = 0.5; ball.anchor.y = 0.5;

                    // assign physics bodies and properties        
                    g.physics.box2d.enable(ball);
                    ball.body.setRectangle(ballsize,ballsize);
                    ball.body.bullet = true;
                    ball.body.collideWorldBounds=false;
                    ball.body.outOfBoundsKill = true;
                    ball.body.friction = 0.7;
                    ball.body.angularDamping = 0.5;
                    ball.body.angle = Math.random()*360;
                    ball.body.restitution = 0.1

                    ball_container.push(ball);
                
                }  // for j (y)
            } // for i (x)
        
        return ball_container;
    },
    
    checkBalls: function (ball_array,x_array,surf_array){
        // iterate through ball array and kill any that are below surf_array
        // canvas units for all input arrays. Also count how many are stationary.
        var n_stopped = 0;
        
        for (b=0;b<ball_array.length;b++) {
            
            var bb = ball_array[b];
            
            // count stationary
            if (bb.body.velocity.x < 0.1 && bb.body.velocity.y < 0.1) {n_stopped++};
            
            if ( bb.x >= worldW || bb.y+2 > this.interp1(x_array,surf_array,bb.x) ) {
                bb.destroy();
                ball_array.splice(b,1);
            }
            
        } // for b
        
        return n_stopped;

    },
    
    checkNonZero: function (a) {
        return a != 0;
    },
    
    scaleToPhysWidth: function (obj,w) {
        // scales any object with .height and .width properties proportionally to desired real-world width w
        var hwr = obj.height / obj.width;
        obj.width = w*dx_canvas;
        obj.height = obj.width * hwr;
        
        return obj
    },

    deg2Rad: function (val) {
        return val * Math.PI / 180;
    },

    rad2Deg: function (val) {
        return val * 180 / Math.PI;;
    },
    
    rgb2Hex: function (rgb) { 
        var hex = Number(rgb).toString(16);
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    },
    
    fullColorHex: function(r,g,b) {   
      var red = this.rgb2Hex(r);
      var green = this.rgb2Hex(g);
      var blue = this.rgb2Hex(b);
      return '0x'+red+green+blue;
    },
    
    updateLandscapeGraphics: function() {
        // derive thickness array
        soil_thickness = this.arrayAdd(soil_surface,bedrock_surface,-1);
        
        soil_surface_canvas = this.arrayScale(soil_surface,dy_canvas,worldH);
        this.drawgraphic(soil_graphic,bot_pts,this.two1dto2d(x_axis_canvas,soil_surface_canvas),soilclr);
        
        
        //g.world.bringToTop(soil_graphic);
        //g.world.bringToTop(active_ls_balls);
        g.world.bringToTop(dotGroup);
        g.world.bringToTop(bedrock_graphic);

        var bodypoly = this.boxPolygonArray( x_axis_canvas, this.arrayMin(soil_surface_canvas,bedrock_surface_canvas) );

        soil_graphic.body.setChain(bodypoly);
        soil_graphic.body.static = true;

    },
    
    restoreSurface: function(x_axis,surf,balls) {
        
        // find thickness of ball deposits
        var deposit_thickness = this.depositThickness(x_axis,surf,balls,5); 
        deposit_thickness = this.arrayRunningMean(x_axis,deposit_thickness,3)
        var new_surface = this.arrayAdd(surf,deposit_thickness,1);
        return new_surface;
        
    },
    
    depositThickness: function(xarr,yarr,points,wdw) {
        
        var hx = this.zeros(xarr.length);

        var dpMax, npt, xi;

        for (var i=0; i<xarr.length; i++) {
            // find the upper surface of landslide balls that lie within the range defined by xi and wdw. note that ball positions are defined by canvas coordinates because they have physics bodies.

            xi = xarr[i]; 
            dpMax = yarr[i]*dy_canvas+worldH; // convert to canvas units
            npt = 0;
            for (var j=0; j<points.length; j++) {

                if (points[j].x/dx_canvas >= xi-0.5*wdw && points[j].x/dx_canvas <= xi+0.5*wdw) {
                    npt++;
                    if (points[j].body.y < dpMax) {
                        dpMax = points[j].body.y;  // here in canvas units
                    }
                }

            } // for j

            if (npt > 0) {
                hx[i] = -(worldH-dpMax)/dy_canvas-yarr[i]-.4;   // convert to physical units for return
            }
        }     // for i
    
        return hx;
        
    },
    
    rainemitter: function (emitter) {
        emitter.width = g.world.width;

        emitter.makeParticles('rain');

        emitter.minParticleScale = 0.1;
        emitter.maxParticleScale = 0.5;

        emitter.setYSpeed(300, 500);
        emitter.setXSpeed(-5, 5);

        emitter.minRotation = 0;
        emitter.maxRotation = 0;
        emitter.start(false, 1600, 5, 0);
        emitter.on = false;
    },
    
/* CALLBACKS and INPUT EVENTS */    
    
    toggleShovelMode: function () {
        
        if (shovelMode == true) {
            shovelMode = false;
            shovelButton.alpha = 0.8
            shovelButton.setFrames(1, 3, 2, 3);
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
            dumpButton.alpha = 0.8;
            dumpButton.setFrames(1, 3, 2, 3);
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
    
    toggleRain: function () {
        
        if (rainFlag == false) {        
            //rainDisplay.setText("It's Raining!");
            //rainDisplay.fill = '#0000FF';
            
            rain_emitter.on = true;
            background.tint = 0x999999;
            rainStartTime = nowTime;            
            rainFlag = true;  
            
        } else { 
            //rainDisplay.setText("It's Sunny!") 
            //rainDisplay.fill = '#FFDD22';
            
            rain_emitter.on = false;
            background.tint = 0xFFFFFF;

            rainTime = 0;            
            rainFlag = false;            
        }
        
        
    },
    
    landslideListener: function() {
        
        var failing = dots.filter( function(d) {return d.FS < 1} );
        if (failing.length > 0.01 * dots.length && activeLS == false) { this.doLandslide() };
        //console.log(failing.length)
        
    },
    
    digActiveShovel: function () {
        if (!this.overButton()) {

            soil_surface_old = this.arrayScale(soil_surface,1,0);  // makes a copy of soil_surface
            soil_surface = this.applyShovel(active_shovel,g.input.x,x_axis,soil_surface);
            soil_surface = this.arrayMax(soil_surface,bedrock_surface);
            
            g.canvas.style.cursor = "default"
            changeFlag = true;
            
        }
    },

    houseButtonClick: function() {
        shovelMode = true; 
        dumpMode = true; 
        this.toggleShovelMode(); 
        this.toggleDumpMode(); 
        this.newHouse(worldW/2,10)
    },
    
    treesOn: function() {
        
        // place trees 
        // trees have physics bodies along trunks   
        // bodies are anchored at bottom to soil surface but detach during LS
        
    },
    
    inspectPoints: function() {
        // shows info about nearest analysis point
        if (infoMode) {
            this.infoToggle(false)
        } else {
            this.infoToggle(true)
        }

    },
    
    overButton: function() {
         var ob = (shovelButton.input.pointerOver() || dumpButton.input.pointerOver() || rainButton.input.pointerOver() );
         return ob;
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
    
    newHouse: function(x,y){
        
        var house = g.add.sprite(x,y,'house')
        
        house = this.scaleToPhysWidth(house,15); // (object, desired width in physical units)
        
        g.physics.box2d.enable(house);
        // house properties for reference; can use defaults for most objects
        house.body.setRectangle(house.width*0.9,house.height*0.78);
        house.body.collideWorldBounds = false;
        house.outOfBoundsKill = true;
        house.fixedRotation = false; 
        house.bullet = false; house.linearDamping = 0; house.body.angularDamping = 1; house.gravityScale = 0;
        // These will affect all fixtures on the body 
        house.sensor = false;
        house.body.friction = 0.9;
        house.body.restitution = 0;
        house.body.mass = 10000; 
        house.body.density = 100;
        
        return house;

    },
    
    
/* ANALYSIS POINTS */
    
    pointsInArea: function (ptDensity,x_axis,arrT,arrB) {

        // filter x_array by thickness threshold, then pick one random index*dx + a random*0.5dx jitter. 2 calls to Math.random() per point.
        // thickness is the difference between arrT and arrB
        var thick = this.arrayAdd(arrT,arrB,-1);
        var posThick, xi;
        // use the thresholder to return the indices of cells that meet the criterion
        [posThick,xi] = this.arrayThresh(thick,0.01);
            
        if (this.isEmpty(xi)) {return null} else {
            // get the area between. use the thresholded thickness and a zero-array, because the arrT and arrB might cross, and the area result would be biased by the negative differences
            var area = this.arrayAreaBetween(posThick,this.zeros(x_axis.length),dx);

            var numPts = Math.round(ptDensity * area);
        
            for (var i = 0; i < numPts; i++) {
                var jitter = Math.random()*dx;
                // get the x value corresponding to a random element of the xi indices array
                var xval = x_axis[ xi[Math.floor( Math.random()*(xi.length) )] ];
                var xp = xval + jitter;  
          
                // interpolate y-bounds from soil and bedrock surface arrays
                // inputs/returns physical grid units
                var topY = this.interp1(x_axis,arrT,xp);    
                var botY = this.interp1(x_axis,arrB,xp);                
                this.randomZPoint(xp,topY,botY);
                
                this.addDotToGroup(dots[i]);

            } // for
        } // if
    },
    
    randomZPoint: function (xpoint,topY,botY) {
      // create and initalize a new analysis point at a random location z between topY and botY and add it to the global(!) dots array
        
      if (topY - botY <= 0) {return null}
        else {
          var dot = [];
          var zp = Math.random()*(topY-botY)+botY;
          var depth = (topY-zp);
          var windowsz = Math.pow(depth,slopeWindowFactor);
          var slope =  this.getRegionalSlope(x_axis, soil_surface, xpoint, windowsz);

          dot.x = xpoint;
          dot.y = zp;
          dot.depth=depth;
          dot.phi = this.deg2Rad(defaultPhi);
          dot.cohesion=defaultCohesion;
          dot.saturation = defaultSaturation;
          dot.theta = Math.atan(Math.abs(slope)); // theta in RADIANS

          this.FScalc(dot);
            
          dot.color = this.colorAnalysisPoint(dot.FS);
          dot.scale = this.scaleAnalysisPoint(dot.saturation);  
          dot.alive = true;
            
          dots.push(dot); // push to global dots array
          return zp;
            
        } // if
    },
    
    updateAnalysisPoints: function (points) {
        for (var i=0; i<points.length; i++)  {
            
            if (points[i].y >= this.interp1(x_axis,soil_surface,points[i].x)) {

                points[i].alive = false; // kill
                
            } else if (points[i].y <= this.interp1(x_axis,bedrock_surface,points[i].x)) {
                
                points[i].alive = false; // kill
                //console.log('underbottomkill')
                                                   
            } else { 
              // dot.x    (static)
              // dot.y    (static)
                
              var topY = this.interp1(x_axis,soil_surface,points[i].x);    
              points[i].depth = topY - points[i].y;
              points[i].phi = this.deg2Rad(defaultPhi);
              points[i].cohesion=defaultCohesion; // calculated based on proximity to e.g. trees
                
              var windowsz = Math.pow(points[i].depth,slopeWindowFactor);
              var slope = this.getRegionalSlope(x_axis, soil_surface, points[i].x, windowsz);

              points[i].theta = Math.atan(Math.abs(slope)); // theta in RADIANS
                
              this.saturationCalc(points[i]);   // updates the saturation and satDepth fields of the point object.
                
              this.FScalc(points[i]);   // updates the FS field
                
              points[i].color = this.colorAnalysisPoint(points[i].FS);
              points[i].scale = this.scaleAnalysisPoint(points[i].saturation);
                // these last 2 will be derived from FS and saturation, respectively        
            } // else            
            

          } // for i = points
        if (infoMode) {
          if (points[infoPoint]) {
              points[infoPoint].scale = 6;
              points[infoPoint].color = 0xFFFF00;         
          }
        }
            
          points = points.filter(function(pt) {return pt.alive});
        
        
          this.updateDotGfx(points,dotGroup);
          g.world.bringToTop(dotGroup);
        
        return points;

    },
    
    updateDotGfx: function (points,dotgp) {
        
        dotgp.removeAll(true,true,false)

        for (var i=0; i<points.length; i++)  {

            this.addDotToGroup(points[i]);
        }
    },
    
    addDotToGroup: function(point) {
        
        var dot = g.add.graphics(0, 0);
            // graphics.lineStyle(2, 0xffd900, 1);

        dot.beginFill(point.color, 1);
        dot.drawCircle(point.x*dx_canvas, worldH+point.y * dy_canvas, point.scale);
        // scale color to FS and size to saturation
        dotGroup.add(dot);
    },
    
    FScalc: function (point) {
        point.FS = ( (point.cohesion + (rho_r-point.saturation*rho_w)*grav*Math.cos(point.theta)*Math.tan(point.phi)*point.depth) / (rho_r*grav*point.depth*Math.sin(point.theta)) );
    },
        
    failurePlane: function (xarr,points,wdw) {
        /* This function, given the subset of ground test points that are failing, determines 
        whether enough nearby points are failing to interpolate a landslide surface across them. It returns an array of size(x_axis) with the depth of the failure plane in the appropriate elements, or zero where there is no failure.

        inputs: points: array of analysis point objects; x_axis: x-coordinates of ground surface points wdw: window around each column to count points
        returns: hx: array of size(x_axis) with depth of failure surface at each surface x-coordinate */        
        // create the array that stores fail depths along the x axis
        
        var hx = this.zeros(xarr.length);

        var dpMax, npt, xi;

        for (var i=0; i<xarr.length; i++) {
            // find the failing soil points that lie within the range defined by xi and wdw

            xi = xarr[i]; 
            dpMax = 0;
            npt = 0;
            for (var j=0; j<points.length; j++) {

                if (points[j].x >= xi-0.5*wdw && points[j].x <= xi+0.5*wdw && points[j].FS < 1) {
                    npt++;
                    if (points[j].depth > dpMax) {
                        dpMax = points[j].depth;
                    }
                }

            } // for j

            if (npt > 1) {
                hx[i] = dpMax;
            }
        }     // for i
        return hx;
    
    },
    
    failurePlaneMean: function (xarr,points,wdw) {
        /* This function, given the subset of ground test points that are failing, determines 
        whether enough nearby points are failing to interpolate a landslide surface across them. It returns an array of size(x_axis) with the depth of the failure plane in the appropriate elements, or zero where there is no failure.

        inputs: points: array of analysis point objects; x_axis: x-coordinates of ground surface points wdw: window around each column to count points
        returns: hx: array of size(x_axis) with depth of failure surface at each surface x-coordinate */        
        // create the array that stores fail depths along the x axis
        
        var hx = this.zeros(xarr.length);

        var dpRunning, npt, xi;

        for (var i=0; i<xarr.length; i++) {
            // find the failing soil points that lie within the range defined by xi and wdw

            xi = xarr[i]; 
            dpRunning = 0;
            npt = 0;
            for (var j=0; j<points.length; j++) {

                if (points[j].x >= xi-0.5*wdw && points[j].x <= xi+0.5*wdw && points[j].FS < 1) {
                    npt++;
                    dpRunning += points[j].depth;
                }

            } // for j

            if (npt > 0.2*ptDensity * soil_thickness[i]*wdw) {
                hx[i] = dpRunning / npt;
            }
        }     // for i
        return hx;
    
},
    
    saturateSoil: function(points,rainTime) {

        points.forEach( this.saturationCalc );
        
    },
    
    saturationCalc: function(point) {
        // function updates both the saturation and satDepth fields of the point object.
        if (rainFlag) {
            // calculate the depth of the wetting front, which increases proportionally to the sqrt(time) during rain. this is set up to be spatially variable but for now it isn't
            point.satDepth += ksat * Math.sqrt(rainTime);
            if (point.satDepth >= point.depth) {
                point.saturation += 1 * (queryInterval/timeRate); 
            }
        } else {point.satDepth=0} 

        point.saturation -= 0.5 * (queryInterval/timeRate)*point.saturation;
        
        if (point.saturation > 1) {point.saturation = 1};
        if (point.saturation < 0) {point.saturation = 0}; // should not happen
        
    },

    colorAnalysisPoint: function(FS) {
        // returns a hex color scaled by the input factor of safety
        var ptcolorR = Math.round(Math.min(1/Math.exp(FS-1),1) * 255);
        var ptcolorG = 0;
        var ptcolorB = 255-ptcolorR;
        var pcol = this.fullColorHex(ptcolorR,ptcolorG,ptcolorB);
            if (FS < 1) {pcol = 0x000000}

        return pcol;
    },

    scaleAnalysisPoint: function(m) {
        // returns a dot size in pixels radius for analysis point given saturation value m
        var pscale = m*7;             
        if (pscale < 1.5) {pscale = 1.5} else if (pscale > 5) {pscale=5}

        return pscale;

    },
    
    findNearestPoint: function (xpoint, ypoint) {
      var dist;
      var close = 20;
      var r = infoPoint;
      for(var t = 0; t < dots.length-1; t++){
        dist = Phaser.Math.distance(xpoint, ypoint, dots[t].x * dx_canvas, worldH+dots[t].y * dy_canvas);
        if(close > dist){
          r = t;
          close = dist;
        }
      }
      return r;

    },
    
    infoShower: function (r) {
        if (dots[r]) {
            var slp_tan = Math.round( Math.tan(dots[r].theta)*100)/100;
            var slp_recip = Math.round( 10/slp_tan ) / 10;
            var slp_deg = Math.round( this.rad2Deg(dots[r].theta) );
            slopetext.setText("Slope gradient: "+slp_deg+"º ("+slp_recip+":1)");
            saturationtext.setText("Saturation: "+Math.round(dots[r].saturation * 100)+"%" );
            FStext.setText("Factor of Safety: "+Math.round(dots[r].FS*10)/10);
        }
    },

    infoToggle: function (show_info) {
        if (show_info) {
            slopetext.visible = true;
            saturationtext.visible = true;
            FStext.visible = true;
            infoMode = true;
        } else {
            slopetext.visible = false;
            saturationtext.visible = false;
            FStext.visible = false;
            infoMode = false;
        }
    
    },

    
    
    
/* RENDER */
    
    render: function () {
/*
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
  */
    },

    populateVariables: function (sceneParams) {
        console.log(sceneParams)
        // display
        VE = sceneParams.scenario.display.VE;
        // landscape
        dx = sceneParams.scenario.landscape.dx;
        // soil
        Hr = sceneParams.scenario.soil.default_thickness;
        soilThinFactor = sceneParams.scenario.soil.thin_factor;
        defaultCohesion = sceneParams.scenario.soil.default_cohesion;
        defaultSaturation = sceneParams.scenario.soil.default_saturation;
        defaultPhi = sceneParams.scenario.soil.default_phi;
    },
    
    makeToolButtons: function(toolOptions) {
            
        // logic to set coordinate variables for each button based on toolOptions.tool_placement
        // right now options are "TL" (top left) and "TR" (top right), which is the default
        var shovelX, shovelY, dumpX, dumpY, houseX, houseY, inspectX, inspectY, treeX, treeY, menuX, menuY, resetX, resetY;
        
        // y-coords not dependent on side. these are in canvas units
        shovelY = 80;
        dumpY = 5;
        houseY = 20;
        inspectY = 88;
        // treeY = 0;
        
        rainY = 10
        menuY = 95;
        resetY = 125;

        
        if (toolOptions.tool_placement === "TL") {
            
            shovelX = 95;
            dumpX = 95;
            houseX = 170;
            inspectX = 165;
            // treeX = 0;
            
            rainX = 10
            menuX = 10;
            resetX = 10;
            
        } else {
            
            shovelX = worldW-180;
            dumpX = worldW-180;
            houseX = worldW-250;
            inspectX = worldW-245;
            // treeX = 0;
            
            rainX = worldW-90;
            menuX = worldW-90;
            resetX = worldW-90;

        }
        

        // draw each button for which toolOptions.tool_placement == true
        if (toolOptions.shovel) {
            shovelButton = g.add.button(shovelX, shovelY, 'shovel', this.toggleShovelMode, this,1,3,2,3);
            shovelButton.scale.setTo(0.25, 0.25);
            shovelButton.alpha = 0.8;
        }

        if (toolOptions.dump_truck) {
            dumpButton = g.add.button(dumpX, dumpY, 'dumptruck', this.toggleDumpMode, this, 1,3,2,3);
            dumpButton.scale.setTo(0.3, 0.3);
            dumpButton.alpha = 0.8;
        }
        
        if (toolOptions.add_house) {
            houseButton = g.add.button(houseX, houseY, 'housebtn', this.houseButtonClick, this,1,2,1,1);
            houseButton.scale.setTo(0.8, 0.8);        
        }
        
        if (toolOptions.add_trees) {
            //treeButton = g.add.button(treeX, treeY, 'trees1', this.treesOn, this, 2, 1, 0);
            //treeButton.scale.setTo(0.5, 0.5);
        }
        
        if (toolOptions.inspect) {
            infoButton = g.add.button(inspectX, inspectY, 'info', this.inspectPoints, this, 2, 1, 0);
            infoButton.scale.setTo(0.02, 0.02);
        }
        
        // persistent buttons
        rainButton = g.add.button(rainX, rainY, 'rain_button', null, null, 1, 3, 2, 3);
        rainButton.scale.setTo(0.6, 0.6);
        rainButton.onInputDown.add(this.toggleRain, this)
        rainButton.onInputUp.add(this.toggleRain, this)
        
        menuButton = g.add.button(menuX, menuY, 'menu_button', function(){g.state.start('menu')}, this,1,3,2,3);
        menuButton.scale.setTo(0.6, 0.6); 
        
        resetButton = g.add.button(resetX, resetY, 'reset_button', function(){g.state.start('play')}, this,1,3,2,3);
        resetButton.scale.setTo(0.6, 0.6); 
        
    }
    
};