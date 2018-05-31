/*Additional JS to assist none threejs component*/
const { styler, easing, tween} = popmotion;
var overrides = {'chance': 0}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class Player {
  constructor(element, minority, human, salary, name) {
    this.element = element;
    this.salary = salary;
    this.money = salary;
    this.strike = 0;
    // if in_trial is set to 2, that means the player is on trial, have to miss 2 turns
    this.in_trail = 0;
    // if in_prison is set to a positive integer, then the player must server turns in prison
    this.in_prison = 0;
    this.sentence_length = 0;
    this.minority = minority;
    this.override = undefined;
    // Probability of found innocent at trial
    this.innocent = 1.0/6.0;
    // Whether this is a computer managed character or user managed
    this.human = human;

    // Jail probability increment due to Alec policies
    this.p_increment = 0.0;

    // game event/chance this player experienced most recently
    this.activity = {};
    this.pname = name;
  }

  element(){
  	//element getter
  	return this.element;
  }

  getPaid(amount){
  	this.money += amount;
  }

  spendMoney(amount){
  	this.money -= amount;
  }

  sentenced(t){
  	this.sentence_length = t;
  }

  // argument p is the raw probability of going to jail
  jailProbability(p){
  	// return true meaning "go to jail"
  	return (Math.random() <= p + this.p_increment);
  }

  jailDecisionHelper(want_trial, turns){
  	if(want_trial){
		// go on trail
		this.in_trail = 2;
		if(Math.random() <= this.innocent){
			// 1/6 chance go free, not in prison
			this.in_prison = 0;
			this.activity.decision += 'Decided to go on trial, and found innocent.';
		}else{
			this.in_prison = turns;
			this.activity.decision += ('Decided to go on trial, and found guilty, go to prison for ' + turns + ' turns');
			this.strike++;
		}
	}else{
		this.in_prison = turns;
		this.activity.decision += ('Decided to NOT go on trail, go to prison for ' + turns + ' turns');
		this.strike++;
	}
  }

  jailDecision(turns){
  	if(this.human){
  		// If this is a human player, show some graphics
  		decisionUI.show();
  		decisionUI.showDecisionButton();
  		decisionUI.yesButton.onclick = () => {
  			this.jailDecisionHelper(true, turns); 
  			// show all player's decisions and their status
  			decisionUI.info();
  		};
  		decisionUI.noButton.onclick = () => {
  			this.jailDecisionHelper(false, turns);
  			decisionUI.info();
		};
  	}else{
  		// this is just our computer program, just do things
  		this.jailDecisionHelper(Math.random() <= 0.5, turns);
  	}
  }

  /*Roll a payday*/
  payday(ps){
  	ps.forEach((p) => {
  		p.activity = {};
	  	p.activity.type = 'payday';
	  	if(p.in_prison > 0 || p.in_trail > 0){
	  		//nothing, you don't get paid, rather, you lose $5
	  		p.money -= 5;
	  	}else{
	  		p.money += p.salary;
	  	}
  	});
  	
  	decisionUI.show();
	decisionUI.info();
  }

  /*Roll a event*/
  event(){
  	let event = gevent.getRandomEvent();
  	if(!event){
  		// No event left
  		return false;
  	}
  	event.effect(players);
  	return true;
  }

  /*Roll a chance*/
  chance(){
  	let c = chance.getRandomChance();
  	c.effect(this);
  }

  /*Should only be invoked on computer-players, not humans*/
  randomStep(){
  	return getRandomInt(5) + 1;
  }

}

class GEvent{
	constructor(){
		/*TODO: code up the events details and its effects on different players.
		this.events is an array of event dictionaries, each following the format below
		One example of a event dictionary is provided below: */
		this.events = [
			{	type: 'event',
				happened: false,
				name: 'The War on Drugs has been declared', 
				action: 'All players except Peter Panda have to pick up a chance card at the beginning of their next turn', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[0];
						// This is no decision to be made for this event
						p.activity.decision = '';
						if(p.minority){
							// at next turn, minority have to pick up a chance card
							/*TODO: the global variable overrides store a bunch
							of override types, add more!*/
							p.override = overrides.chance;
						}
					});
					// Don't forget to display the information to screen
					decisionUI.show();
					decisionUI.info();		
				};})(),
				detail: 'The War on Drugs, started in the Nixon era, disproportionately penalized communities of color. Black and Latino people got sent to prison more often and for longer sentences when it comes to drug related crimes. For instance, despite being the same substance, crack cocaine dealers were punished more heavily than powdered cocaine dealers. Crack cocaine is especially prevalent in poor communities of color due to its cheap price while powdered cocaine is prevalent in black communities.'
			}, 
		];
	}

	getRandomEvent(){
		// Just gets a random event
		let available_events = this.events.filter(ev => !ev.happened);
		if(available_events.length === 0){
			// No event left, TODO: end game?
			return null;
		}
		let idx = getRandomInt(available_events.length - 1);
		// This event is no longer available
		available_events[idx].happened = true;
		return available_events[idx];
	}
}

class Chance{

	constructor(){
		this.chances = [
			{
				type: 'chance',
				detail: 'You are stopped while driving to grocery store for speeding. You are charged a $20 ticket. If you are Mandy Monkey, Penelope Pig, or Zachary Zebra there is a 2 in 6 chance that policemen pick a fight and arrest you. You are charged with “resisting arrest” and must serve 1 turn.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[0];
					if(p.minority){
						if(p.jailProbability(2.0/6.0)){
							// arrested by police, decision time
							p.activity.decision = 'Got arrested => ';
							p.jailDecision(1);
						}else{
							p.spendMoney(20);
							p.activity.decision = 'Got a $20 fine';
						}
					}else{
						p.spendMoney(20);
						p.activity.decision = 'Got a $20 fine';
					}
					
					decisionUI.show();
					decisionUI.info();
				}})(),
			},
		];
	}

	getRandomChance(){
		// Just gets a random event
		let idx = getRandomInt(this.chances.length - 1);
		console.log(idx);
		return this.chances[idx];
	}
}

class DecisionUI{
	constructor(){
		this.players = [];
		this.element = null;
		this.yesButton = null;
		this.noButton = null;
		this.quads = [];
	}

	setupDOM(players, element, yb, nb, quad_class_name, h_c_n, c_c_n, d_c_n, context_board, toggleBtn='toggleBtn', scoreBoard='scoreBoard'){
		this.players = players;
		// element is the overall display board
		this.element = element;
		this.yesButton = yb;
		this.noButton = nb;
		this.quads = element.getElementsByClassName(quad_class_name);
		this.header_class_name = h_c_n;
		this.content_class_name = c_c_n;
		this.decision_class_name = d_c_n;
		this.context_board = document.getElementById(context_board);
		this.toggleBtn = toggleBtn;
		this.scoreBoard = scoreBoard;
	}

	info(){
		//loop through all players and display their status
		this.players.forEach((p, idx, arr) => {
			if(p.activity){
				if(p.activity.type === 'event'){
					this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Event: ' + p.activity.name;
					//TODO: Event detail is really long, how to display it so it doesn't look ugly?
					this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = p.activity.action;// + '<br>' + p.activity.detail;
					this.context_board.innerHTML = p.activity.detail;
					this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = p.activity.decision;
				}else if(p.activity.type === 'chance'){
					this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Chance: ';
					this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = p.activity.detail;
					this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = "Result: " + p.activity.decision;
				}else if(p.activity.type === 'payday'){
					// We are at a payday
					this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Payday: ';
					this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = 'You get paid!';
					this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = '';
				}else{
					this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Nothing happened';
					this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = '';
					this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = '';
				}
			}
			let sta = '$' + p.money + ', strikes: ' + p.strike;
			var p_sta = document.getElementById(this.scoreBoard).children[idx];
			if(p.human){
				sta += ' (you)';
				p_sta.style.backgroundColor= "white";
			}else{
				p_sta.style.backgroundColor= "transparent";
			}
			p_sta.getElementsByClassName('p_status')[0].innerHTML = sta;
			// clear the activity for next round
			p.activity = undefined;
		});
	}

	show(){
		// make element visible
		console.log("Called...1");
		this.element.style.visibility = "visible";
		let divStyler = styler(this.element);
		tween({
		  from: 0.0,
		  to: { opacity: 1.0 },
		  duration: 1000,
		  ease: easing.backOut,
		  //flip: Infinity,
		  // elapsed: 500,
		  // loop: 5,
		  // yoyo: 5
		}).start(divStyler.set);
		this.yesButton.style.visibility = "hidden";
		this.noButton.style.visibility = "hidden";
		let btn = document.getElementById(this.toggleBtn);
		if(btn){
			btn.innerHTML = 'x';
		}
	}

	showDecisionButton(){
		this.yesButton.style.visibility = "visible";
		this.noButton.style.visibility = "visible";
	}

	hide(){
		// hide element
		console.log("Called...2");
		let divStyler = styler(this.element);
		tween({
		  from: 1.0,
		  to: { opacity: 0.0 },
		  duration: 1000,
		  ease: easing.backOut,
		  //flip: Infinity,
		  // elapsed: 500,
		  // loop: 5,
		  // yoyo: 5
		}).start({update: divStyler.set, complete: ()=>this.element.style.visibility = "hidden"});
			
	}

	toggle(){
		if(this.element.style.visibility === "hidden"){
			this.show();
		}else{
			this.hide();
		}
	}
}

var decisionUI = new DecisionUI();
var chance = new Chance();
var gevent = new GEvent();
