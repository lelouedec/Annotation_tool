import * as THREE from './three.module.js';

import Stats from './stats.module.js';
import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './PCDLoader.js';
import { STLLoader } from './stl_loader.js';
import { PLYLoader } from './PLYLoader.js';

import { DragControls } from './DragControls.js';
import { TransformControls } from './TransformControls.js';


import { SelectionBox } from './SelectionBox.js';
import { SelectionHelper } from './SelectionHelper.js';
import { GUI } from './dat.gui.module.js';
// import * as tree from './index.js';

var container;
var camera,camera2,camera3,camera4, controls,scene, renderer,renderer2,renderer3;
var raycaster, intersects;
var mouse;
var painting;

var dragControls ;
var transformControls;


raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();
var pointcloud;
var intersection = null;

var clock;


var objects = [];

var rtscene;
var annotation;
var loader_pcd;
var loader_stl;
var loader_ply;

var draggables = [];

var world, mass, body, shape, timeStep=1/60;
var sphere;

var ctrly = [];
var ctrlz = [];
var tempctrlsz = [];
var left_button = 0;
var dragstart;
var dragend;

var classes = {0:'{"r":0,"g":0,"b":0}',1:'{"r":1,"g":0,"b":0}',2:'{"r":1,"g":0,"b":1}',3:'{"r":0.2,"g":0.4,"b":1}',4:'{"r":0.2,"g":0.8,"b":0.8}',5:'{"r":0.2,"g":0.8,"b":0.2}',6:'{"r":0.4,"g":1,"b":0.2}',7:'{"r":1,"g":0.6,"b":0.2}',8:'{"r":0.6,"g":0,"b":0.6}'}
var classe_base = {"r":0,"g":0,"b":0};

// var geometry = new THREE.CylinderGeometry(0.2,0.2, 10);
// var pinceau = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { color: 0xff0000 }) );

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

    // scene.add(pinceau);



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
    loader_ply = new PLYLoader();

    var sphereGeometry = new THREE.SphereBufferGeometry( 1, 32, 32 );
    var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xa3aab5 } );
    sphereMaterial.transparent= true;
    sphereMaterial.opacity= 0.6;
    sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.visible = false;
    sphere.scale.x = 0.1;
    sphere.scale.y = 0.1;
    sphere.scale.z = 0.1;
    scene.add(sphere);

    container = document.createElement( "div" );
 
    container.appendChild( renderer.domElement );

    document.getElementById("main").appendChild(container)

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

    dragControls.addEventListener( 'dragstart', function (event) { 
        controls.enabled = false; 
        dragstart = event.object.position.clone();
    });
    dragControls.addEventListener( 'dragend', function (event) { 
        controls.enabled = true;        
        dragend = event.object.position.clone();
        ctrlz.push({
                uuid:event.object.uuid,
                transformation:"translate",
                start:dragstart.clone(),
                offset:dragend.clone(),
            }
        ); 
    } );

    transformControls = new TransformControls(camera, renderer.domElement);
    
    transformControls.setMode("translate");
    scene.add(transformControls);
    transformControls.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value
        dragControls.enabled = !event.value
    })
    transformControls.addEventListener('objectChange', function (event) {
        save_transformation(event.target.object.uuid,event)
    })
    transformControls.addEventListener('mouseDown', function (event) {
        
    })
    transformControls.addEventListener('mouseUp', function (event) {
        left_button=0;
        ctrlz.push(tempctrlsz.pop())
        tempctrlsz = [];
    })

    

    window.addEventListener( 'resize', onWindowResize, false );
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener('click',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    window.addEventListener( 'keypress', keyboard );
    window.addEventListener( 'keydown', keyboard2 );
    createPanel();
    // renderer.domElement.onmousedown = function(e){
    //     console.log("pressed")
    //         left_button = 1;
    // }
    // renderer.domElement.onmouseup = function(e){
    //     console.log("unpressed")
    //     left_button = 0;
    // }
   
    painting=false;

}
function save_transformation(uuid,event){
    // console.log(uuid);
    if(event.detail.transformation=="scale"){
            tempctrlsz.push({
                uuid:uuid,
                transformation:"scale",
                _tempVector2:event.detail._tempVector2.clone(),
                scaleStart:event.detail.scaleStart.clone()
            })        
    }else if(event.detail.transformation=="translate"){
        tempctrlsz.push({
            uuid:uuid,
            transformation:"translate",
            start:event.detail.positionStart.clone(),
            offset:event.detail.offset.clone()
        }) 
    }else if(event.detail.transformation=="rotate"){
        // tempctrlsz.push({
        //     uuid:uuid,
        //     transformation:"rotate",
        //     start:event.detail.positionStart.clone(),
        //     offset:event.detail.offset.clone()
        // }) 
    }

}


function load_pcd(path){
    if(path.slice(-3)=="pcd" ){
        loader_pcd.load(path, function (geo) {
            console.log(geo);
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
            // tree.initAsync(pointcloud.geometry.vertices);

            pointcloud.geometry.computeBoundingSphere()
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

            (annotation = []).length = pointcloud.geometry.vertices.length; annotation.fill({"r":0,"g":0,"b":0});
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
            (annotation = []).length = pointcloud.geometry.vertices.length; annotation.fill({"r":0,"g":0,"b":0});

            scene.add( mesh );
        } );
    }
}
export function load_pcd_function(url) {load_pcd(url);}

function load_from_data(data,type){
    if(type=="pcd"){
        var geo = loader_pcd.parse(data);
    }else if(type=="ply"){
        var geo = loader_ply.parse(data);
    }
    console.log(geo);
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

    if(pointcloud.geometry.type=="BufferGeometry"){
        (annotation = []).length = pointcloud.geometry.attributes.position.count; annotation.fill({"r":0,"g":0,"b":0});
    }else{
        (annotation = []).length = pointcloud.geometry.vertices.length; annotation.fill({"r":0,"g":0,"b":0});
    }
    
}
export function set_load_from_data(data,type){load_from_data(data,type);};

function add_cylinder(){
    var heyyou = new THREE.CylinderGeometry( 1, 1, 1, 10 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var cylinder = new THREE.Mesh( heyyou, material );
    scene.add( cylinder );
    draggables.push(cylinder);
    transformControls.attach(cylinder); 
}
export function add_cylinder_func() {add_cylinder();}



function add_Cube(){
    var cuby = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var cube = new THREE.Mesh( cuby, material );
    scene.add( cube );
    draggables.push(cube);
    transformControls.attach(cube); 
}
export function add_Cube_func() {add_Cube();}


function add_Sphere(){
    var sphery = new THREE.SphereGeometry( 1    , 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var spherette = new THREE.Mesh( sphery, material );
    scene.add( spherette );
    draggables.push(spherette);
    transformControls.attach(spherette); 
}
export function add_Sphere_func() {add_Sphere();}





function to_scale(){    transformControls.setMode("scale");}
function to_translate(){    transformControls.setMode("translate");}
function to_rotate(){    transformControls.setMode("rotate");}
export function to_scale_func() {to_scale();}
export function to_translate_func() {to_translate();}
export function to_rotate_func() {to_rotate();}

function set_painting(){
    painting = !painting;
}
export function set_painting_func() {set_painting();}

export function set_reclass(param) {reclass(param);}

function reclass(param){
    var rgb = param.slice(4);
    console.log(parseInt(rgb.split(",")[0]) )
    console.log(parseInt(rgb.split(",")[1]) )
    console.log(parseInt(rgb.split(",")[2]) )

    if(transformControls.object!=undefined){
        transformControls.object.material.color = new THREE.Color( parseInt(rgb.split(",")[0])/255, parseInt(rgb.split(",")[1])/255, parseInt(rgb.split(",")[2])/255 );
    }
    classe_base = {'r':parseInt(rgb.split(",")[0])/255, 'g':parseInt(rgb.split(",")[1])/255,'b': parseInt(rgb.split(",")[2])/255}
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();

}

export function set_back(){func_ctrlz()};
function func_ctrlz(){
    if(ctrlz.length>0){
        var todostuff = ctrlz.pop()
        if(todostuff!=undefined){
            if(todostuff.transformation=="paint"){
                for (var i =0;i<todostuff.indices.length;i++){
                    annotation[todostuff.indices[i]] = todostuff.prev_cla[i];
                    pointcloud.geometry.colors[todostuff.indices[i]] = todostuff.prev_colors[i];
                    pointcloud.geometry.colorsNeedUpdate = true;
                }
            }else{
                for(var i=0;i<draggables.length;i++){
                    if(draggables[i].uuid==todostuff.uuid){
                        if(todostuff.transformation=="scale"){
                            draggables[i].scale.set( todostuff.scaleStart.x,todostuff.scaleStart.y,todostuff.scaleStart.z);
                        }else if(todostuff.transformation=="translate"){
                            draggables[i].position.set(todostuff.start.x,todostuff.start.y,todostuff.start.z)
                        } 
                    }
                }
            }
        }
    }
}
function func_delete(){
   if(transformControls.object!=undefined){
        var obj = transformControls.object
        transformControls.detach();

        scene.remove( obj );
        var index = 0;
        for (var i =0;i<draggables.length;i++){
            if(draggables[i].uuid=obj.uuid){
                index = i;
            }
        }
        draggables = draggables.splice(index, 1);
        animate();
    }
}
function keyboard2( ev ) {
    if (ev.keyCode == 90 && ev.ctrlKey){
        func_ctrlz();
    } 
    if(ev.keyCode==46){
        func_delete();
    }
    if(ev.keyCode==37 || ev.keyCode==38 || ev.keyCode==39 || ev.keyCode==40){//move left/up/right/down
        if(ev.shiftKey && ev.keyCode==38 ){
            move_arrow(100)
        }else if(ev.shiftKey && ev.keyCode==40){
            move_arrow(-100)
        }
        move_arrow(ev.keyCode);
    }
}
function move_arrow(direction){
    if(transformControls.object != undefined){
        
        var direc = new THREE.Vector3(camera.position.x - transformControls.object.position.x,
                                      camera.position.y - transformControls.object.position.y,
                                      camera.position.z - transformControls.object.position.z);
        var anyvector  = new THREE.Vector3(1,100,2);
        
        anyvector.normalize();
        var orthogonal = new THREE.Vector3(direc.y*anyvector.z-direc.z*anyvector.y,
                                           anyvector.x*direc.z-anyvector.z*direc.x,
                                           anyvector.y*direc.x-anyvector.x*direc.y)

        direc.normalize();  
        orthogonal.normalize();
        console.log(orthogonal)

        // ortho_gonal = (yc-zb,az-cx,bx-ay).
        if(direction==38){//up so going away
            transformControls.object.position.set(transformControls.object.position.x - (0.1*direc.x),
                                                  transformControls.object.position.y - (0.1*direc.y),
                                                  transformControls.object.position.z - (0.1*direc.z)
                                                
                                                )
        }else if(direction==40){//down so coming closer
            transformControls.object.position.set(transformControls.object.position.x + (0.1*direc.x),
                                                  transformControls.object.position.y + (0.1*direc.y),
                                                  transformControls.object.position.z + (0.1*direc.z)
                                                )
        }
        else if(direction==37){//left so going left
            transformControls.object.position.set(transformControls.object.position.x + (0.1*orthogonal.x),
                                                  transformControls.object.position.y + (0.1*orthogonal.y),
                                                  transformControls.object.position.z + (0.1*orthogonal.z)
                                                )
        }
        else if(direction==39){//left so going left
            transformControls.object.position.set(transformControls.object.position.x - (0.1*orthogonal.x),
                                                  transformControls.object.position.y - (0.1*orthogonal.y),
                                                  transformControls.object.position.z - (0.1*orthogonal.z)
                                                )
        }else if(direction == 100){
            var anyvector  = new THREE.Vector3(100,1,2);
            anyvector.normalize();
            var orthogonal = new THREE.Vector3(direc.y*anyvector.z-direc.z*anyvector.y,
                                            anyvector.x*direc.z-anyvector.z*direc.x,
                                            anyvector.y*direc.x-anyvector.x*direc.y)

            direc.normalize();  
            orthogonal.normalize();
            transformControls.object.position.set(transformControls.object.position.x + (0.1*orthogonal.x),
                                                  transformControls.object.position.y + (0.1*orthogonal.y),
                                                  transformControls.object.position.z + (0.1*orthogonal.z)
                                                )
        }
        else if(direction == -100){
            var anyvector  = new THREE.Vector3(100,1,2);
            anyvector.normalize();
            var orthogonal = new THREE.Vector3(direc.y*anyvector.z-direc.z*anyvector.y,
                                            anyvector.x*direc.z-anyvector.z*direc.x,
                                            anyvector.y*direc.x-anyvector.x*direc.y)

            direc.normalize();  
            orthogonal.normalize();
            transformControls.object.position.set(transformControls.object.position.x - (0.1*orthogonal.x),
                                                  transformControls.object.position.y - (0.1*orthogonal.y),
                                                  transformControls.object.position.z - (0.1*orthogonal.z)
                                                )
        }
        
    }else{
        
    }

}


export  function set_pointsize_func(size){change_point_size(size)};

function change_point_size(size){
    pointcloud.material.size = size;
    pointcloud.material.needsUpdate = true;
}

export  function set_brushsize_func(size){change_brush_size(size)};

function change_brush_size(size){
    sphere.scale.x = size;
    sphere.scale.y = size;
    sphere.scale.z = size;
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
            if(painting){
                var vertices;
                var isbuffer = false;
                var legnth ;
                if(pointcloud.geometry.type=="BufferGeometry"){
                    vertices = pointcloud.geometry.attributes.position;
                    isbuffer = true;
                    legnth = vertices.count;
                }else{
                    vertices = pointcloud.geometry.vertices;
                    legnth = vertices.length
                }
                var painted = [];
                var painted_color = [];
                var painted_prevcolor = [];
                var prev_classe = [];
                for (var j=0;j<legnth;j++){
                    if(isbuffer){
                        var distance = (vertices.getX(j) - sphere.position.x)**2 +(vertices.getY(j) - sphere.position.y)**2 + (vertices.getZ(j) - sphere.position.z)**2
                    }else{
                        var distance = (vertices[j].x - sphere.position.x)**2 +(vertices[j].y - sphere.position.y)**2 + (vertices[j].z - sphere.position.z)**2
                    }
                    if(distance < (sphere.scale.x**2) ){
                        painted_prevcolor.push(pointcloud.geometry.colors[j]);
                        prev_classe.push(annotation[j]);
                        annotation[j] = classe_base;//{"r":draggables[i].material.color.r,"g":draggables[i].material.color.g,"b":draggables[i].material.color.b};
                        pointcloud.geometry.colors[j] = classe_base;
                        pointcloud.geometry.colorsNeedUpdate = true;
                        painted.push(j);
                        painted_color.push(classe_base);
                    }
                }
                ctrlz.push(
                    {
                        uuid:'000',
                        transformation:"paint",
                        indices:painted,
                        prev_colors:painted_prevcolor,
                        newcolor:painted_color,
                        prev_cla:prev_classe
                    }
                )
            }
            break;
            


    }

}
function onDocumentMouseMove( event ) {

        event.preventDefault();
        mouse.x = ( event.offsetX /   renderer.domElement.offsetWidth ) * 2 - 1;
        mouse.y = - ( event.offsetY / renderer.domElement.offsetHeight) * 2 + 1;

        if(draggables.length>0){
            intersects = raycaster.intersectObjects( draggables );
            intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
            for(var i=0;i<draggables.length;i++){
                // draggables[i].material.color.setHex(0xff0000 );
                draggables[i].material.transparent= true;
                draggables[i].material.opacity= 1.0;
            }
            if(intersection!==null){
                for(var i=0;i<intersects.length;i++){
                    var result=intersects[i].object;
                    result.material.opacity= .5;
                    result.material.needsUpdate = true;
                }
            }
        }
}

function onDocumentMouseDown(e){
    e.preventDefault();
    mouse.x =   ( e.offsetX /document.getElementById("main").offsetWidth ) * 2 - 1;
    mouse.y = - ( e.offsetY / window.innerHeight ) * 2 + 1;
    switch ( e.button ) {
        case 0: // left
            console.log("pressed");
            left_button = 1;
            if(draggables.length>0){
                intersects = raycaster.intersectObjects( draggables );
                intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;

                for(var i=0;i<draggables.length;i++){
                    // draggables[i].material.color.setHex(0xff0000 );
                    draggables[i].material.transparent= true;
                    draggables[i].material.opacity= 1.0;
                }
                if(intersection!==null){
                    var result=intersects[0].object;
                    result.material.opacity= .5;
                    result.material.needsUpdate = true;
                    transformControls.detach();
                    transformControls.attach(result);
                }else{
                    transformControls.detach();
                }
            }            
            break;
    case 1: // middle
            
            break;
    case 2: // right
    break;
    }
}
function onDocumentMouseUp(e){
   console.log("unpressed")
   left_button = 0;
}


function animate() {
    requestAnimationFrame( animate );
    controls.update();
    camera.updateMatrixWorld();
    raycaster.setFromCamera( mouse, camera );

    if(pointcloud != null &&painting){
        var bds = pointcloud.geometry.boundingSphere;
        var newsphere = new THREE.Mesh( new THREE.SphereBufferGeometry( bds.radius, 32, 32 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );

        intersects = raycaster.intersectObject(newsphere);
        intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;

        if(intersection!=null){
            var origin = intersection.point;
            var dir = new THREE.Vector3(raycaster.ray.direction.x,raycaster.ray.direction.y,raycaster.ray.direction.z);
            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();
            var radi = sphere.scale.x;
            // var nb_steps = 10
            var pos = new THREE.Vector3(origin.x,origin.y,origin.z);
            var start = new THREE.Vector3(pos.x-(dir.x*100), pos.y-(dir.y*100),pos.z-(dir.z*100));
            var end   = new THREE.Vector3(pos.x+(dir.x*10000), pos.y+(dir.y*10000),pos.z+(dir.z*10000));
            var dx = end.x - start.x;	// translate so first_pts is origin.  Make vector from
            var dy = end.y - start.y;    // first_pts to second_pts.  Need for this is easily eliminated
            var dz = end.z - start.z;
            var lengthsq = dx**2 + dy**2 + dz**2;
            
            var vertices;
            var isbuffer = false;
            var legnth ;
            if(pointcloud.geometry.type=="BufferGeometry"){
                vertices = pointcloud.geometry.attributes.position;
                isbuffer = true;
                legnth = vertices.count;
            }else{
                vertices = pointcloud.geometry.vertices;
                legnth = vertices.length
            }
            var inthat = origin;
            var doted = 100000000.0;
            var dsc   = 10000.0;
            
            for (var j=0;j<legnth;j++){
                var inside = 0;
                var pdx,pdy,pdz;
                if(isbuffer){
                    pdx = vertices.getX(j) - start.x;		// vector from pt1 to test point.
                    pdy = vertices.getY(j) - start.y;
                    pdz = vertices.getZ(j) - start.z;
                }else{
                    pdx = vertices[j].x - start.x;		// vector from pt1 to test point.
                    pdy = vertices[j].y - start.y;
                    pdz = vertices[j].z - start.z;
                }
                var dot = pdx * dx + pdy * dy + pdz * dz;
                if(dot < 0.0 || dot > lengthsq){
                    inside = 0.0
                }else{
                    var dsq = (pdx*pdx + pdy*pdy + pdz*pdz) - dot*dot/lengthsq;
                    if(dsq > radi**2){
                        inside = 0.0
                    }else{
                        inside = 1.0
                    
                    }
                }
                if(inside==1.0){
                    if(dot<doted ){
                            if(isbuffer){
                                inthat = new THREE.Vector3(vertices.getX(j),vertices.getY(j),vertices.getZ(j));
                            }else{
                                inthat = vertices[j].clone();
                            }
                            doted = dot;
                            dsc = dsq;
                    }
                }

            }

        if(inthat!=origin && intersection!=null){
            sphere.visible = true;
            var dist = Math.sqrt( (origin.x-inthat.x)**2 + (origin.y-inthat.y)**2 + (origin.z-inthat.z)**2 );
            var bisu = new THREE.Vector3(origin.x + (dir.x*dist),origin.y+ (dir.y*dist),origin.z+ (dir.z*dist));
            sphere.position.copy( bisu );
        }else{
            sphere.visible = false;
        }                 
        }else{
            sphere.visible = false;
        }
          
    }
    world.step(timeStep);
    renderer.render( scene, camera );    
}


function createPanel() {
    var panel = new GUI( { width: 310 } );
    // var folder1 = panel.addFolder( 'Visibility' );
    var folder2 = panel.addFolder( 'Activation/Deactivation' );
    // var folder5 = panel.addFolder( 'Points size' );
    var settings = {
        // 'show color': true,
        'modify step size': 0.05,
        'use default duration': true,
        'set custom duration': 3.5,
        // 'modify Point size': 0.005,
        'modify Paint scale': 0.01,
    };

    var explode = {	'save':function(){
                                cyclinder_contains();
                                Sphere_contains();
                                cuboid_contains();
                                var saved_annot = [];
                                for (var i=0;i<annotation.length;i++){
                                    saved_annot.push(getKeyByValue(classes,JSON.stringify(annotation[i]) ));
                                }
                                var msg = {
                                    type: "Annotation",
                                    text: "Annotation for each point",
                                    id:   1,
                                    annotation: saved_annot,
                                    date: Date.now()
                                };
                                const a = document.createElement('a')
                                a.download = "pouet"
                                a.href = URL.createObjectURL(new Blob([JSON.stringify(msg)], {type: 'application/json'}))
                                a.click()
                                },								
                    'discard':function(){
						console.log("discard");
                    }
    }
    var help = {'help':function(){
                $("#myModal").modal();
            }
    }
	
	//load annotation file
	let load = {'load': function() {
		let input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = function(e) {
			let reader = new FileReader();
			reader.readAsText(e.target.files[0], 'UTF-8');
			reader.onload = e => {
				let new_data = JSON.parse(e.target.result);
				if (new_data.annotation.length == annotation.length) {
					for (let i = 0; i < new_data.annotation.length; i++) {
					  if (new_data.annotation[i] != "0") {
						  annotation[i] = JSON.parse(classes[new_data.annotation[i]]);
						  pointcloud.geometry.colors[i] = annotation[i];					  
					  }
					};
					pointcloud.geometry.colorsNeedUpdate = true;					
				} else {
					alert('The wrong annotation file.');
				};
			};
		};
		input.click();	
	}};
	
	folder2.add(load, "load").name("load annotation");
    folder2.add(explode,"save").name("save annotation");
    folder2.add(explode,"discard");
    folder2.add(help,"help");

    folder2.open();

}


function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}


///// check all annotation objects and for all cylinder it checks which points are inside
function cyclinder_contains(){
    var vertices;
    var isbuffer = false;
    console.log(pointcloud.geometry.attributes);
    if(pointcloud.geometry.type=="BufferGeometry"){
        vertices = pointcloud.geometry.attributes.position;
        isbuffer = true;
    }else{
        vertices = pointcloud.geometry.vertices;
    }
    for(var i=0;i<draggables.length;i++){
        if(draggables[i].geometry.type=="CylinderGeometry"){
            var scale    = draggables[i].scale.clone();
            var center   = draggables[i].position.clone();
            var rotation = draggables[i].rotation.clone();
          

            var first = center.clone();
            first.y = first.x+(scale.y/2);


            var second = center.clone();
            second.y = second.x-(scale.y/2);

            var axis_x = new THREE.Vector3( 1, 0, 0 );
            var axis_y = new THREE.Vector3( 0, 1, 0 );
            var axis_z = new THREE.Vector3( 0, 0, 1 );

            var m_x = new THREE.Matrix3();
            m_x.set( 1, 0, 0,
                   0, Math.cos(rotation.x), -Math.sin(rotation.x),
                   0, Math.sin(rotation.x), Math.cos(rotation.x) );

            var m_y = new THREE.Matrix3();
            m_y.set( Math.cos(rotation.y), 0, Math.sin(rotation.y),
                          0,               1, 0,
                    -Math.sin(rotation.y), 0, Math.cos(rotation.y) );

            var m_z = new THREE.Matrix3();
            m_z.set( Math.cos(rotation.z), -Math.sin(rotation.z), 0,
                   Math.sin(rotation.z), Math.cos(rotation.z) , 0,
                   0,0, 1 );

           
            var first_pts  =  new THREE.Vector3( 0, scale.y/2, 0 );

            first_pts.applyMatrix3(m_z);
            first_pts.applyMatrix3(m_y);
            first_pts.applyMatrix3(m_x);

            first_pts.x = first_pts.x + center.x;
            first_pts.y = first_pts.y + center.y;
            first_pts.z = first_pts.z + center.z;

            var second_pts  =  new THREE.Vector3( 0, -(scale.y/2), 0 );

            second_pts.applyMatrix3(m_z);
            second_pts.applyMatrix3(m_y);
            second_pts.applyMatrix3(m_x);
            
            second_pts.x = second_pts.x + center.x;
            second_pts.y = second_pts.y + center.y;
            second_pts.z = second_pts.z + center.z;

            var dx = second_pts.x - first_pts.x;	// translate so first_pts is origin.  Make vector from
            var dy = second_pts.y - first_pts.y;    // first_pts to second_pts.  Need for this is easily eliminated
            var dz = second_pts.z - first_pts.z;
            var lengthsq = dx**2 + dy**2 + dz**2;
            var radius = scale.x;

            for (var j=0;j<vertices.length;j++){
                var inside = 0;
                var pdx,pdy,pdz;
                if(isbuffer){
                    pdx = vertices.getX(j) - first_pts.x;		// vector from pt1 to test point.
                    pdy = vertices.getY(j) - first_pts.y;
                    pdz = vertices.getZ(j) - first_pts.z;
                }else{
                    pdx = vertices[j].x - first_pts.x;		// vector from pt1 to test point.
                    pdy = vertices[j].y - first_pts.y;
                    pdz = vertices[j].z - first_pts.z;
                }
                var dot = pdx * dx + pdy * dy + pdz * dz;
                if(dot < 0.0 || dot > lengthsq){
                    inside = 0.0
                }else{
                    var dsq = (pdx*pdx + pdy*pdy + pdz*pdz) - dot*dot/lengthsq;
                    if(dsq > radius**2){
                        inside = 0.0
                    }else{
                        inside = 1.0
                    
                    }
                }
                if(inside ==1.0){
                    annotation[j] = {"r":draggables[i].material.color.r,"g":draggables[i].material.color.g,"b":draggables[i].material.color.b};
                    pointcloud.geometry.colors[j] ={r:draggables[i].material.color.r,g:draggables[i].material.color.g,b:draggables[i].material.color.b};
                    pointcloud.geometry.colorsNeedUpdate = true;
                }

            }
        }
    }
}


function Sphere_contains(){
    var vertices;
    var isbuffer = false;
    console.log(pointcloud.geometry.attributes);
    if(pointcloud.geometry.type=="BufferGeometry"){
        vertices = pointcloud.geometry.attributes.position;
        isbuffer = true;
    }else{
        vertices = pointcloud.geometry.vertices;
    }
    for(var i=0;i<draggables.length;i++){
        if(draggables[i].geometry.type=="SphereGeometry"){
            var center = draggables[i].position.clone()
            for (var j=0;j<vertices.length;j++){
                if(isbuffer){
                    var distance = (vertices.getX(j) - center.x)**2 +(vertices.getY(j) - center.y)**2 + (vertices.getZ(j) - center.z)**2
                }else{
                    var distance = (vertices[j].x - center.x)**2 +(vertices[j].y - center.y)**2 + (vertices[j].z - center.z)**2
                }
                
                if(distance < draggables[i].scale.x**2){
                    annotation[j] = {"r":draggables[i].material.color.r,"g":draggables[i].material.color.g,"b":draggables[i].material.color.b};
                    pointcloud.geometry.colors[j] ={r:draggables[i].material.color.r,g:draggables[i].material.color.g,b:draggables[i].material.color.b};
                    pointcloud.geometry.colorsNeedUpdate = true;
                }
            }
        }
    }
    
}
function cuboid_contains(){
    var vertices;
    var isbuffer = false;
    console.log(pointcloud.geometry.attributes);
    if(pointcloud.geometry.type=="BufferGeometry"){
        vertices = pointcloud.geometry.attributes.position;
        isbuffer = true;
    }else{
        vertices = pointcloud.geometry.vertices;
    }
    for(var i=0;i<draggables.length;i++){
        if(draggables[i].geometry.type=="BoxGeometry"){
            var scale    = draggables[i].scale.clone();
            var center   = draggables[i].position.clone();
            var rotation = draggables[i].rotation.clone();

            var m_x = new THREE.Matrix3();
            m_x.set( 1, 0, 0,
                   0, Math.cos(rotation.x), -Math.sin(rotation.x),
                   0, Math.sin(rotation.x), Math.cos(rotation.x) );

            var m_y = new THREE.Matrix3();
            m_y.set( Math.cos(rotation.y), 0, Math.sin(rotation.y),
                          0,               1, 0,
                    -Math.sin(rotation.y), 0, Math.cos(rotation.y) );

            var m_z = new THREE.Matrix3();
            m_z.set( Math.cos(rotation.z), -Math.sin(rotation.z), 0,
                   Math.sin(rotation.z), Math.cos(rotation.z) , 0,
                   0,0, 1 );

           
            var p1  =  new THREE.Vector3( -(scale.x/2), -(scale.y/2), -(scale.z/2) );

            p1.applyMatrix3(m_z);
            p1.applyMatrix3(m_y);
            p1.applyMatrix3(m_x);

            p1.x = p1.x + center.x;
            p1.y = p1.y + center.y;
            p1.z = p1.z + center.z;

            var p2  =  new THREE.Vector3(-(scale.x/2), -(scale.y/2), (scale.z/2) );

            p2.applyMatrix3(m_z);
            p2.applyMatrix3(m_y);
            p2.applyMatrix3(m_x);
            
            p2.x = p2.x + center.x;
            p2.y = p2.y + center.y;
            p2.z = p2.z + center.z;


            var p4  =  new THREE.Vector3( (scale.x/2), -(scale.y/2), -(scale.z/2) );

            p4.applyMatrix3(m_z);
            p4.applyMatrix3(m_y);
            p4.applyMatrix3(m_x);
            
            p4.x = p4.x + center.x;
            p4.y = p4.y + center.y;
            p4.z = p4.z + center.z;

            var p5  =  new THREE.Vector3( -(scale.x/2), (scale.y/2), -(scale.z/2) );

            p5.applyMatrix3(m_z);
            p5.applyMatrix3(m_y);
            p5.applyMatrix3(m_x);
            
            p5.x = p5.x + center.x;
            p5.y = p5.y + center.y;
            p5.z = p5.z + center.z;

           

            var u = new THREE.Vector3(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z)
            var v = new THREE.Vector3(p4.x-p1.x,p4.y-p1.y,p4.z-p1.z)
            var w = new THREE.Vector3(p5.x-p1.x,p5.y-p1.y,p5.z-p1.z)


            var dotup1 = u.x*p1.x + u.y*p1.y + u.z*p1.z
            var dotup2 = u.x*p2.x + u.y*p2.y + u.z*p2.z

            var dotvp1 = v.x*p1.x + v.y*p1.y + v.z*p1.z
            var dotvp4 = v.x*p4.x + v.y*p4.y + v.z*p4.z


            var dotwp1 = w.x*p1.x + w.y*p1.y + w.z*p1.z
            var dotwp5 = w.x*p5.x + w.y*p5.y + w.z*p5.z

            var inside = 0.0;
            for (var a=0;a<vertices.length;a++){
                inside = 0.0;
                var p ;
                if(isbuffer){
                    p = new THREE.Vector3(vertices.getX(j),vertices.getY(j),vertices.getZ(j))
                }else{
                    p = new THREE.Vector3(vertices[a].x,vertices[a].y,vertices[a].z)
                }

                var dotpu = p.x * u.x + p.y * u.y + p.z * u.z;
                var dotpv = p.x * v.x + p.y * v.y + p.z * v.z;
                var dotpw = p.x * w.x + p.y * w.y + p.z * w.z;


                if( dotpu>dotup1 && dotpu<dotup2  && dotpv>dotvp1 && dotpv<dotvp4 && dotpw>dotwp1 && dotpw<dotwp5 ){
                    inside = 1.0;
                }
                if(inside == 1.0){
                    annotation[a] = {"r":draggables[i].material.color.r,"g":draggables[i].material.color.g,"b":draggables[i].material.color.b};
                    pointcloud.geometry.colors[a] ={r:draggables[i].material.color.r,g:draggables[i].material.color.g,b:draggables[i].material.color.b};
                    pointcloud.geometry.colorsNeedUpdate = true;
                }
            }
        }
    }

}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }
