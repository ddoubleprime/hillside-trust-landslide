var background;
var bedrock;
var x_axis;
var soil_graphic,bedrock_graphic;
var bot_pts, top_pts;
var soilclr = 0x7C450D, rockclr = 0x003366;
var dx = 1, VE = 3;     // x-spacing in grid units, vertical exaggeration
var worldW = 603, worldH = 504;
var y_base, soil_surface, bedrock_surface;
var surf_amp=20,surf_wavelength=50,surf_shift=-20;
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
var activeLS = false;
var active_ls_balls = [];
var adding_shovel, digging_shovel, landslide_shovel, active_shovel;

var esckey;
var slide_body;
var lkey, hkey;
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
        hkey = g.input.keyboard.addKey(Phaser.Keyboard.H)
        shovelButton = g.add.button(worldW-150, 20, 'shovel', this.toggleShovelMode, this);
        shovelButton.scale.setTo(0.025, 0.025);
        dumpButton = g.add.button(worldW-80, 20, 'dumptruck', this.toggleDumpMode, this);
        dumpButton.scale.setTo(0.25, 0.25);
        
        adding_shovel = new this.Shovel(3,-2); // (w,d)
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
        g.physics.box2d.gravity.y = -dy_canvas*9.81;
        g.physics.box2d.density = 2000; 
        g.physics.box2d.friction = 0.5; 
        g.physics.box2d.restitution = 0.1;
        // word bounds for physics
        //g.world.setBounds(-100, 0, worldW+100, worldH);
        g.physics.box2d.setBoundsToWorld();
        g.physics.box2d.collideWorldBounds = false;

        //g.debug.box2dWorld();
        
        console.log(g.physics.box2d);
        
        lkey.onDown.add(this.doLandslide, this)
        hkey.onDown.add(this.newHouse, this)
        
        /* CREATE: SURFACE ARRAYS */
        
        // prepare the bedrock surface array
        bedrock_surface = this.sinFunc(x_axis,surf_amp,surf_wavelength,surf_shift);
        this.rebaseFunc(bedrock_surface);
        // convert to canvas coordinates
        bedrock_surface_canvas = this.arrayScale(bedrock_surface,dy_canvas,worldH);
        
        // prepare the soil surface array
        soil_surface = this.arrayScale(bedrock_surface,1,Hr);

        // assign physics bodies and properties        
        g.physics.box2d.enable(soil_graphic); // not necessary - make surface a free body

        y_base_canvas = this.arrayScale(y_base,dy_canvas,worldH);
        
        // make canvas-unit coordinate pairs for drawing
        bot_pts = this.two1dto2d(x_axis_canvas,y_base_canvas);
        
        this.updateLandscapeGraphics();
        
        
        // make canvas-unit coordinate pairs for drawing and draw bedrock graphic
        top_pts = this.two1dto2d(x_axis_canvas,bedrock_surface_canvas);
        this.drawgraphic(bedrock_graphic,bot_pts,top_pts,rockclr)
        
                
        /* CREATE: PHYSICS */
        house = this.newHouse();
        

        
        
        
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
        
        if (activeLS) {
            this.checkBalls( active_ls_balls,x_axis_canvas, this.arrayMin(soil_surface_canvas,bedrock_surface_canvas) );
            if (this.isEmpty(active_ls_balls)) {activeLS = false};
        }

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
            idxout[1] = x_pts.findIndex( function(x) { return x >= xi });
            idxout[0] = idxout[1]-1; 

        } // if xi
        
        return idxout;
    },
    
    getRegionalSlope: function() {
        // input an array of evenly-spaced points and a grid spacing, and parameter windowsize (phys. units)
        // returns the local slope averaged over the windowsize
        
        
        
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
 
    doLandslide: function() {
        
        var ls_pos_x = Math.random()*worldW;
        // use the landslide_shovel to get the "failure plane"
        var post_ls_surface = this.applyShovel(landslide_shovel,ls_pos_x,x_axis,soil_surface);
        
        
        // base of slide body needs to be above bedrock!
        post_ls_surface = this.arrayMax(post_ls_surface,bedrock_surface);
        
        // use old and new in the changed section as top and bottom for a new graphics body
        var slide_thickness = this.arrayAdd(soil_surface,post_ls_surface,-1);
        slide_thickness = this.arrayThresh(slide_thickness,0.2*Math.max.apply(Math,slide_thickness));
        
        // update the soil surface using these points (as normal)
        soil_surface = post_ls_surface;        
        this.updateLandscapeGraphics();
        
        // need the x-range of the body points (nonzero elements in thresholded thickness.)
        var slide_area_l = slide_thickness.findIndex(this.checkNonZero);
        var slide_thick_local = slide_thickness.filter(this.checkNonZero);
        var slide_area_r = slide_area_l+slide_thick_local.length;
                
        var slide_base_padded = this.arrayScale(post_ls_surface.slice(slide_area_l,slide_area_r),1,0.001);
        
        // before passing the base array to slidebpodytoballs, need to isolate the part of the body that is above the bedrock surface
        ballsize = 2;  // px
            
        var newballs = this.slideBodyToBalls( slide_thick_local,slide_base_padded,slide_area_l,slide_area_r, ballsize );
        
        // add new balls to balls array
        active_ls_balls = active_ls_balls.concat(newballs);
        activeLS = true;
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
    
    slideBodyToBalls: function (arrH,arrB,lIdx,rIdx,ballsize) {
        // takes the arrays that define a slide body and fills the space with rectangular physics bodies of a specifed size.
        var ls_surface = this.arrayAdd(arrH,arrB,1);
        var ls_surface_canvas = this.arrayScale(ls_surface,dy_canvas,worldH);
        var x_loc = x_axis.slice(lIdx,rIdx);
        var x_loc_canvas = this.arrayScale(x_loc,dx_canvas,0);
        var y_base_loc_canvas = this.arrayScale(arrB,dy_canvas,worldH-2);
        
        // iterate along x axis at a spacing equal to (or very slightly greater than) the desired physics body size
        // at each x-position, iterate at increments of y-body-size from base to surface
        // if surface is lower than the next body increment, put a smaller body in that space
        // return the array that contains the bodies for use in adding sprites to them later
        var ball_container = [];
        var i_dx = (2*ballsize+0.01)/dx_canvas;
        for (var i = x_axis[lIdx]; i <= x_axis[rIdx]-i_dx; i+=i_dx )
            {
                var ymin = this.interp1(x_loc,arrB,i);
                var ymax = this.interp1(x_loc,ls_surface,i);
                var jdy = (2*ballsize+0.01)/dy_canvas;
                
                for (var j = ymin-jdy; j <= ymax; j-=jdy) {
                    var bx = i*dx_canvas, by = worldH + j*dy_canvas;
                    
                    var ball = g.add.sprite(bx,by,'water');
                    ball.width = 2*ballsize; ball.height = 2*ballsize;
                    ball.tint = soilclr;
                    ball.anchor.x = 0.5; ball.anchor.y = 0.5;

                    // assign physics bodies and properties        
                    g.physics.box2d.enable(ball);
                    ball.body.setCircle(ballsize);
                    ball.body.bullet = true;
                    ball.body.collideWorldBounds=false;
                    ball.body.outOfBoundsKill = true;
                    ball.body.friction = 0.7;

                    ball_container.push(ball);
                
                }  // for j (y)
            } // for i (x)
        
        return ball_container;
    },
    
    checkBalls: function (ball_array,x_array,surf_array){
        // iterate through ball array and kill any that are below surf_array
        // canvas units for all input arrays
        for (b=0;b<ball_array.length;b++) {
            
            bb = ball_array[b];
            if ( bb.x >= worldW-0.5*bb.width || bb.y > this.interp1(x_array,surf_array,bb.x) ) {
                bb.destroy();
                ball_array.splice(b,1);
            }
        } // for b

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
        
    updateLandscapeGraphics: function() {
        // derive thickness array
        soil_thickness = this.arrayAdd(soil_surface,bedrock_surface,-1);
        
        soil_surface_canvas = this.arrayScale(soil_surface,dy_canvas,worldH);
        this.drawgraphic(soil_graphic,bot_pts,this.two1dto2d(x_axis_canvas,soil_surface_canvas),soilclr);

        g.world.bringToTop(bedrock_graphic);

        var bodypoly = this.boxPolygonArray( x_axis_canvas, this.arrayMin(soil_surface_canvas,bedrock_surface_canvas) );

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
    
    newHouse: function(){
        
        var house = g.add.sprite(worldW/4,100,'house')
        
        house = this.scaleToPhysWidth(house,15); // (object, desired width in physical units)
        
        g.physics.box2d.enable(house);
        // house properties for reference; can use defaults for most objects
        house.body.setRectangle(house.width*.6,house.height);
        house.body.collideWorldBounds = false;
        house.outOfBoundsKill = true;
        house.fixedRotation = false; 
        house.bullet = false; house.linearDamping = 0; house.body.angularDamping = 1; house.gravityScale = 0;
        // These will affect all fixtures on the body 
        house.sensor = false;
        house.body.friction = 0.9;
        house.body.restitution = 0;
        house.body.mass = 10000; 
        house.body.density = 1000;
        
        return house;

    },
    
    
    
/* ANALYSIS POINTS */
    
    pointsInArea: function (numPts) {

        for (var i = 0; i < numPts; i++) {
            var xp = g.rnd.between(0, worldW );
            //console.log(xp);
            var zp = this.randomZPoint(xp);
            //console.log(xp);
            //console.log(zp);
            this.addDotToGroup(xp, zp);

        }
    },
    
    
    randomZPoint: function (xpoint) {
      var dot = [];

      // interpolate y-bounds from soil and bedrock surface arrays
        
        
        
      var slope =  this.findSlope(topR, this.toppoints, 1);
        
      var zp = g.rnd.between(TopXY[1], BotXY[1]);
      var width = zp - this.toppoints[topR][1];
      
      dot.x = xpoint;
      dot.y = zp;
      
      dot.theta = this.rad2Deg(Math.atan(slope));
      dot.saturation=0;
      dot.satDepth=0;
      dot.sH=width;
      dot.cohesion=this.Coh;
      dot.FS=this.FScalc(dot);


      this.dots.push(dot);


      return zp;

    },
    
    
    addDotToGroup: function(x,z) {

        var dot = g.add.graphics(0, 0);
            // graphics.lineStyle(2, 0xffd900, 1);

        dot.beginFill(0x0000FF, 1);
        dot.drawCircle(x, z , 4);

        if(this.showdotmode){
          g.world.bringToTop(dot);
        }else{
          g.world.bringToTop(this.graphic);
          g.world.bringToTop(this.bedrock);
        }

        this.dotGroup.add(dot);
    },
    
    FScalc: function (point) {
        return ( (point.cohesion + rho_r-point.saturation*rho_w)*grav*Math.cos(this.deg2Rad(point.theta))*Math.tan(this.deg2Rad(this.phi))*point.sH ) / (rho_r*grav*point.sH*Math.sin(this.deg2Rad(point.theta)));
    },

    deg2Rad: function (val) {
        return val * Math.PI / 180;
    },

    rad2Deg: function(val){
        return val * 180 / Math.PI;;
    },

    
/* RENDER */
    
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