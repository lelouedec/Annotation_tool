import * as THREE from './three.module.js';

import Stats from './stats.module.js';
import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './PCDLoader.js';
import { STLLoader } from './stl_loader.js';
import { DragControls } from './DragControls.js';
import { TransformControls } from './TransformControls.js';


import { SelectionBox } from './SelectionBox.js';
import { SelectionHelper } from './SelectionHelper.js';
import { GUI } from './dat.gui.module.js';

var container, container2,container3,container4, stats;
var camera,camera2,camera3,camera4, controls,scene, renderer,renderer2,renderer3,renderer4;
var raycaster, intersects;
var mouse, SELECTED;
var INTERSECTED = false;
var intersected_val;
var intersected_point;
var ROTATED;
var PAINTING;
var sphereGeometry = new THREE.SphereBufferGeometry( 0.01, 32, 32 );
var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
var dragControls ;
var transformControls;


raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();
var pointcloud;
var intersection = null;
var spheres = [];
var spheresIndex = 0;
var clock;
var colors;
var pointSize = 0.05;

var cubeGeo, cubeMaterial;
var objects = [];
var vertexHelpers=[];
var plane;
var target;
var rtscene;
var annotation;
var loader_pcd;
var loader_stl;
var draggables = [];

var world, mass, body, shape, timeStep=1/60;
init();
initCannon();
function initCannon() {

    world = new CANNON.World();
    world.gravity.set(0,0,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    mass = 1;
    body = new CANNON.Body({
      mass: 1
    });
    body.addShape(shape);
    body.angularVelocity.set(0,10,0);
    body.angularDamping = 0.5;
    world.addBody(body);

}

animate();
var connection;
function init() {

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    rtscene = new THREE.Scene();
    rtscene.background = new THREE.Color('red');

    camera = new THREE.PerspectiveCamera( 10, document.getElementById("main").offsetWidth/ window.innerHeight,  1, 10000 );
    camera.updateMatrix();
    scene.add( camera );

    camera2 = new THREE.PerspectiveCamera( 10, 200 / 200,  1, 10000 );
    camera2.updateMatrix();
    scene.add( camera2 );

    camera3 = new THREE.PerspectiveCamera( 10, 200 / 200,  1, 10000 );
    camera3.updateMatrix();
    scene.add( camera3 );

    camera4 = new THREE.PerspectiveCamera( 10, 400 / 400,  1, 10000 );
    camera4.updateMatrix();
    scene.add( camera4 );




    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 500, 2000 );
    light.angle = Math.PI / 9;
    light.castShadow = true;
    light.shadow.camera.near = 1000;
    light.shadow.camera.far = 4000;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add( light );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( document.getElementById("main").offsetWidth, window.innerHeight );

    renderer2 = new THREE.WebGLRenderer( { antialias: true } );
    renderer2.setPixelRatio( window.devicePixelRatio );
    renderer2.setSize( 200,200 );

    renderer3 = new THREE.WebGLRenderer( { antialias: true } );
    renderer3.setPixelRatio( window.devicePixelRatio );
    renderer3.setSize( 200,200 );





    var axesHelper = new THREE.AxesHelper(1.0);
    scene.add( axesHelper );

    loader_pcd = new PCDLoader();
    loader_stl = new STLLoader();



    for ( var i = 0; i < 40; i ++ ) {
        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        scene.add( sphere );
        spheres.push( sphere );
    }
    //invisible plane to drag the object on
    plane=new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2,2,0.2,0.2),
        new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide})
    );
    plane.visible=false;

    scene.add(plane);
    container = document.createElement( "div" );
 
    
    container2 = document.createElement( "div" );
    container2.className = "floating";
    container3 = document.createElement( "div" );
    container3.className = "floating2";

    container.appendChild( renderer.domElement );
    container2.appendChild( renderer2.domElement );
    container3.appendChild( renderer3.domElement );

    document.getElementById("main").appendChild(container)
    // document.getElementById("main").appendChild(container2)
    // document.getElementById("main").appendChild(container3)



    controls = new TrackballControls( camera, renderer.domElement );

    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
    controls.panSpeed = 0.2;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.minDistance = 0.03;
    // controls.maxDistance = 0.3 * 100;

    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.01;

    dragControls = new DragControls(draggables, camera, renderer.domElement );

    dragControls.addEventListener( 'dragstart', function () { controls.enabled = false; } );
    dragControls.addEventListener( 'dragend', function () { controls.enabled = true; } );

    transformControls = new TransformControls(camera, renderer.domElement);
    
    transformControls.setMode("scale");
    scene.add(transformControls);
    transformControls.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value
        dragControls.enabled = !event.value
    })

    

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    window.addEventListener( 'keypress', keyboard );
    window.addEventListener( 'keydown', keyboard2 );
    window.addEventListener( 'keyup', keyboard3 );
    createPanel();
    // cubes
    cubeGeo = new THREE.BoxBufferGeometry( 2, 2, 2 );
    cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c } );

}
function load_pcd(path){
    if(path.slice(-3)=="pcd" ){
        loader_pcd.load(path, function (geo) {
            scene.remove(pointcloud);
            for ( var i = 0; i < objects.length; i ++ ) {
                scene.remove(objects[i]);
            }            
            objects.length = 0;
            for ( var i = 0; i < draggables.length; i ++ ) {
                scene.remove(draggables[i]);
            }            
            draggables.length = 0;
            transformControls.detach();
            

            pointcloud = geo;
            scene.add( pointcloud );
            var center = pointcloud.geometry.boundingSphere.center;
            pointcloud.geometry.translate(-center.x,-center.y,-center.z)
            controls.target.set( center.x, center.y, center.z );
            controls.update();

            
            camera.position.z = pointcloud.geometry.boundingSphere.radius*10;

            camera2.position.x = -pointcloud.geometry.boundingSphere.radius*10;
            camera2.position.y = 0.0;
            camera2.position.z = 0.0;
            camera2.lookAt( center );


            camera3.position.x = 0.0;
            camera3.position.y = pointcloud.geometry.boundingSphere.radius*10;
            camera3.position.z = 0.0;
            camera3.lookAt( center );

            (annotation = []).length = pointcloud.geometry.vertices.length; annotation.fill(0);
        } );
    }else if(path.slice(-3)=="stl"){
        const material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );
        loader_stl.load(path, function (geometry) {

            let meshMaterial = material;
            if ( geometry.hasColors ) {

                meshMaterial = new THREE.MeshPhongMaterial( { opacity: geometry.alpha, vertexColors: true } );

            }

            const mesh = new THREE.Mesh( geometry, meshMaterial );

            mesh.position.set( 0.5, 0.2, 0 );
            mesh.rotation.set( - Math.PI / 2, Math.PI / 2, 0 );
            mesh.scale.set( 0.3, 0.3, 0.3 );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add( mesh );
        } );
    }
}
export function load_pcd_function(url) {load_pcd(url);}


function add_cylinder(){
    var heyyou = new THREE.CylinderGeometry( 0.2, 0.2,1, 10 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var cylinder = new THREE.Mesh( heyyou, material );
    scene.add( cylinder );
    draggables.push(cylinder);
    transformControls.attach(cylinder); 
}
export function add_cylinder_func() {add_cylinder();}


function to_scale(){    transformControls.setMode("scale");}
function to_translate(){    transformControls.setMode("translate");}
function to_rotate(){    transformControls.setMode("rotate");}
export function to_scale_func() {to_scale();}
export function to_translate_func() {to_translate();}
export function to_rotate_func() {to_rotate();}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();

}
function keyboard2( ev ) {
    switch(String.fromCharCode(ev.keyCode)){
        case "":
            PAINTING = true;
            break
    }
}
function keyboard3( ev ) {
    switch(String.fromCharCode(ev.keyCode)){
        case "":
            PAINTING = false;
            break
    }
}

function keyboard( ev ) {

    var points = pointcloud;
    switch ( ev.key || String.fromCharCode( ev.keyCode || ev.charCode ) ) {

        case '+':
            points.material.size *= 1.2;
            points.material.needsUpdate = true;
            break;

        case '-':
            points.material.size /= 1.2;
            points.material.needsUpdate = true;
            break;

        case 'c':
            points.material.color.setHex( Math.random() * 0xffffff );
            points.material.needsUpdate = true;
            break;

        case 'a':
            var geometry = new THREE.SphereBufferGeometry( 0.1, 32, 32 );
            var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
            geometry.dynamic = true;
            var sphere = new THREE.Mesh( geometry, material );
            sphere.name=objects.length;


            if(pointcloud != null){
                intersects = raycaster.intersectObject( pointcloud );
                intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
                sphere.position.copy(intersection.point);
                sphere.geometry.verticesNeedUpdate = true;
                scene.add(sphere);
                objects.push(sphere);
            }
            break;     


    }

}
function onDocumentMouseMove( event ) {
                event.preventDefault();
                mouse.x = ( event.offsetX /document.getElementById("main").offsetWidth ) * 2 - 1;
                mouse.y = - ( event.offsetY / window.innerHeight ) * 2 + 1;

                if(objects.length>0){
                        if(!SELECTED){
                            intersects = raycaster.intersectObjects( objects );
                            intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
                            for(var i=0;i<objects.length;i++){
                                    objects[i].material.color.setHex(0x00ff0f );
                                    objects[i].material.transparent= true;
                                    objects[i].material.opacity= .9;
                                }
                                if(intersection!==null){
                                    for(var i=0;i<intersects.length;i++){
                                        var result=intersects[i].object;
                                        result.material.color.setHex( 0xff00ff );
                                        result.material.transparent= true;
                                        result.material.opacity= .2;
                                        result.material.needsUpdate = true;
                                        intersected_val = result;
                                    }
                                    INTERSECTED = true;
                                }
                                else{
                                    INTERSECTED = false;
                                }
                        }
                        if(SELECTED){
                            plane.position.copy(intersected_val.position);
                            plane.lookAt(camera.position);
                            plane.visible=true;
                            var intersects=raycaster.intersectObject(plane);
                            if(intersects.length>0){
                                var val1 = intersects[0].point;
                                var val2 = intersected_val.position;
                                var sub1 = new THREE.Vector3(val1.x - val2.x,val1.y - val2.y,val1.z - val2.z).length();// / val2.sub(intersected_point).length();
                                var sub2 = new THREE.Vector3(intersected_point.x - val2.x,intersected_point.y - val2.y,intersected_point.z - val2.z).length();
                                var ratio = sub1/sub2;
                                if(ratio>0.25){
                                    intersected_val.scale.set(
                                        ratio,
                                        ratio,
                                        ratio
                                    );
                                }else{
                                    intersected_val.scale.set(
                                        0.25,
                                        0.25,
                                        0.25
                                    );
                                }
                            }
                        }
                        if(ROTATED){
                            plane.position.copy(intersected_val.position);
                            plane.lookAt(camera.position);
                            plane.visible=true;
                            var intersects=raycaster.intersectObject(plane);
                            if(intersects.length>0){
                                var deltaMove = {
                                        x: event.offsetX-intersected_val.position.x,
                                        y: event.offsetY-intersected_val.position.y
                                };
                                var deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                                    toRadians(deltaMove.y * 1),
                                    toRadians(deltaMove.x * 1),
                                    0,
                                    'XYZ'
                                ));
                                intersected_val.quaternion.multiplyQuaternions(deltaRotationQuaternion, intersected_val.quaternion);
                            }

                            }
                }

}

var toggle = 0;
function animate() {
    requestAnimationFrame( animate );
    controls.update();
    camera.updateMatrixWorld();
    raycaster.setFromCamera( mouse, camera );

    if(pointcloud != null){
        intersects = raycaster.intersectObject(pointcloud);
        intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
        if(PAINTING){
            console.log("painting");
            var geometry = pointcloud.geometry;
            var attributes = geometry.colors;
            if ( intersects.length > 0 ) {
                var distance = camera.position.distanceTo( geometry.vertices[intersection.index] );
                var distance2 = camera.position.distanceTo( pointcloud.geometry.boundingSphere.center );
                // console.log(distance,distance2);
                if(distance<distance2){
                    attributes[intersection.index] = {r:0,g:1,b:0};
                    annotation[intersection.index] = 1.0;
                    geometry.colorsNeedUpdate = true;
                }
            }
        }
        if ( toggle > 0.02 && intersection !== null ) {
                spheres[ spheresIndex ].position.copy( intersection.point );
                spheres[ spheresIndex ].scale.set( 1, 1, 1 );
                spheresIndex = ( spheresIndex + 1 ) % spheres.length;
                toggle = 0;

        }
            for ( var i = 0; i < spheres.length; i ++ ) {
                var sphere = spheres[ i ];
                sphere.scale.multiplyScalar( 0.98 );
                sphere.scale.clampScalar( 0.01, 1 );
            }
        toggle += clock.getDelta();
    }
    world.step(timeStep);
    renderer.render( scene, camera );
    renderer2.render( scene, camera2 );
    renderer3.render( scene, camera3 );
    
}
function createAGrid(opts) {
    var config = opts || {
    height: 500,
    width: 500,
    linesHeight: 10,
    linesWidth: 10,
    color: 0xDD006C
    };

    var material = new THREE.LineBasicMaterial({
    color: config.color,
    opacity: 1.0
    });

    var gridObject = new THREE.Object3D(),
    gridGeo = new THREE.Geometry(),
    stepw = 2 * config.width / config.linesWidth,
    steph = 2 * config.height / config.linesHeight;

    //width
    for (var i = -config.width; i <= config.width; i += stepw) {
    gridGeo.vertices.push(new THREE.Vector3(-config.height/100, i/100, 0));
    gridGeo.vertices.push(new THREE.Vector3(config.height/100, i/100, 0));

    }
    //height
    for (var i = -config.height; i <= config.height; i += steph) {
    gridGeo.vertices.push(new THREE.Vector3(i/100, -config.width/100, 0));
    gridGeo.vertices.push(new THREE.Vector3(i/100, config.width/100, 0));
    }

    var line = new THREE.LineSegments(gridGeo, material, THREE.LinePieces);
    gridObject.add(line);

    return gridObject;
}

function createPanel() {
    var panel = new GUI( { width: 310 } );
    var folder1 = panel.addFolder( 'Visibility' );
    var folder2 = panel.addFolder( 'Activation/Deactivation' );
    var folder5 = panel.addFolder( 'Points size' );
    var settings = {
        'show color': true,
        'modify step size': 0.05,
        'use default duration': true,
        'set custom duration': 3.5,
        'modify Point size': 0.005,
        'modify Paint scale': 1.0,
    };
    folder1.add( settings, 'show color' ).onChange( function (value){
        var points = pointcloud;
        if(value == false){
            // points.material.color.setHex( Math.random() * 0xffffff );
            pointcloud.material.vertexColors = THREE.NoColors;
            points.material.needsUpdate = true;
        }else{
            points.material.vertexColors = THREE.VertexColors;
            points.material.needsUpdate = true;
        }

    });
    var explode = {'save':function(){
                                    for(var i=0;i<objects.length;i++){

                                        var radius = objects[i].scale.x * objects[i].geometry.parameters.radius;
                                        var center = objects[i].position;
                                        console.log(objects[i]);
                                        console.log(objects[i].scale.x);
                                        var vertices = pointcloud.geometry.vertices
                                        for(var j=0;j<vertices.length;j++){
                                            var distance = Math.sqrt( (vertices[j].x-center.x)*(vertices[j].x-center.x) + (vertices[j].y-center.y)*(vertices[j].y-center.y) + (vertices[j].z-center.z)*(vertices[j].z-center.z))
                                            if(distance<radius){
                                                annotation[j] = 1.0;
                                            }
                                        }

                                    }
                                    var msg = {
                                        type: "Annotation",
                                        text: "pouet",
                                        id:   1,
                                        annotation: annotation,
                                        date: Date.now()
                                    };
                                    // Send the msg object as a JSON-formatted string.
                                    connection.send(JSON.stringify(msg));
                                },
                                'discard':function(){
                                    console.log("discard");
                                }
    }
    var help = {'help':function(){
                $("#myModal").modal();
            }
    }
    folder2.add(explode,"save");
    folder2.add(explode,"discard");
    folder2.add(help,"help");

    folder5.add( settings, 'modify Point size', 0.005, 1.0, 0.001 ).listen().onChange( function (value){
        pointcloud.material.size = value;
        pointcloud.material.needsUpdate = true;
    });
    folder5.add( settings, 'modify Paint scale', 1.0, 100.0, 1.0 ).listen().onChange( function (value){
        sphere.set(radius=value);
        sphere.geometry.needsUpdate = true;
    });

    folder1.open();
    folder2.open();
    folder5.open();

}

function onDocumentMouseDown(e){
    e.preventDefault();
    switch ( e.button ) {
        case 0: // left
            // if(INTERSECTED && !PAINTING){
            //     console.log("left click");
            //     var intersects2 = raycaster.intersectObject(intersected_val);
            //     intersected_point = intersects2[0].point;
            //     SELECTED = true;
            //     document.body.style.cursor='move';
            //     controls.enabled=false;
            // }
            break;
    case 1: // middle
            // if(INTERSECTED && !PAINTING){
            //     console.log("Right click");
            //     ROTATED = true;
            //     var intersects2 = raycaster.intersectObject(intersected_val);
            //     intersected_point = intersects2[0].point;
            //     document.body.style.cursor='grab';
            //     controls.enabled=false;
            // }
            break;
    case 2: // right
    break;
    }
}
function onDocumentMouseUp(e){
    e.preventDefault();
            switch ( e.button ) {
                case 0: // left
                            if(SELECTED && !PAINTING){
                                SELECTED = false;
                                document.body.style.cursor='auto';
                                controls.enabled=true;
                                plane.visible=false;
                            }
                            break;
                case 1: // middle
                            if(ROTATED && !PAINTING){
                                ROTATED = false;
                                document.body.style.cursor='auto';
                                controls.enabled=true;
                                plane.visible=false;
                            }
                            break;
                case 2: // right
                    break;
    }
}
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}
