(function ($) {
    //TODO: load words to find in tweets
    let camera, scene, renderer, planes = {},
        windowWidth,
        windowHeight,
        windowDepth = 0,
        maxwidth,
        maxheight,
        maxdepth = 1,
        animating = false;
    let generalFeels = [], loveFeels = [], fearFeels = [], joyFeels = [], sadnesFeelings = [], angerFeelings = [];
    let mouse = new THREE.Vector3(), radius = 2, INTERSECTED, renderarea;
    let gatherAll = false, mousePressed = false, gatherGeneral = false, hasOneInGrip = false;
    let lastTime = 0;
    let planeLocation = Object.freeze({
        LEFT: 0,
        RIGHT: 1,
        TOP: 2,
        BOTTOM: 3
    });
    let font;
    let jQuery;

    let trailHeadGeometry = [];
    trailHeadGeometry.push(
        new THREE.Vector3( -10.0, 0.0, 0.0 ),
        new THREE.Vector3( 0.0, 0.0, 0.0 ),
        new THREE.Vector3( 10.0, 0.0, 0.0 )
    );

// specify length of trail
    let trailLength = 300;


    class Ball { //Base class
        constructor(feelData, speed, speedLimit, color, font) {
            this.geometry = new THREE.CircleBufferGeometry(radius, 10);
            this.material = new THREE.MeshLambertMaterial({color: color});
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.acc = new THREE.Vector3();
            this.isOver = false;
            this.speed = speed;
            this.font = font;
            this.mesh.userData = feelData;
            //Create this only once!
            this.textGeometry = new THREE.TextGeometry(this.mesh.userData.text, {
                font: this.font,
                size: 10,
                height: 5
            });
            this.textMaterial =  new THREE.MeshBasicMaterial({color: 0xffffff});
            this.textMesh = new THREE.Mesh(this.textGeometry, this.textMaterial);
        };

        tryToEscape() {
            this.mesh.position.x = mouse.x + THREE.Math.randFloatSpread(5);
            this.mesh.position.y = mouse.y + THREE.Math.randFloatSpread(5);
            this.mesh.z = 0;
        };

        //Align - får bollen att röra sig i samma riktning som närliggande bollar
        alignBehavior(magnitude) {
            let steer = new THREE.Vector3();
            let counter = 0;
            let distance = 0;

            for (let i = 0; i < sadnesFeelings.length; i++) {
                //walk trough all Generals
                distance = this.mesh.position.distanceTo(sadnesFeelings[i].mesh.position);
                if (distance > 0 && distance < 40) {
                    steer.add(sadnesFeelings[i].speed);
                    counter++;
                }
            }
            for (let i = 0; i < fearFeels.length; i++) {
                //walk trough all Generals
                distance = this.mesh.position.distanceTo(fearFeels[i].mesh.position);
                if (distance > 0 && distance < 40) {
                    steer.add(fearFeels[i].speed);
                    counter++;
                }
            }
            //counter += doAlignBehavior(this, generalFeels, 40, steer);
            for (let i = 0; i < generalFeels.length; i++) {
                //walk trough all Generals
                distance = this.mesh.position.distanceTo(generalFeels[i].mesh.position);
                if (distance > 0 && distance < 40) {
                    steer.add(generalFeels[i].speed);
                    counter++;
                }
            }

            for (let i = 0; i < joyFeels.length; i++) {
                distance = this.mesh.position.distanceTo(joyFeels[i].mesh.position);
                if (distance > 0 && distance < 40) {
                    steer.add(joyFeels[i].speed);
                    counter++;
                }
            }

            for (let i = 0; i < loveFeels.length; i++) {
                distance = this.mesh.position.distanceTo(loveFeels[i].mesh.position);
                if (distance > 0 && distance < 60) {
                    steer.add(loveFeels[i].speed);
                    counter++;
                }
            }

            for (let i = 0; i < angerFeelings.length; i++) {
                distance = this.mesh.position.distanceTo(angerFeelings[i].mesh.position);
                if (distance > 0 && distance < 10) {
                    steer.add(angerFeelings[i].speed);
                    counter++;
                }
            }
            if (counter > 0) {
                steer.divideScalar(counter);
            }

            steer.multiplyScalar(magnitude);
            this.acc.add(steer);
        };

        allGather() {
        };

        //TODO: Check if it is possible to reduce number of walk through (for loops) in behaviors?
        //Separation - ger bollen acceleration ifrån närliggande bollar
        separationBehavior(magnitude) {
            let steer = new THREE.Vector3();
            let distance = 0;
            let counter = 0;
            for (let i = 0; i < angerFeelings.length; i++) {
                distance = this.mesh.position.distanceTo(angerFeelings[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 10) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, angerFeelings[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    steer.add(diff);
                    counter++;
                }
            }

            for (let i = 0; i < joyFeels.length; i++) {
                distance = this.mesh.position.distanceTo(joyFeels[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 10) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, joyFeels[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    steer.add(diff);
                    counter++;
                }
            }

            for (let i = 0; i < fearFeels.length; i++) {
                distance = this.mesh.position.distanceTo(fearFeels[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 15) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, fearFeels[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    steer.add(diff);
                    counter++;
                }
            }

            for (let i = 0; i < generalFeels.length; i++) {
                distance = this.mesh.position.distanceTo(generalFeels[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 8) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, generalFeels[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    //console.log("diff:"+ diff.x +" "+ diff.y +" "+ diff.z);
                    steer.add(diff);
                    counter++;
                }
            }

            for (let i = 0; i < loveFeels.length; i++) {
                distance = this.mesh.position.distanceTo(loveFeels[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 15) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, loveFeels[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    steer.add(diff);
                    counter++;
                }
            }

            for (let i = 0; i < sadnesFeelings.length; i++) {
                distance = this.mesh.position.distanceTo(sadnesFeelings[i].mesh.position);
                if (this.mesh.position.z > 0) {
                    console.log("floating in z-plane z:" + this.mesh.position.z);
                }
                if (distance > 0 && distance < 25) {
                    let diff = new THREE.Vector3();
                    diff.subVectors(this.mesh.position, sadnesFeelings[i].mesh.position);
                    diff.normalize();
                    diff.divideScalar(distance);
                    steer.add(diff);
                    counter++;
                }
            }

            if (counter > 0) {
                steer.divideScalar(counter);
            }
            steer.multiplyScalar(magnitude);
            this.acc.add(steer);
        };

        //Cohesion - ger bollen dragningskraft mot närliggande bollar
        cohesionBehavior(magnitude) {
            let sum = new THREE.Vector3();
            let counter = 0;
            for (let i = 0; i < joyFeels.length; i++) {
                let distance = this.mesh.position.distanceTo(joyFeels[i].mesh.position);
                if (distance > 0 && distance < 20) {
                    sum.add(joyFeels[i].mesh.position);
                    counter++;
                }
            }
            for (let i = 0; i < fearFeels.length; i++) {
                let distance = this.mesh.position.distanceTo(fearFeels[i].mesh.position);
                if (distance > 0 && distance < 30) {
                    sum.add(fearFeels[i].mesh.position);
                    counter++;
                }
            }
            for (let i = 0; i < generalFeels.length; i++) {
                let distance = this.mesh.position.distanceTo(generalFeels[i].mesh.position);
                if (distance > 0 && distance < 15) {
                    sum.add(generalFeels[i].mesh.position);
                    counter++;
                }
            }
            for (let i = 0; i < loveFeels.length; i++) {
                let distance = this.mesh.position.distanceTo(loveFeels[i].mesh.position);
                if (distance > 0 && distance < 30) {
                    sum.add(loveFeels[i].mesh.position);
                    counter++;
                }
            }
            for (let i = 0; i < sadnesFeelings.length; i++) {
                let distance = this.mesh.position.distanceTo(sadnesFeelings[i].mesh.position);
                if (distance > 0 && distance < 50) {
                    sum.add(sadnesFeelings[i].mesh.position);
                    counter++;
                }
            }
            for (let i = 0; i < angerFeelings.length; i++) {
                let distance = this.mesh.position.distanceTo(angerFeelings[i].mesh.position);
                if (distance > 0 && distance < 50) {
                    sum.add(angerFeelings[i].mesh.position);
                    counter++;
                }
            }
            if (counter > 0) {
                sum.divideScalar(counter);
            }
            let steer = new THREE.Vector3();
            steer.subVectors(sum, this.mesh.position);
            steer.normalize();
            steer.sub(this.speed);
            steer.multiplyScalar(magnitude);
            this.acc.add(steer);
        };

        //Check if we hit a plane
        updatePlaneCollision() {
            let radius = this.mesh.geometry.parameters.radius;
            if (this.mesh.position.x >= (maxwidth - radius) || this.mesh.position.x <= -(maxwidth - radius)) {
                this.speed.setX(this.speed.x * (-1));
            }
            if (this.mesh.position.y >= (maxheight - radius) || this.mesh.position.y <= -(maxheight - radius)) {
                this.speed.setY(this.speed.y * (-1));
            }
        };

        //Is the mouse cursor over the feeling?
        mouseOver() {
            let distance = mouse.distanceTo(this.mesh.position);
            if (distance < radius + 10) {
                if(!this.isOver){
                this.isOver = true;
                //console.log("Distance x:"+mouse.x+ " y:"+ mouse.y);

                    this.textMesh.position.x = this.mesh.position.x;
                    this.textMesh.position.y = this.mesh.position.y;

                document.getElementById('tweet').innerHTML = this.mesh.userData.tweetText;
                scene.add(this.textMesh);
                }

            } else {
                this.isOver = false;
                scene.remove(this.textMesh);
            }
        }
    }
    /*
    * Joy Feeling class
     */
    class JoyFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(4), THREE.Math.randFloatSpread(4), 0), 3, 0xffeb03, font);
            this.material.opacity = 200;
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.updatePlaneCollision();//Move this?
            this.move();
            this.special();
            this.allGather();
        };


        flock() {
            this.separationBehavior(10);
            this.cohesionBehavior(0.002);
            this.alignBehavior(0.0005);
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            this.speed.clampScalar(-3, 3);
            if (mousePressed && this.isOver) {
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(1.2));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(.5), THREE.Math.randFloatSpread(.5), 0);
        };

        allGather() {
            if (gatherAll) {
                for (let i = 0; i < joyFeels.length; i++) { //walk through GeneralFeelings
                    let steer = new THREE.Vector3(0, 0, 0);
                    steer.subVectors(joyFeels[i].mesh.position, this.mesh.position);
                    steer.normalize();
                    steer.multiplyScalar(0.01);
                    this.acc.add(steer);
                    this.separationBehavior(1);
                }
            }
        };


        special() {
            let curiosity = false;
            let inside = false;
            let easing = 0.015;
            let targetX = mouse.x, targetY = mouse.y;
            let dx = targetX - this.mesh.position.x; // x catheter
            let dy = targetY - this.mesh.position.y; // y catheter
            if (Math.abs(mouse.x) > 0 && Math.abs(mouse.x) < maxwidth && Math.abs(mouse.y) > 0 && Math.abs(mouse.y) < maxheight) {
                inside = true; //Inside window
            } else {
                inside = false;
            }
            if (Math.abs(dx) > 1 && Math.abs(dx) < 190 && Math.abs(dy) > 1 && Math.abs(dy) < 190) {
                curiosity = true;
            }
            if ((inside) && (curiosity)) {
                this.mesh.position.x += dx * easing;
                this.mesh.position.y += dy * easing;
                this.mesh.position.z = 0;
            }
        }
    }

    /*
  * Fear Feeling class
   */
    class FearFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData,new THREE.Vector3(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2), 0), 3, 0x03FFB1, font);
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.updatePlaneCollision();//Move this?
            this.move();
            this.allGather();
        };

        flock() {
            this.separationBehavior(3);
            this.cohesionBehavior(0.4);
            this.alignBehavior(0);
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            this.speed.clampScalar(-3, 3);
            if (mousePressed && this.isOver) {
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(1.5));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(.5), THREE.Math.randFloatSpread(.5), 0);
        };

        allGather() {
            if (gatherAll) {
                for (let i = 0; i < fearFeels.length; i++) { //walk through GeneralFeelings
                    let steer = new THREE.Vector3();
                    steer.subVectors(fearFeels[i].mesh.position, this.mesh.position);
                    steer.normalize();
                    steer.multiplyScalar(0.5);
                    this.acc.add(steer);
                    this.separationBehavior(15);
                }
            }
        };
    }

    // angerFeelings
    class AngerFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(6), THREE.Math.randFloatSpread(6), 0), 2, 0xFF2403, font);
            this.acc = new THREE.Vector3();
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.special();
            this.updatePlaneCollision();//Move this?
            this.allGather();
            this.move();
        };

        flock() {
            //kör funktionerna separation, cohesion och align från klassen Boll
            this.separationBehavior(5);
            this.cohesionBehavior(0.02);
            this.alignBehavior(0);
            this.special();
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            //TODO: set boundary for speed....
            this.speed.clampScalar(-2, 2);
            if (mousePressed && this.isOver) {
                hasOneInGrip = true;
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(4));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2), 0);
        };

        //arga bollar söker upp varandra för att de vill slåss och stångas
        //därför styr varje boll mot alla andra arga bollar hela tiden
        special() {
            for (let i = 0; i < angerFeelings.length; i++) {
                let steer = new THREE.Vector3();
                steer.subVectors(angerFeelings[i].mesh.position, this.mesh.position);
                steer.normalize();
                steer.multiplyScalar(0.05);
                this.acc.add(steer);
                this.separationBehavior(15);
            }
        };
    }

    /*
    * Love Feeling class
     */
    class LoveFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(6), THREE.Math.randFloatSpread(6), 0), 3, 0xcc0099, font);
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.updatePlaneCollision();//Move this?
            this.move();
            this.allGather();
        };

        flock() {
            //console.log(this.mesh.userData.text);
            this.separationBehavior(1);
            this.cohesionBehavior(0.05);
            this.alignBehavior(0.00001);
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            //TODO: set boundary for speed....
            this.speed.clampScalar(-3, 3);
            if (mousePressed && this.isOver) {
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(2));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(.5), THREE.Math.randFloatSpread(.5), 0);
        };

    }


    /*
    * General Feeling class
     */
    class GeneralFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(4), THREE.Math.randFloatSpread(4), 0), 3, 0xffffff, font);
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.updatePlaneCollision();//Move this?
            this.move();
            this.allGather();
        };

        flock() {
            //TODO: gathering while mouse button pressed!
            (mousePressed && this.isOver) ? gatherGeneral = true : gatherGeneral = false;
            if (gatherGeneral) {
                let steer = new THREE.Vector3(mouse.x, mouse.y, 0);
                steer.sub(this.mesh.position);
                steer.multiplyScalar(0.005);
                this.acc.add(steer);
            }
            //kör funktionerna separation, cohesion och align från klassen Boll
            //generella bollar har låg separation och cohesion för att mest glida omkring som en "normal" boll
            //de har även viss alignment för att ta efter andra bollars riktning
            //console.log(this.mesh.userData.text);
            this.separationBehavior(2);
            this.cohesionBehavior(0.004);
            this.alignBehavior(0.00001);
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            //TODO: set boundary for speed....
            this.speed.clampScalar(-3, 3);
            if (mousePressed && this.isOver) {
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(2));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(.5), THREE.Math.randFloatSpread(.5), 0);
        };

        //Om gatherAll är true så söker alla generella bollar sig till varandra
        allGather() {
            if (gatherAll) {
                for (let i = 0; i < generalFeels.length; i++) { //walk through GeneralFeelings
                    let steer = new THREE.Vector3();
                    steer.subVectors(generalFeels[i].mesh.position, this.mesh.position);
                    steer.normalize();
                    steer.multiplyScalar(0.05);
                    this.acc.add(steer);
                    this.separationBehavior(30);
                }
            }
        };


    }

    class SadnesFeeling extends Ball {
        constructor(feelData, font) {
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2), 0), 0.9, 0x416FA0, font);
        }

        runIt() {
            this.mouseOver();
            this.flock();
            this.updatePlaneCollision();//Move this?
            this.move();
            this.allGather();
        };

        flock() {
            this.separationBehavior(3);
            this.cohesionBehavior(0.0001);
            this.alignBehavior(0);
        };

        move() {
            this.speed.add(this.acc); //ad acceleration to velocity(speed)
            //TODO: set boundary for speed....
            this.speed.clampScalar(-0.6, 0.6);
            if (mousePressed && this.isOver) {
                this.tryToEscape();
            } else if (this.isOver) {  //Reduce velocity
                this.mesh.position.add(this.speed.divideScalar(2));
            } else {  //no reduction of speed
                this.mesh.position.add(this.speed);
            }
            //Move eractic
            this.acc.set(THREE.Math.randFloatSpread(.5), THREE.Math.randFloatSpread(.5), 0);
        };
    }


    function getScript(url, success) {
        let script = document.createElement('script');
        script.src = url;
        let head = document.getElementsByTagName('head')[0],
            done = false;
        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState
                || this.readyState == 'loaded'
                || this.readyState == 'complete')) {
                done = true;
                success();
                script.onload = script.onreadystatechange = null;
                head.removeChild(script);
            }
        };
        head.appendChild(script);
    }

    window.onload = function () {
        //Load jQuery version 3.2.0 if it isn't already loaded.
        if (typeof jQuery == 'undefined' || window.jQuery.fn.jquery !== '3.2.0') {
            getScript('http://ajax.googleapis.com/ajax/libs/jquery/3.2.0/jquery.js', function () {
                if (typeof window.jQuery == 'undefined') {
                    if (window.console) console.log('Sorry, but jQuery wasn\'t able to load');
                } else {
                    $ = jQuery = window.jQuery.noConflict();
                    if (window.console) console.log('This page is now jQuerified with v' + jQuery.fn.jquery);
                }
            });
        } else {
            if (window.console) console.log('jQuery v' + jQuery.fn.jquery + ' already loaded!');
        }
        var fontLoader = new THREE.FontLoader();
        fontLoader.load('fonts/helvetiker_regular.typeface.json', function (response) {
            font = response;
            init();
        });

    };

    /*
    * TODO:sKatetrarna
    *   - Walk through all feelings in one for loop for each feeling!
    S*/
    function plane(mesh) {
        this.mesh = mesh;
    }

    function initDisplay(){
        renderarea = document.getElementById('render-area');
        renderarea.style.cursor = 'crosshair';
        renderer = new THREE.WebGLRenderer({alpha:true});
        renderer.setClearColor( 0x000000, 0 ); // the default

        // Remove all existing nodes.
        while (renderarea.firstChild) {
            renderarea.removeChild(renderarea.firstChild);
        }
        renderarea.appendChild(renderer.domElement);
        refreshDisplay();
    }

    function refreshDisplay(){
        windowWidth = renderarea.offsetWidth;
        windowHeight = renderarea.offsetHeight;
        maxwidth = windowWidth/2 ;
        maxheight = windowHeight/2;
        maxdepth = 0;
        renderer.setSize(windowWidth, windowHeight);
    }

    function initCamera(){
        camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 0.5, 1000);
        camera.position.set(0, 0, 325);
    }

    function initLight(){
        // The light is at the upper right corner of the room.
        let pointLight = new THREE.PointLight(0xffffff);
        pointLight.position.x = 0;
        pointLight.position.y = 0;
        pointLight.position.z = 1000;
        return pointLight;
    }

    function init() {
        if (window.animationId !== null)
            cancelAnimationFrame(window.animationId);
        initDisplay();

        refreshDisplay();
        initCamera();
        initLight()
        scene = new THREE.Scene();
        scene.add(initLight());
        initPlanes();



        renderarea.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        renderarea.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('keypress', onKeyPressed, true);
        window.onresize = function(event){
            refreshDisplay();
        };

        // create the trail renderer object
         trail = new THREE.TrailRenderer( scene, false );

        // create material for the trail renderer
        trailMaterial = THREE.TrailRenderer.createBaseMaterial();

        fillData();
        animating = true;
        animate();
    }

    function fillData() {
        jQuery.getJSON('/api/getTweets', function (data) {
            makeVisualObjects(data);
        });
    }

    function makeVisualObjects(data) {
        // initialize the trail
        //trail.initialize( trailMaterial, trailLength, false, 0, trailHeadGeometry, trailTarget );
        for (index in data) {
            switch (data[index].type) {
                case "1": //Anger
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        i = angerFeelings.push(new AngerFeeling(feelData, font));
                        angerFeelings[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(angerFeelings[i - 1].mesh);
                    break;
                case "2": //Joy
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        aFeeling = new JoyFeeling(feelData, font);
                        //trail.initialize( trailMaterial, trailLength, false, 0, trailHeadGeometry, aFeeling );
                        i = joyFeels.push(aFeeling);
                        joyFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(joyFeels[i - 1].mesh);
                        //trail.activate();
                    break;
                case "3": //Fear
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        i = fearFeels.push(new FearFeeling(feelData, font));
                        fearFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(fearFeels[i - 1].mesh);
                    break;
                case "4": //Love
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        i = loveFeels.push(new LoveFeeling(feelData, font));
                        loveFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(loveFeels[i - 1].mesh);
                    break;
                case "5": //Sadnes
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        i = sadnesFeelings.push(new SadnesFeeling(feelData, font));
                        sadnesFeelings[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(sadnesFeelings[i - 1].mesh);
                    break;
                case "6": //General
                        feelData = new FeelingPresentationData(data[index].tweetText,data[index].tag);//tweetText, text, type, num
                        i = generalFeels.push(new GeneralFeeling(feelData, font));
                        generalFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(generalFeels[i - 1].mesh);
                    break;

            }
        }
    }

    function onDocumentMouseDown(event) {
        mousePressed = true;
        updateMousePosition(event);
    }

    function onDocumentMouseUp(event) {
        mousePressed = false;
        hasOneInGrip = false;
        updateMousePosition(event);
    }

    function onDocumentMouseMove(event) {
        updateMousePosition(event);
    }

    function onKeyPressed(event) {
        if (event.key.toUpperCase() === 'G') {
            gatherAll = true;
        } else {
            gatherAll = false
        }
    }

    function updateMousePosition(event) {
        event.preventDefault();
        let pMouse = new THREE.Vector3((event.offsetX/ (renderer.domElement.clientWidth)) * 2.0 - 1.025,
            -(event.offsetY / (renderer.domElement.clientHeight)) * 2.0 + 1.025,
            0);
        pMouse.unproject(camera);
        let m = pMouse.z / (pMouse.z - camera.position.z);
        mouse.x = pMouse.x + (camera.position.x - pMouse.x) * m;
        mouse.y = pMouse.y + (camera.position.y - pMouse.y) * m;
        mouse.z = 0;
    }


    function animate() {

        if (animating) {
            //console.log("elapsed:" + elapsed+ "time:"+now.getTime());
            setTimeout(function () {

                window.animationId = requestAnimationFrame(animate);

            }, 1000 / 30);

            //window.animationId = requestAnimationFrame(animate);
            for (let i = 0; i < generalFeels.length; i++) {
                generalFeels[i].runIt();
            }
            for (let i = 0; i < loveFeels.length; i++) {
                loveFeels[i].runIt();
            }
            for (let i = 0; i < fearFeels.length; i++) {
                fearFeels[i].runIt();
            }
            for (let i = 0; i < joyFeels.length; i++) {
                joyFeels[i].runIt();
            }
            for (let i = 0; i < sadnesFeelings.length; i++) {
                sadnesFeelings[i].runIt();
            }
            for (let i = 0; i < angerFeelings.length; i++) {
                angerFeelings[i].runIt();
            }
            render();
        }
    }

    function render() {
        renderer.render(scene, camera);
    }


    function getRandomFloat() {
        return Math.random() - 0.5;
    }

    function doAlignBehavior(self, feelingList, distance, steer) {
        let counter = 0;
        for (let i = 0; i < feelingList.length; i++) {
            //walk trough all Generals
            distance = self.mesh.position.distanceTo(feelingList[i].mesh.position);
            if (distance > 0 && distance < distance) {
                steer.add(feelingList[i].speed);
                counter++;
            }
        }
        return counter;
    }


    function FeelingPresentationData( tweetText, tag, type) {
        this.text = tag;
        this.tweetText = tweetText;
        this.type = type;
    }

    function initPlanes() {
        initPlane(planeLocation.TOP);
        initPlane(planeLocation.BOTTOM);
        initPlane(planeLocation.RIGHT);
        initPlane(planeLocation.LEFT);
    }

    function initPlane(planeLoc) {
        var w, h, posx = 0, posy = 0, posz = 0, rotx = 0, roty = 0, rotz = 0;

        switch (planeLoc) {
            case planeLocation.LEFT:
                w = windowDepth;
                h = windowHeight;
                posx = -maxwidth;
                roty = Math.PI / 2;
                break;
            case planeLocation.RIGHT:
                w = windowDepth;
                h = windowHeight;
                posx = maxwidth;
                roty = -Math.PI / 2;
                break;
            case planeLocation.BOTTOM:
                w = windowWidth;
                h = windowDepth;
                posy = -maxheight;
                rotx = -Math.PI / 2;
                break;
            case planeLocation.TOP:
                w = windowWidth;
                h = windowDepth;
                posy = maxheight;
                rotx = Math.PI / 2;
                break;
        }

        let geometry = new THREE.PlaneGeometry(w, h);
        let material = new THREE.MeshLambertMaterial({color: 0xeff2f4, opacity: 0, transparent: true});
        let planeMesh = new THREE.Mesh(geometry, material);
        planeMesh.position.x = posx;
        planeMesh.position.y = posy;
        planeMesh.position.z = posz;
        planeMesh.rotation.x = rotx;
        planeMesh.rotation.y = roty;
        planeMesh.rotation.z = rotz;
        let thePlane = new plane(planeMesh);
        planes[planeLoc] = thePlane;
        scene.add(thePlane.mesh);
    }
})();