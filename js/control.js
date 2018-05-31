// TODO: Hao: window resize will cause bug, postpone fixing because running out of time

// Hao: The dice starts with a resting state
var rest = true;
// Hao: dice rotation speed-multiple when tossed
var speed = 15;
// Hao: frames is the number of frames the spinning animation lasts
var frames = 160;
var toss = 0;
// This records how many step you can take
var steps = 0;
// This record the current state you are in
var state = 0;
// state of the computer generated players
var states = [state, 0, 0, 0];

var circs;

// The characters
var character1, character2, character3, character4;
var players;
var cur_player = 0;

var num_state;

var leftPanel = 0.3;
var diceHeight = 0.3;
var boardAdjust = 0.75;

// three.js vars
var camera, scene, renderer;
var mesh;

init();
animate();
initBoard();
createBoard();
decisionUI.setupDOM(players, document.getElementById('info'), 
	document.getElementById('yb'), document.getElementById('nb'),
	'quad', 'q_header', 'q_content', 'q_decision');

function initBoard(){
	circs = document.getElementsByClassName("circle");
	character1 = new Player(document.getElementById("character1"), false, true, 100);
	character2 = new Player(document.getElementById("character2"), true, false, 80);
	character3 = new Player(document.getElementById("character3"), true, false, 90);
	character4 = new Player(document.getElementById("character4"), true, false, 70);
	players = [character1, character2, character3, character4];
	num_state = circs.length;
}

function createBoard(){
	
	let board = document.getElementById("board");
	let c_x = board.clientWidth / 2.0;
	let c_y = board.clientHeight / 2.0;
	// The smallest one is used as radius
	let r = Math.min(c_x, c_y) * boardAdjust;
	c_y *= boardAdjust;
	let angleStep = Math.PI * 2 / circs.length;
	for(let i = 0; i < circs.length; i++){
		let x = Math.floor(c_x + Math.cos(angleStep * i) * r);
		let y = Math.floor(c_y - Math.sin(angleStep * i) * r)
		circs[i].style.left = x + 'px';
		circs[i].style.top = y + 'px';
		
		if(i === 0){
			// Set up character positions
			character1.element.style.left = circs[i].style.left;
			character1.element.style.top = circs[i].style.top;

			character2.element.style.left = (x + 50) + 'px';
			character2.element.style.top = y + 'px';

			character3.element.style.left = x + 'px';
			character3.element.style.top = (y + 50) + 'px';

			character4.element.style.left = (x + 50) + 'px';
			character4.element.style.top = (y + 50) + 'px';
		}
		
	}
	circs[state].style.backgroundColor = "orange";
}


function tossDice(){
	if(cur_player != 0){
		// the player is not human, should be handled by moveOthers()
		window.alert("It's the other players' turn, click next to see how they play!");
		return;
	}
	cur_player = (cur_player + 1) % 4;
	rest = false;
	toss = frames;
	document.getElementById('num_step').innerHTML = 'x';
}

function moveOthers(){
	if(cur_player === 0){
		// If human, shouldn't be handled by this function
		window.alert("It's your turn, please toss the dice!");
		return;
	}

	let step = players[cur_player].randomStep();

	states[cur_player] = (states[cur_player] + step) % num_state;

	console.log(step);

	let x = parseInt(circs[states[cur_player]].style.left.slice(0, -2))
	let y = parseInt(circs[states[cur_player]].style.top.slice(0, -2))

	if(cur_player === 1){
		x += 50;
	}else if(cur_player === 2){
		y += 50;
	}else{
		x += 50;
		y += 50;
	}

	players[cur_player].element.style.left = x + 'px';
	players[cur_player].element.style.top = y + 'px';

	//Game logic here:
	if(circs[states[cur_player]].innerHTML === 'Payday'){
		players[cur_player].payday();
	}else if(circs[states[cur_player]].innerHTML === 'Chance'){
		players[cur_player].chance();
	}else if(circs[states[cur_player]].innerHTML === 'Event'){
		let success = players[cur_player].event();
		if(!success){
			//TODO: signal Game has ended lead to a new interface
			// right now that interface is just a white board with text
			gameEnd();
		}
	}else{
		//blank spot, do nothing
	}

	cur_player = (cur_player + 1) % 4;
}

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth * leftPanel / (window.innerHeight * diceHeight), 1, 1000 );
	camera.position.z = 400;

	scene = new THREE.Scene();

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 1, 1 ).normalize();
	var lightAmb = new THREE.AmbientLight( 0x606060 ); // soft white light
	scene.add(light);
	scene.add(lightAmb);

	var textureLoader = new THREE.TextureLoader();
	var texture1 = textureLoader.load( './textures/f1.jpg' );
	var texture2 = textureLoader.load( './textures/f2.jpg' );
	var texture3 = textureLoader.load( './textures/f3.jpg' );
	var texture4 = textureLoader.load( './textures/f4.jpg' );
	var texture5 = textureLoader.load( './textures/f5.jpg' );
	var texture6 = textureLoader.load( './textures/f6.jpg' );

	var materials = [
	    new THREE.MeshPhongMaterial( { map: texture1 } ),
	    new THREE.MeshPhongMaterial( { map: texture2 } ),
	    new THREE.MeshPhongMaterial( { map: texture3 } ),
	    new THREE.MeshPhongMaterial( { map: texture4 } ),
	    new THREE.MeshPhongMaterial( { map: texture5 } ),
	    new THREE.MeshPhongMaterial( { map: texture6 } )
	];

	var geometry = new THREE.BoxBufferGeometry( 150, 150, 150 );

	mesh = new THREE.Mesh( geometry, materials );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth * leftPanel, window.innerHeight * diceHeight);
	document.getElementById('threejscanvas').appendChild( renderer.domElement );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
	createBoard();

	camera.aspect = (window.innerWidth * leftPanel) / (window.innerHeight * diceHeight);
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth * leftPanel, window.innerHeight * diceHeight );

}

function animate() {

	requestAnimationFrame( animate );
	if(rest){
		mesh.rotation.x += 0.005;
		mesh.rotation.y += 0.01;
	}else{
		if(toss > frames / 2){
			mesh.rotation.x += 0.005 * speed;
			mesh.rotation.y += 0.01 * speed;
			toss--;
		}else if(toss === frames / 2){
			let x_r = Math.floor(mesh.rotation.x / (Math.PI/2.0)) % 4;
			let y_r = Math.floor(mesh.rotation.y / (Math.PI/2.0)) % 4;
			if(x_r === 0){
				if(y_r === 0){
					steps = 5;
				}else if(y_r === 1){
					steps = 2;
				}else if(y_r === 2){
					steps = 6;
				}
				else if(y_r === 3){
					steps = 1;
				}
			}else if(x_r === 1){
				steps = 3;
			}else if(x_r === 2){
				if(y_r === 0){
					steps = 6;
				}else if(y_r === 1){
					steps = 1;
				}else if(y_r === 2){
					steps = 5;
				}
				else if(y_r === 3){
					steps = 2;
				}
			}else if(x_r === 3){
				steps = 4;
			}
			document.getElementById("num_step").innerHTML = steps;
			// Reset old state color to normal
			//circs[state].style.backgroundColor = "#3cb0fd";
			for(let s = 0; s <= steps; s++){
				let s_color = colorLint(orange, blue, 1.0 - s/steps);
				// Fade from some mix of blue & orange to just blue
				fade(circs[(state + s) % num_state], 'background-color', s_color, blue, 1000);
			}
			state = (state + steps) % num_state;
			// Move the character to current location
			character1.element.style.left = circs[state].style.left;
			character1.element.style.top = circs[state].style.top;

			//Game logic here:
			if(circs[state].innerHTML === 'Payday'){
				character1.payday();
			}else if(circs[state].innerHTML === 'Chance'){
				character1.chance();
			}else if(circs[state].innerHTML === 'Event'){
				let success = character1.event();
				if(!success){
					//TODO: signal Game has ended lead to a new interface
					// right now that interface is just a white board with text
					gameEnd();
				}
			}else{
				//blank spot, do nothing
			}

			// Set new state color to orange
			//circs[state].style.backgroundColor = "orange";
			mesh.rotation.x = x_r * Math.PI / 2.0;
			mesh.rotation.y = y_r * Math.PI / 2.0;
			toss--;
		}
		else if(toss > 0){
			toss--;
		}else{
			rest = true;
		}
	}
	
	renderer.render( scene, camera );

}

var orange = {r: 255, g: 165, b: 0};
var blue = {r: 60, g: 176, b: 253};

lerp = function(a, b, u) {
    return (1 - u) * a + u * b;
};

colorLint = function(start, end, p){
	var r = Math.round(lerp(start.r, end.r, p));
    var g = Math.round(lerp(start.g, end.g, p));
    var b = Math.round(lerp(start.b, end.b, p));
    return {r: r, g: g, b: b};
}

fade = function(element, property, start, end, duration) {
    var interval = 10;
    var steps = duration / interval;
    var step_u = 1.0 / steps;
    var u = 0.0;
    var theInterval = setInterval(function() {
        if (u >= 1.0) {
            clearInterval(theInterval);
        }
        let c_res = colorLint(start, end, u);
        var colorname = 'rgb(' + c_res.r + ',' + c_res.g + ',' + c_res.b + ')';
        //console.log("fading...");
        element.style.setProperty(property, colorname);
        u += step_u;
    }, interval);
};

gameEnd(){
	//TODO: maybe need to do something fancy here
	document.getElementById('postGame').style.display = "flex";
}