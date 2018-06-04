// TODO: Hao: window resize will cause bug, postpone fixing because running out of time
var not_simulating = true;
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

// The jail object, manages everything related to jail
var jail = {};

// The characters
var character1, character2, character3, character4, human, human_idx = 0;
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
	document.getElementsByClassName('yes')[0], document.getElementsByClassName('no')[0], document.getElementsByClassName('bail')[0],
	'quad', 'q_header', 'q_content', 'q_decision', 'resource');

function initBoard(){
	circs = document.getElementsByClassName("circle");
	jail.domElement = document.getElementById("jail");
	character1 = new Player(document.getElementById("character1"), false, true, 100, 'Peter Panda');
	character2 = new Player(document.getElementById("character2"), true, false, 80, 'Penelope Pig');
	character3 = new Player(document.getElementById("character3"), true, false, 90, 'Mandy Monkey');
	character4 = new Player(document.getElementById("character4"), true, false, 70, 'Zachary Zebra');
	players = [character1, character2, character3, character4];
	num_state = circs.length;
	// default player
	human = character1;
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
	// TODO: Get rid of magic numbers
	jail.c_x = c_x;
	jail.c_y = c_y;
	jail.domElement.style.left=(c_x - r+100) + 'px';
	jail.domElement.style.top=(c_y-r+100)+'px';
	jail.domElement.style.height=(2*r-100)+'px';
	jail.domElement.style.width=(2*r-100)+'px';
}

function playTurn(dice){
	if(dice && cur_player != human_idx){
		openModal("Wait!", "It's not your turn, click NEXT to see how others play!");
		return;
	}
	if(cur_player === human_idx) {
		tossDice();
	} else {
		moveOthers();
	}
	cur_player = (cur_player + 1) % 4;
	
	if (cur_player === human_idx) {
		document.getElementById('playButton').innerHTML = 'TOSS';
	} else {
		document.getElementById('playButton').innerHTML = 'NEXT';
	}

}

function disableActionButton(){
	let b = document.getElementById('playButton');
	b.classList.remove('btnpure');
	b.classList.add('btngray');

}

function enableActionButton(){
	let b = document.getElementById('playButton');
	b.classList.remove('btngray');
	b.classList.add('btnpure');
}

function waitingTrial(p){
	// TODO: what should a player do while waiting for trial
	openModal(p.pname + " is still waiting for trail...", "They can't move for this turn");
}

function inPrison(p){
	// TODO: what should a player do while in prison
	// openModal(p.pname + " is currently in prison...", "They can't move for this turn");
	p.lip();
}

function tossDice(){
	if(!rest){
		//Tossing in progress, don't allow clicking
		return;
	}

	// Player is in trial, cannot do anything
	if(players[cur_player].in_trial > 0){
  		players[cur_player].in_trial--;
  		waitingTrial(players[cur_player]);
  		return;
  	}

  	// Player is in prison, cannot do anything
  	if(players[cur_player].in_prison > 0){
  		players[cur_player].in_prison--;
  		inPrison(players[cur_player]);
  		displayQuadCard(cur_player);
  		return;
  	}

	document.getElementById("pop_up_card_resource").innerHTML = "";
	rest = false;
	disableActionButton();
	toss = frames;
	document.getElementById('num_step').innerHTML = 'x';
}

function simulate(){
	// No one is human this time
	human_idx = 5;
	not_simulating = false;
	var score_slots = document.getElementsByClassName('sim_score');
	var scores = [0, 0, 0, 0];

	for(let i=0; i<100; i++){
		while(playTurn()){}
		var idx = findWinner().idx;
		scores[idx] = scores[idx] + 1;
		score_slots[idx].innerHTML = scores[idx];
	}

	not_simulating = true;
}

function moveOthers(){
	if(!rest){
		//Tossing in progress, don't allow clicking
		return;
	}

	// Player is in trial, cannot do anything
	if(players[cur_player].in_trial > 0){
  		players[cur_player].in_trial--;
  		not_simulating && waitingTrial(players[cur_player]);
  		return;
  	}

  	// Player is in prison, cannot do anything
  	if(players[cur_player].in_prison > 0){
  		players[cur_player].in_prison--;
  		inPrison(players[cur_player]);
  		not_simulating && displayQuadCard(cur_player);
  		return;
  	}

	let step = players[cur_player].randomStep();

	states[cur_player] = (states[cur_player] + step) % num_state;

	console.log(step);

	let x = parseInt(circs[states[cur_player]].style.left.slice(0, -2))
	let y = parseInt(circs[states[cur_player]].style.top.slice(0, -2))

	if(cur_player === 1 || cur_player ===3){
		x +=50;
	}

	if(cur_player === 2 || cur_player === 3){
		y += 50;
	}

	players[cur_player].element.style.left = x + 'px';
	players[cur_player].element.style.top = y + 'px';

	//Game logic here:
	if(circs[states[cur_player]].innerHTML === 'Payday'){
		players[cur_player].payday(players);
	}else if(circs[states[cur_player]].innerHTML === 'Chance'){
		players[cur_player].chance();
	}else if(circs[states[cur_player]].innerHTML === 'Event'){
		let success = players[cur_player].event();
		if(!success){
			//TODO: signal Game has ended lead to a new interface
			// right now that interface is just a white board with text
			if(not_simulating){
				gameEnd();
			}else{
				return false;
			} 
		}
	}else{
		//blank spot, do nothing
	}

	not_simulating && displayQuadCard(cur_player);
	not_simulating && fade(decisionUI.quads[cur_player], 'background-color', trans_orange, trans_gray, 1000);

	return true;
}

function displayQuadCard(c, need_show) {
	if(need_show){
		decisionUI.show();
	}
	let c_p = c === undefined? cur_player : c;
	if(decisionUI.display_four){
		Array.from(decisionUI.quads).forEach((q) => {
			q.style.display = "flex";
		});
		// Don't do anything, displaying 4 boards instead
		return;
	}
	Array.from(decisionUI.quads).forEach((q, i) => {
		if(i != c_p){
			q.style.display = "none";		
		}else{
			q.style.display = "flex";
		}
	});
	/*If close button doesn't exist, add it! Add the close button*/
	if(decisionUI.quads[c_p].getElementsByClassName('closebtn').length === 0){
		let close = document.createElement("div");
		close.appendChild(document.createTextNode("x"));
		decisionUI.quads[c_p].appendChild(close);
		close.classList.add('btnpure');
		close.classList.add('closebtn');
		close.addEventListener('click', function(ev){
			decisionUI.quads[c_p].style.display = "none";
			decisionUI.hide();
		});
		close.style.right = "0px";
		close.style.top = "0px";
		close.style.position = "absolute";
	}
	// Deal with resource/context
	let pop_up_card_resource = document.getElementById("pop_up_card_resource");
	let resource_text = document.getElementById("resource").innerHTML;
	if (resource_text.length > 0) {
		pop_up_card_resource.style.display = "flex";
		pop_up_card_resource.innerHTML = "<div class=\"quad column\"> <h4>Historical Context</h4>" +  resource_text + "</div>";

		/*Attach close button*/
		pop_up_card_resource.firstChild.style.margin = "0px";
		let close = document.createElement("div");
		close.appendChild(document.createTextNode("x"));
		pop_up_card_resource.appendChild(close);
		close.classList.add('btnpure');
		close.addEventListener('click', function(ev){
			pop_up_card_resource.style.display = "none";
		});
		close.style.right = "0px";
		close.style.position = "absolute";

	} else {
		pop_up_card_resource.innerHTML = "";
	}
	document.getElementById("resource").innerHTML = "";		
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
				let original_color = parseColor( getStyle(circs[(state + s) % num_state], "backgroundColor") );
				let s_color = colorLint(black, original_color, 1.0 - s/steps);
				// Fade from some mix of blue & orange to just blue
				fade(circs[(state + s) % num_state], 'background-color', s_color, original_color, 2000);
			}
			state = (state + steps) % num_state;
			// Move the character to current location
			let x_bias=0, y_bias=0;
			if(human_idx === 1 || human_idx ===3){
				x_bias=50;
			}

			if(human_idx === 2 || human_idx === 3){
				y_bias = 50;
			}

			human.element.style.left = parseInt(circs[state].style.left.slice(0, -2)) + x_bias + 'px';
			human.element.style.top = parseInt(circs[state].style.top.slice(0, -2)) + y_bias + 'px';

			//Game logic here:
			setTimeout(function(){
				if(circs[state].innerHTML === 'Payday'){
					human.payday(players);
				}else if(circs[state].innerHTML === 'Chance'){
					human.chance();
				}else if(circs[state].innerHTML === 'Event'){
					let success = human.event();
					if(!success){
						//TODO: signal Game has ended lead to a new interface
						// right now that interface is just a white board with text
						gameEnd();
					}
				}else{
					//blank spot, do nothing
				}
				displayQuadCard(human_idx);
				fade(decisionUI.quads[human_idx], 'background-color', trans_orange, trans_gray, 1000);
			}, 800);

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
			enableActionButton();
		}
	}
	
	renderer.render( scene, camera );

}

var orange = {r: 255, g: 165, b: 0};
var black = {r: 0, g: 0, b: 0};
var blue = {r: 60, g: 176, b: 253};
var trans_gray = {r: 0, g: 0, b: 0, a: 0.85};
var trans_orange = {r: 255, g: 165, b: 0, a: 0.85};

lerp = function(a, b, u) {
    return (1 - u) * a + u * b;
};

colorLint = function(start, end, p){
	var r = Math.round(lerp(start.r, end.r, p));
    var g = Math.round(lerp(start.g, end.g, p));
    var b = Math.round(lerp(start.b, end.b, p));
    var a = 1.0;
    if(start.a && end.a) {a = lerp(start.a, end.a, p);}
    return {r: r, g: g, b: b, a: a};
}

/*Hao: get computed style, enable reading css in-file styles*/
function getStyle(el,styleProp)
{
    if (el.currentStyle)
        return el.currentStyle[styleProp];

    return document.defaultView.getComputedStyle(el,null)[styleProp];
}

/*Hao: Parse what ever css color format is and return a {r, g, b, a} dictionary*/
function parseColor(input) {
    if (input.substr(0,1)=="#") {
		var collen=(input.length-1)/3;
		var fact=[17,1,0.062272][collen-1];
		return {
		    r: Math.round(parseInt(input.substr(1,collen),16)*fact),
		    g: Math.round(parseInt(input.substr(1+collen,collen),16)*fact),
		    b: Math.round(parseInt(input.substr(1+2*collen,collen),16)*fact),
		    a: 1.0,
		};
    }
    else {
    	console.log("Hello ", input.split("("), " $$$ ", input);
    	let rgba = input.split("(")[1].split(")")[0].split(",").map(Math.round);

    	return {r: rgba[0], g: rgba[1], b: rgba[2], a: (rgba.length > 3 && rgba[3]) || 1.0  };
    }
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
        var colorname = 'rgba(' + c_res.r + ',' + c_res.g + ',' + c_res.b + ',' + (c_res.a || 1.0) + ')';
        //console.log("fading...");
        element.style.setProperty(property, colorname);
        u += step_u;
    }, interval);
};

function findWinner(){
	var maxMoney = 0;
	var winner;
	var winner_idx;
	players.forEach((p, i) => {
		if(p.money > maxMoney){
			maxMoney = p.money;
			winner = p;
			winner_idx = i;
		}
	});
	return {w: winner, idx: winner_idx};
}

function gameEnd(){
	var winner = findWinner().w;
	openModal('Game Ended!', "The winner is <span class='orangeBold'>" + winner.pname + "with $" + winner.money + "</span><br><br><b>BUT, you probably noticed something funny here!</b>", false, 'Find Out More')
	
	clickOkay = () => {
		//console.log("Okay button clicked...");
		document.getElementById('postGame').style.display = "flex";
	}
}

function selectPlayer(idx){
	human = players[idx];
	human_idx = idx;
	cur_player = idx;
	character1.human = false;
	players[idx].human = true;
	human.human = true;
	openModal("You selected: " + human.pname, "Your salary is $" + human.salary + " per payday");
	decisionUI.yesButton = document.getElementsByClassName('yes')[idx];
	decisionUI.noButton = document.getElementsByClassName('no')[idx];
	decisionUI.bailButton = document.getElementsByClassName('bail')[idx];
	decisionUI.info();
}

// Code purely for testing purposes
// ##################
//setTimeout(gameEnd, 2000);