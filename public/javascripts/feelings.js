(function ($) {
    let camera, scene, renderer, planes = {},
        windowWidth,
        windowHeight,
        windowDepth = 0,
        maxwidth,
        maxheight,
        maxdepth = 1,
        animating = false;
    let generalFeels = [], loveFeels = [], fearFeels = [], joyFeels = [], sadnesFeelings = [], angerFeelings = [];
    let mouse = new THREE.Vector3(), radius = 5, renderarea;
    let overCanvas = false;
    let gatherAll = false, mousePressed = false, gatherGeneral = false, hasOneInGrip = false;
    let fetchTweetsButton,tagInput;
    let planeLocation = Object.freeze({
        LEFT: 0,
        RIGHT: 1,
        TOP: 2,
        BOTTOM: 3
    });
    let font;
    let jQuery;


    function removeAllBalls(){
        generalFeels.splice(0,generalFeels.length);
        loveFeels.splice(0,loveFeels.length)
        fearFeels.splice(0,fearFeels.length)
        joyFeels.splice(0,joyFeels.length)
        sadnesFeelings.splice(0,sadnesFeelings.length)
        angerFeelings.splice(0,angerFeelings.length)
    }

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
                size: 15,
                height: 4
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
            counter += doAlignBehavior(this, sadnesFeelings, 40, steer);
            counter += doAlignBehavior(this, fearFeels, 40, steer);
            counter += doAlignBehavior(this, generalFeels, 40, steer);
            counter += doAlignBehavior(this, joyFeels, 40, steer);
            counter += doAlignBehavior(this, loveFeels, 40, steer);
            counter += doAlignBehavior(this, angerFeelings, 40, steer);
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
            if (this.mesh.position.z > 0) {
                console.log("floating in z-plane z:" + this.mesh.position.z);
            }
            for (let i = 0; i < angerFeelings.length; i++) {
                distance = this.mesh.position.distanceTo(angerFeelings[i].mesh.position);
                if (distance > 0 && distance < 10) {
                    steer.add(this.getDiffVector(angerFeelings[i], distance));
                    counter++;
                }
            }

            for (let i = 0; i < joyFeels.length; i++) {
                distance = this.mesh.position.distanceTo(joyFeels[i].mesh.position);
                if (distance > 0 && distance < 10) {
                    steer.add(this.getDiffVector(joyFeels[i], distance));
                    counter++;
                }
            }

            for (let i = 0; i < fearFeels.length; i++) {
                distance = this.mesh.position.distanceTo(fearFeels[i].mesh.position);
                if (distance > 0 && distance < 15) {
                    steer.add(this.getDiffVector(fearFeels[i], distance));
                    counter++;
                }
            }

            for (let i = 0; i < generalFeels.length; i++) {
                distance = this.mesh.position.distanceTo(generalFeels[i].mesh.position);
                if (distance > 0 && distance < 8) {
                    steer.add(this.getDiffVector(generalFeels[i], distance));
                    counter++;
                }
            }

            for (let i = 0; i < loveFeels.length; i++) {
                distance = this.mesh.position.distanceTo(loveFeels[i].mesh.position);
                if (distance > 0 && distance < 15) {
                    steer.add(this.getDiffVector(loveFeels[i], distance));
                    counter++;
                }
            }

            for (let i = 0; i < sadnesFeelings.length; i++) {
                distance = this.mesh.position.distanceTo(sadnesFeelings[i].mesh.position);
                if (distance > 0 && distance < 25) {
                    steer.add(this.getDiffVector(sadnesFeelings[i], distance));
                    counter++;
                }
            }

            if (counter > 0) {
                steer.divideScalar(counter);
            }
            steer.multiplyScalar(magnitude);
            this.acc.add(steer);
        };

        getDiffVector(aFeeling, distance){
            let diff = new THREE.Vector3();
            diff.subVectors(this.mesh.position, aFeeling.mesh.position);
            diff.normalize();
            diff.divideScalar(distance);
            return diff;
        }



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
                if (distance > 0 && distance < 40) {
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
                this.speed.setX(this.speed.x * (-1.5));
            }
            if (this.mesh.position.y >= (maxheight - radius) || this.mesh.position.y <= -(maxheight - radius)) {
                this.speed.setY(this.speed.y * (-1.5));
            }
        };

        //Is the mouse cursor over the feeling?
        mouseOver() {
            let distance = mouse.distanceTo(this.mesh.position);
            if (distance < radius + 10) {
                if(!this.isOver && overCanvas){
                    this.isOver = true;
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
           //console.log('mesh pos x: '+this.mesh.position.x+' y: '+this.mesh.position.y);
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
            this.separationBehavior(5);
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
            super(feelData, new THREE.Vector3(THREE.Math.randFloatSpread(3), THREE.Math.randFloatSpread(3), 0), 3, 0xffffff, font);
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
            this.acc.set(THREE.Math.randFloatSpread(.2), THREE.Math.randFloatSpread(.2), 0);
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
        let proto = location.protocol;
        //Load jQuery version 3.2.0 if it isn't already loaded.
        if (typeof jQuery == 'undefined' || window.jQuery.fn.jquery !== '3.2.0') {
            getScript(proto+'//ajax.googleapis.com/ajax/libs/jquery/3.2.0/jquery.js', function () {
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
        let fontLoader = new THREE.FontLoader();
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

    function initDisplayArea(){
        fetchTweetsButton = document.getElementById('button');
        tagInput = document.getElementById('tagInput');
        renderarea = document.getElementById('render-area');
        //TODO: check if elements exists
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
        //camera = new THREE.PerspectiveCamera(90, windowWidth / windowHeight, 0.5, 1000);
        //camera.position.set(0, 0, 150);
        camera = new THREE.OrthographicCamera(windowWidth/-2, windowWidth/2, windowHeight/2, windowHeight/-2,0.5, 1000);
        camera.position.set(0, 0, 10);
    }

    function initLight(){
        // The light is at the upper right corner of the room.
        let pointLight = new THREE.PointLight(0xffffff);
        pointLight.position.x = 0;
        pointLight.position.y = 0;
        pointLight.position.z = 1000;
        scene = new THREE.Scene();
        scene.add(pointLight);
    }


    function initEventListeners(){
        //TODO: check if fetchTweetsButton element exists
        fetchTweetsButton.addEventListener('click', onGetTweetsClick, false);
        renderarea.addEventListener('mousedown', onCanvasMouseDown, false);
        renderarea.addEventListener('mousemove', onCanvasMouseMove, false);
        renderarea.addEventListener('mouseup', onCanvasSMouseUp, false);
        renderarea.addEventListener('mouseover', onMouseOverCanvas, false);
        renderarea.addEventListener('mouseout',onMouseOutCanvas, false);
        document.addEventListener('keypress', onKeyPressed, true);
        tagInput.addEventListener('keyup', onTweetsButtonUp, true)

        window.onresize = function(event){
            refreshDisplay();
        };
    }

    function init() {
        if (window.animationId !== null)
            cancelAnimationFrame(window.animationId);
        initDisplayArea();
        refreshDisplay();
        initCamera();
        initLight();
        initPlanes();
        initEventListeners();

        fillData();
        animating = true;
        animate();
    }

    function fillData(aTag) {
        jQuery.getJSON('/api/getTweets/'+aTag, function (data) {
            //makeATestObject(data);
            makeVisualObjects(data);
        });
    }

    function removeAllVisualObjects(){
        for( let i = scene.children.length - 1; i >= 0; i--) {
            scene.remove(scene.children[i]);
        }
    }
    function makeATestObject(data){
        let oneAdded =false;
        for (index in data) {
            switch (data[index].type) {
                case "2": //Joy
                    feelData = new FeelingPresentationData(data[index].tweetText, data[index].tag);//tweetText, text, type, num
                    aFeeling = new JoyFeeling(feelData, font);
                    i = joyFeels.push(aFeeling);
                    joyFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                    scene.add(joyFeels[i - 1].mesh);
                    oneAdded = true;
                    break
            }
            if(oneAdded) break;
        }
    }

    function makeVisualObjects(data) {
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
                        i = joyFeels.push(aFeeling);
                        joyFeels[i - 1].mesh.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(maxwidth), THREE.Math.randFloatSpread(maxheight), 0));
                        scene.add(joyFeels[i - 1].mesh);
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

    function onGetTweetsClick(event){
        removeAllBalls();
        removeAllVisualObjects();
        if (window.animationId !== null)
            cancelAnimationFrame(window.animationId);
        initDisplayArea();
        refreshDisplay();
        initCamera();
        initLight();
        initPlanes();
        fillData(tagInput.value);
    }

    function onCanvasMouseDown(event) {
        mousePressed = true;
        updateMousePosition(event);
    }

    function onCanvasSMouseUp(event) {
        mousePressed = false;
        hasOneInGrip = false;
        updateMousePosition(event);
    }

    function onCanvasMouseMove(event) {
        updateMousePosition(event);
    }
    function onMouseOverCanvas(event){
        overCanvas=true;
    }
    function onMouseOutCanvas(event){
        overCanvas = false;
    }

    function onKeyPressed(event) {
        if (event.key.toUpperCase() === 'G') {
            gatherAll = true;
        } else {
            gatherAll = false
        }
    }

    function onTweetsButtonUp(event){
        event.preventDefault();
        if(event.keyCode === 13){
            fetchTweetsButton.click();
        }
    }

    
    function updateMousePosition(event) {
        event.preventDefault();
        let relX = ((event.offsetX - (renderer.domElement.style.left)));
        let relY = ((event.offsetY - (renderer.domElement.style.top)));
        let pMouse = new THREE.Vector3(relX - renderer.domElement.width / 2,
            -(relY - renderer.domElement.height / 2),
            0);
        mouse.x = pMouse.x;
        mouse.y = pMouse.y;
        mouse.z = pMouse.z;
    }


    function animate() {

        if (animating) {
            setTimeout(function () {
                window.animationId = requestAnimationFrame(animate);
            }, 1000 / 50);

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
        let w, h, posx = 0, posy = 0, posz = 0, rotx = 0, roty = 0, rotz = 0;

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
        let material = new THREE.MeshLambertMaterial({color: 0xeff2f4, opacity: 0, transparent: false});
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