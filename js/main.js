/*Additional JS to assist none threejs component*/
const { styler, easing, tween} = popmotion;
var overrides = {'chance': 1};
var three_strike = false;
var orange_span_s = "<span style='color: orange; font-weight: bold'>";
var orange_span_e = "</span>";

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
    this.in_trial = 0;
    // if in_prison is set to a positive integer, then the player must server turns in prison
    this.in_prison = 0;
    this.sentence_length = 0;
    // increment length of sentence due to Alec policies
    this.sentence_increment = 0;
    this.minority = minority;
    this.override = undefined;
    // Probability of found innocent at trial
    this.innocent = 1.0/6.0;
    // Whether this is a computer managed character or user managed
    this.human = human;

    // Jail probability increment due to Alec policies
    this.p_increment = 0.0;

    this.alec_investor = false;

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

  // argument p is the raw probability of going to jail
  jailProbability(p){
  	// return true meaning "go to jail"
  	return (Math.random() <= p + this.p_increment);
  }

  moveToJail(){
  	let x = jail.c_x;
  	let y = jail.c_y;
  	let idx = players.indexOf(this);

  	if(idx === 1 || idx ===3){
		x +=50;
	}

	if(idx === 2 || idx === 3){
		y += 50;
	}
  	this.element.style.left = x + 'px';
  	this.element.style.top = y + 'px';
  	/*TODO: add some cool animation here!*/
  }

  jailDecisionHelper(want_trial, turns, self){
  	//console.log(self);
  	if(want_trial){
		// go on trial
		self.in_trial = 2;
		if(Math.random() <= self.innocent){
			// 1/6 chance go free, not in prison
			self.in_prison = 0;
			self.activity.decision += (orange_span_s + 'You decided to go on trial, and found innocent. &#x1F60F;' + orange_span_e);
		}else{
			self.in_prison = turns;
			self.activity.decision += (orange_span_s + 'You decided to go on trial, and found guilty, go to prison for ' + turns + ' turns &#x1F62D;' + orange_span_e);
			self.strike++;
			self.moveToJail();
			if(three_strike && self.strike === 3){
				// life sentence, put in prison forever
				self.in_prison = Number.MAX_SAFE_INTEGER;
				self.activity.decision += ("<br>" + orange_span_s + "BUT because " + self.pname + " had 3 strikes, he/she is put away forever &#x1F62D;" + orange_span_e);
				self.moveToJail();
			}
		}
	}else{
		// Took a Plea deal
		self.in_prison = Math.ceil(turns / 2.0);
		self.activity.decision += (orange_span_s + 'You decided to NOT go on trial, go to prison for ' + turns + ' turns &#x1F62D;' + orange_span_e);
		self.strike++;
		self.moveToJail();
		if(three_strike && self.strike === 3){
			self.in_prison = Number.MAX_SAFE_INTEGER;
			self.activity.decision += ("<br>" + orange_span_s + "BUT because " + self.pname + " had 3 strikes, he/she is put away forever &#x1F62D;" + orange_span_e);
			self.moveToJail();
		}
	}
  }

  jailDecision(turns){
  	turns = turns + this.sentence_increment;
  	if(this.human){
  		// If this is a human player, show some graphics
  		decisionUI.show();
  		decisionUI.info(this);
  		console.log("Show button...");
  		decisionUI.showDecisionButton("Go on trial", "Take plea deal", "Pay $400 Bail");
  		var self = this;
  		decisionUI.yesButton.onclick = (() => { 
  			return function(){
	  			self.jailDecisionHelper(true, turns, self); 
	  			// show all player's decisions and their status
	  			decisionUI.info(self);
	  			decisionUI.hideDecisionButton();
  			}
  		})();
  		decisionUI.noButton.onclick = (() => { 
  			return function(){
	  			self.jailDecisionHelper(false, turns, self); 
	  			// show all player's decisions and their status
	  			decisionUI.info(self);
	  			decisionUI.hideDecisionButton();
  			}
  		})();
  		decisionUI.bailButton.onclick = (() => { 
  			return function(){
	  			if(self.money >= 400){
	  				self.activity.decision += (orange_span_s + 'You decided to pay bail, Lose $400' + orange_span_e);
	  				decisionUI.hideDecisionButton();
	  			}else{
	  				openModal("Don't have enough money!", "Oops, guess you can't afford paying bail.");
	  			}
	  			// show all player's decisions and their status
	  			decisionUI.info(self);
	  			
  			}
  		})();
  	}else{
  		// Computer Generated characters will default to choose bail if they have enough money
  		if(this.money >= 400){
			this.activity.decision += (orange_span_s + 'You decided to pay bail, Lose $400' + orange_span_e);
		}else{
	  		// this is just our computer program, just do things
	  		this.jailDecisionHelper(Math.random() <= 0.5, turns, this);
  		}
  		decisionUI.info(this);
  	}
  }

  /*Roll a payday*/
  payday(ps){
  	if(this.in_trial > 0){
  		this.in_trial--;
  		return;
  	}

  	if(this.in_prison > 0){
  		this.in_prison--;
  		return;
  	}

  	if(this.override === overrides.chance){
  		// If chance card must be picked up, pick up chance
  		this.override = undefined;
  		this.chance();
  	}

  	ps.forEach((p) => {
  		p.activity = {};
	  	p.activity.type = 'payday';
	  	if(p.in_prison > 0 || p.in_trial > 0){
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
  	if(this.in_trial > 0){
  		this.in_trial--;
  		return;
  	}

  	if(this.in_prison > 0){
  		this.in_prison--;
  		return;
  	}

  	if(this.override === overrides.chance){
  		// If chance card must be picked up, pick up chance
  		this.override = undefined;
  		this.chance();
  	}

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
  	if(this.in_trial > 0){
  		this.in_trial--;
  		return;
  	}

  	if(this.in_prison > 0){
  		this.in_prison--;
  		return;
  	}
  	let c = chance.getRandomChance();
  	c.effect(this);
  }

  /*Life in prison*/
  lip(){
  	let l = lifeInPrison.getRandomPrisonCard();
  	l.effect(this);
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
				detail: 'The War on Drugs, started in the Nixon era, disproportionately penalized communities of color. Black and Latino people got sent to prison more often and for longer sentences when it comes to drug related crimes. For instance, despite being the same substance, crack cocaine dealers were punished more heavily than powdered cocaine dealers. Crack cocaine is especially prevalent in poor communities of color due to its cheap price while powdered cocaine is prevalent in black communities.',
				link: 'https://www.forbes.com/sites/eriksherman/2016/03/23/nixons-drug-war-an-excuse-to-lock-up-blacks-and-protesters-continues/#44a70cd942c8'
			}, 

			{	type: 'event',
				happened: false,
				name: 'ALEC Policy', 
				action: 'A few horrific high profile crimes happen. In response, lawmakers pass a “3 Strikes You’re Out” policy. According to this policy, if you have commited 3 crimes, you will be sentenced to life in prison. From now on, if any player has to go to prison and they have been to prison two times already, they will need to stay in prison for the rest of the game.', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[1];
						// This is no decision to be made for this event
						p.activity.decision = '';
						if(p.alec_investor){
							p.money += 100;
						}
						/*TODO: implement three strikes */
						three_strike = true;
					});
					// Don't forget to display the information to screen
					decisionUI.show();
					decisionUI.info();		
				};})(),
				detail: 'One of the cases the sparked the Three-strikes law was the murder of Polly Klaas, a 12 year-old girl who was kidnapped from her home. The Three-strikes law was passed under the Clinton administration in 1994. This law served to drastically increase the punishment for crimes. According to this law, a person who has committed a violent crime plus two other felonies would serve a mandatory life sentence in prison.',
				link: 'https://www.aclu.org/other/10-reasons-oppose-3-strikes-youre-out'
			}, 

			{	type: 'event',
				happened: false,
				name: 'A new bill has passed', 
				action: 'A recent crime bill increases funding for prisons and police force as well as militarized the police force. Due to this bill, the chances you go to jail for all players except Peter Panda is increased by 1 in 6 (for “Chance” cards pertaining to jail).', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[2];
						// This is no decision to be made for this event
						p.activity.decision = '';
						if(p.minority){
							p.p_increment += (1.0/6.0);
						}
					});
					// Don't forget to display the information to screen
					decisionUI.show();
					decisionUI.info();		
				};})(),
				detail: 'The 1994 Crime Bill, officially known as the Violent Crime Control and Law Enforcement Act was a lengthy crime control bill that was put together over the course of six years and signed into law by President Bill Clinton. It created a new “three strikes” mandatory life sentence for repeat offenders, money to hire 100,000 new police officers, $9.7bn in funding for prisons, and an expansion of death penalty-eligible offences. It also dedicated $6.1bn to prevention programmes "designed with significant input from experienced police officers", however, the bulk of the funds were dedicated to measures that are seen as punitive rather than rehabilitative or preventative. Ultimately, it lead to an exponential increase in the prison population.',
				link: 'http://www.bbc.com/news/world-us-canada-36020717'
			}, 

			{	type: 'event',
				happened: false,
				name: 'ALEC Policy', 
				action: 'A private prison company wants to build a new prison in your district. Experts predict that this would actually be more costly to taxpayers, but the government agrees to the contract. Each player pays $10 to fund the new prison. All players except for Peter Panda must pick up a Chance card at the beginning of their next turn.', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[3];
						// This is no decision to be made for this event
						p.activity.decision = '';

						if(p.alec_investor) {
							p.money += 100;
						}
						p.money -= 10;
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
				detail: 'Private prisons often stress that they are saving taxpayer dollars, but in truth they are often more costly in many ways. For one, they are costly to build. Furthermore, in order to increase profits, they cut costs by hiring less staff with less experience and cutting medical and other treatments. This often leads to expensive lawsuits due to the lack of medical care, safety incidents, and altercations with staff. In fact, it has been shown that assaults on staff in private prisons are about double those of assaults of staff in public facilities, despite private prisons only selecting to incarcerate inmates they deem “docile.” However, private prisons are still popular alternatives to building state and federal prisons, despite these flaws and findings that private prisons are not actually shown to increase public safety.',
				link: 'http://www.justicepolicy.org/uploads/justicepolicy/documents/gaming_the_system.pdf'
			},

			{	type: 'event',
				happened: false,
				name: 'ALEC Policy', 
				action: 'ALEC collaborated with the Corrections Corporation of America (CCA) to build privatized local prisons and is incentivizing local governments to keep them full. The chances you go to jail is increased by 1 in 6 (for “Chance” cards pertaining to jail) for all players except Peter Panda.', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[4];
						// This is no decision to be made for this event
						p.activity.decision = '';
						if(p.alec_investor){
							p.money += 100;
						}
						if(p.minority){
							p.p_increment += (1.0/6.0);
						}
					});
					// Don't forget to display the information to screen
					decisionUI.show();
					decisionUI.info();		
				};})(),
				detail: 'In many states, states are contractually obligated to fill prison beds. In fact, most contracts require that at least 90% of prison beds are filled. This strongly incentivizes local governments to place and keep people in jail. In particular, people of color are more strongly targeted and imprisoned to fill these quotas.',
				link: 'https://www.huffingtonpost.com/2013/09/19/private-prison-quotas_n_3953483.html'
			},

			{	type: 'event',
				happened: false,
				name: 'ALEC Policy', 
				action: 'To Make America Great Again, the government increased targeting of specific animals and putting them into prison for petty crimes like idling or homelessness. This keeps private prisons full and profiting. If you are not Peter Panda, from now on, you will be charged with adding an extra turn to your sentence.', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[5];
						// This is no decision to be made for this event
						p.activity.decision = '';
						if(p.alec_investor){
							p.money += 100;
						}
						if(p.minority){
							p.sentence_increment += 1;
						}
					});
					// Don't forget to display the information to screen
					decisionUI.show();
					decisionUI.info();		
				};})(),
				detail: 'After the end of the Civil War and the abolishing of slavery, the South’s economy was left in dire condition. Tensions rose between the North and the South, and the peace that was just achieved was under threat. To help the South revive their economy, the government started putting recently-freed black slaves into prison for petty crimes like idling or homelessness, so that they could serve as free labor in prison due to the loophole in the 13th amendment. That loophole is as follows: “Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States, or any place subject to their jurisdiction.”',
				link: 'https://www.npr.org/templates/story/story.php?storyId=89051115'
			},

			// TODO: WANT THIS EVENT TO ALWAYS BE FIRST
			{	type: 'event',
				happened: false,
				name: 'The American Legislative Exchange Council (ALEC) has started', 
				action: 'You have a chance to invest! If you want to invest in ALEC you will get $100 for every policy that ALEC passes.', 
				effect: (() => {var self=this; return function(ps){
					decisionUI.show();
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[6];
						// This is no decision to be made for this event
						p.activity.decision = 'Do you want to invest in ALEC?<br>';

						if(p.human){
							decisionUI.showDecisionButton("Yes", "No");
							decisionUI.info();
							decisionUI.yesButton.onclick = (() => {
								var pp = p;
					  			return function(){
						  			pp.alec_investor = true;
						  			pp.activity.decision += ( orange_span_s + 'Yes!' + orange_span_e);
						  			// show all player's decisions and their status
						  			decisionUI.info();
						  			decisionUI.hideDecisionButton();
					  			}
					  		})();
					  		decisionUI.noButton.onclick = (() => {
					  			var pp = p; 
					  			return function(){
						  			pp.activity.decision += ( orange_span_s + 'No!' + orange_span_e);
						  			// show all player's decisions and their status
						  			decisionUI.info();
						  			decisionUI.hideDecisionButton();
					  			}
					  		})();
					  	}else{
					  		if(getRandomInt(5) < 3){
					  			p.alec_investor = true;
					  			p.activity.decision += (orange_span_s + 'Yes!' + orange_span_e);
					  		}else{
					  			p.activity.decision += (orange_span_s + 'No!' + orange_span_e);
					  		}
					  		decisionUI.info();
					  	}

					});
					// Don't forget to display the information to screen	
				};})(),
				detail: 'ALEC is an organization that connects companies with politicians to make right-wing policies. Some of their largest backers include CCA (Corrections Corporation of America), who are in the business of private prisons and profit heavily off of keeping people incarcerated. ALEC drafts builds on a variety of conservative topics, making it easier for lawmakers around the country to personalize the exact bill to pass in their respective districts.',
				link: 'https://www.thenation.com/article/hidden-history-alec-and-prison-labor/'
			},

			{	type: 'event',
				happened: false,
				name: 'ALEC Policy', 
				action: 'After noticing an increase in recent crime rates, the president wants to adhere more strongly to “Law and Order,” and doubles federal spending on law enforcement. Peter Panda is unaffected by this, but each of the other players need to pick up a chance card at the beginning of their next turn.', 
				effect: (() => {var self=this; return function(ps){
					ps.forEach((p) => {
						// store what activity this player is experiencing
						p.activity = self.events[7];
						// This is no decision to be made for this event
						p.activity.decision = '';

						if(p.alec_investor) {
							p.money += 100;
						}
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
				detail: 'Beginning in the 1960s, the United States faced a surge in criminal violence: Across the decade, the murder rate rose by 44 percent, and per capita rates of forcible rape and robbery more than doubled. Nixon knew he had to address this problem - in a diary entry from 1969, White House chief of staff H.R. Haldeman paraphrased Nixon’s thinking: “You have to face the fact that the whole problem is really the blacks. The key is to devise a system that recognizes this while not appearing to.” During the campaign Nixon’s team tackled this challenge by adopting a strategy of “law and order”—by playing to racist fears, they could cloak divisive rhetoric in an unobjectionable demand for security during a chaotic era.',
				link: 'https://longreads.com/2017/04/06/the-bitter-history-of-law-and-order-in-america/'
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

		// if first event, return ALEC voting
		if(available_events.length === 8){
			available_events[6].happened = true
			return available_events[6]
		}

		let idx = getRandomInt(available_events.length - 1);
		// This event is no longer available
		available_events[idx].happened = true;
		
		return available_events[idx];
	}
}

class LifeInPrison{
	constructor(){
		/*TODO: code up the events details and its effects on different players.
		this.events is an array of event dictionaries, each following the format below
		One example of a event dictionary is provided below: */
		this.prisonCards = [
			{	type: 'prison',
				name: 'The prison you are in requires you to work.', 
				action: 'You spend your entire day in prison making products that you recognize from popular brands. In payment for your day of work, you earn $1. You count yourself as pretty lucky - although you’ve heard stories of some people being paid up to $1.75 for their labor in prison, you know that it is far more common for prisoners to earn much less, if anything.', 
				effect: (() => {var self=this; return function(p){
					// store what activity this player is experiencing
					p.activity = self.prisonCards[0];
					decisionUI.show();
					
					p.money += 1;
					
					decisionUI.info(p);
				}})(),
				detail: 'Once cleared by the prison doctor, Inmates at Angola Prison, Louisiana can be forced to work under threat of punishment as severe as solitary confinement. Legally, this labor may be totally uncompensated; more typically inmates are paid meagerly—as little as two cents per hour—for their full-time work in the fields, manufacturing warehouses, or kitchens.  Due to a loophole in the 13th amendment, incarcerated persons or, more specifically, the “duly convicted,” lack a constitutional right to be free of forced servitude. Further, this forced labor is not checked by many of the protections enjoyed by workers laboring in the exact same jobs on the other side of the 20-foot barbed-wire electric fence.',
				link: 'https://www.theatlantic.com/business/archive/2015/09/prison-labor-in-america/406177/'
			}, 

			{	type: 'prison',
				name: 'You get sick.', 
				action: 'You begin to feel sick after spending a significant amount of time in close proximity to other inmates who have all been sick recently. Unfortunately, in order to maximize profits, the private prison in which you are incarcerated has cut many medical treatments and services available to you. You put up with your sickness, knowing that treatment is readily and easily available at any pharmacy outside of the prison.', 
				effect: (() => {var self=this; return function(p){
					// store what activity this player is experiencing
					p.activity = self.prisonCards[1];
					decisionUI.show();
					
					decisionUI.info(p);
				}})(),
				detail: 'Under the Eighth Amendment directive against cruel and unusual punishment, prisoners are guaranteed adequate health care. But managing prisoners’ health care is difficult. Infectious disease, mental illness and addiction are common problems for inmates, according to the Center for Prisoner Health and Human Rights. Furthermore, a January report by Human Rights Watch detailed the growing number of aging inmates, who incur costs that are nine times as high as those for younger inmates.',
				link: 'https://www.washingtonpost.com/national/health-science/privatized-prison-health-care-scrutinized/2012/07/21/gJQAgsp70W_story.html?noredirect=on&utm_term=.1ffce9b97c5c'
			}, 

			{	type: 'prison',
				name: 'You get into trouble in prison.', 
				action: 'One of the staff at the private prison where you are starts an altercation with a group of inmates as you look on. After breaking up the altercation, another staff member unjustly blames you for the incident and puts you in solitary confinement.', 
				effect: (() => {var self=this; return function(p){
					// store what activity this player is experiencing
					p.activity = self.prisonCards[2];
					decisionUI.show();
					
					decisionUI.info(p);
				}})(),
				detail: 'In an effort to cut costs and maximize profits, many private prisons hire unqualified and inexperienced staff members and don’t give them adequate training. This has led to an increased likelihood of conflicts between staff and inmates. In fact, assaults on staff in private prisons are about 2x that of assaults on staff in public facilities, despite the fact that private prisons can choose who they incarcerate and often only select prisoners that they deem "docile."',
				link: 'http://www.justicepolicy.org/uploads/justicepolicy/documents/gaming_the_system.pdf'
			}, 

			{	type: 'prison',
				name: 'The prison you are in requires you to work.', 
				action: 'You spend your entire day in prison making products that you recognize from popular brands that you recognize. In payment for your day of work, you earn $0.5. You understand that this is pretty typical - although you’ve heard stories of some people being paid up to $1.75 for their labor in prison, you know that it is far more common for prisoners to earn much less, if anything.', 
				effect: (() => {var self=this; return function(p){
					// store what activity this player is experiencing
					p.activity = self.prisonCards[3];
					decisionUI.show();

					p.money += 0.5
					
					decisionUI.info(p);
				}})(),
				detail: 'Once cleared by the prison doctor, Inmates at Angola Prison, Louisiana can be forced to work under threat of punishment as severe as solitary confinement. Legally, this labor may be totally uncompensated; more typically inmates are paid meagerly—as little as two cents per hour—for their full-time work in the fields, manufacturing warehouses, or kitchens.  Due to a loophole in the 13th amendment, incarcerated persons or, more specifically, the “duly convicted,” lack a constitutional right to be free of forced servitude. Further, this forced labor is not checked by many of the protections enjoyed by workers laboring in the exact same jobs on the other side of the 20-foot barbed-wire electric fence.',
				link: 'https://www.theatlantic.com/business/archive/2015/09/prison-labor-in-america/406177/'
			}, 

			{	type: 'prison',
				name: 'The prison you are in requires you to work.', 
				action: 'You spend your entire day in prison making products that you recognize from popular brands that you recognize. Despite all the time you spent working, you aren’t paid. You aren’t surprised - although you’ve heard stories of some people being paid up to $1.75 for their labor in prison, you know that it is far more common for prisoners to earn much less than that, if anything.', 
				effect: (() => {var self=this; return function(p){
					// store what activity this player is experiencing
					p.activity = self.prisonCards[4];
					decisionUI.show();

					p.money += 0.5
					
					decisionUI.info(p);
				}})(),
				detail: 'Once cleared by the prison doctor, Inmates at Angola Prison, Louisiana can be forced to work under threat of punishment as severe as solitary confinement. Legally, this labor may be totally uncompensated; more typically inmates are paid meagerly—as little as two cents per hour—for their full-time work in the fields, manufacturing warehouses, or kitchens.  Due to a loophole in the 13th amendment, incarcerated persons or, more specifically, the “duly convicted,” lack a constitutional right to be free of forced servitude. Further, this forced labor is not checked by many of the protections enjoyed by workers laboring in the exact same jobs on the other side of the 20-foot barbed-wire electric fence.',
				link: 'https://www.theatlantic.com/business/archive/2015/09/prison-labor-in-america/406177/'
			}, 

		];
	}

	getRandomPrisonCard(){
		// Just gets a random event
		let idx = getRandomInt(this.prisonCards.length - 1);
		return this.prisonCards[idx];
	}
}

class Chance{

	// TODO: for chance, you want the other players to display nothing on their view
	constructor(){
		this.chances = [
			{
				type: 'chance',
				detail: 'You are stopped while driving to grocery store for speeding. You are charged a $20 ticket. If you are Mandy Monkey, Penelope Pig, or Zachary Zebra there is a 2 in 6 chance that policemen pick a fight and arrest you. You are charged with “resisting arrest” and must serve 1 turn.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[0];
					decisionUI.show();
					if(p.minority){
						if(p.jailProbability(2.0/6.0)){
							// arrested by police, decision time
							p.activity.decision = 'You got arrested! <br>';
							p.jailDecision(1);
						}else{
							p.spendMoney(20);
							p.activity.decision = 'Got a $20 fine';
							decisionUI.info(p);
						}
					}else{
						p.spendMoney(20);
						p.activity.decision = 'Got a $20 fine';
						decisionUI.info(p);
					}
					
				}})(),
			},

			{
				type: 'chance',
				detail: 'You are buying drugs. If you are Peter Panda, there is a 1 in 6 chance that you will get caught. If caught, you will serve 1 turn in jail. Otherwise, you have a 3 in 6 chance of getting caught and would serve 2 turns.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[1];
					decisionUI.show();
					if(p.minority){
						if(p.jailProbability(3.0/6.0)){
							// arrested by police, decision time
							p.activity.decision = 'You got arrested! <br>';
							p.jailDecision(2);
						} else {
							p.activity.decision = 'Lucky you! You did not get caught!'
							decisionUI.info(p);
						}
					}else{
						if(p.jailProbability(1.0/6.0)){
							p.activity.decision = 'You got arrested! <br>';
							p.jailDecision(2);
						} else {
							p.activity.decision = 'Lucky you! You did not get caught!'
							decisionUI.info(p);
						}
					}
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You get into an altercation at home and the police are called over due to a noise complaint. If you are with Peter Panda, you are charged a $100 fine. Otherwise, you have a 4 in 6 chance of paying a $200 fine and serving 1 turn in jail.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[2];
					if(p.minority){
						if(p.jailProbability(4.0/6.0)){
							// arrested by police, decision time
							p.activity.decision = 'You must pay a $200 fine and got arrested => ';
							p.spendMoney(200);
							p.jailDecision(1);
						} else {
							p.activity.decision = 'Lucky you! You did not get caught!'
						}
					}else{
						p.spendMoney(100);
						p.activity.decision = 'Got a $100 fine.'
					}
					
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You apply for a Pell Grant to go to college. If you have no strikes on your criminal record, you receive the Pell Grant and go back to school. After becoming a college graduate, your salary increases by $20. If you do have a strike on your criminal record, you are not eligible to receive the Pell Grant.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[3];
					if(p.strike == 0) {
						p.salary += 20;
						p.activity.decision = 'You got the grant! Your salary in now increased to $' + p.salary;
					} else {
						p.activity.decision = 'Due to the strike on your criminal record, you do not get the grant.'
					}
					
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'During a rough period in your life, you resort to selling drugs. If you are Peter Panda, there is a 1 in 6 chance that you will be caught. If caught, you are charged to serve for 1 turn. Otherwise, there is a 4 in 6 chance that you will be caught and charged to serve for 3 turns.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[4];
					if(p.minority) {
						if(p.jailProbability(4.0/6)) {
							p.activity.decision = 'You got arrested! <br>'
							p.jailDecision(3)
						} else {
							p.activity.decision = 'You got away with it!'
						}
					} else {
						if(p.jailProbability(1.0/6)) {
							p.activity.decision = 'You got arrested! <br>'
							p.jailDecision(1)
						} else {
							p.activity.decision = 'You got away with it!'
						}
					}
					
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You are behind on a $50 payment. If you can’t pay it now, serve one turn in prison.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[5];
					if(p.money >= 50) {
						p.activity.decision = 'You must pay $50.';
						p.spendMoney(50);
					} else {
						p.activity.decision = 'You got arrested! <br>';
						p.jailDecision(1);
					}
					
					decisionUI.info(p);
				}})(),
			},

			// {
			// 	type: 'chance',
			// 	detail: 'You made a bad investment. Lose $100.',
			// 	effect: (() => {var self=this; return function(p){
			// 		decisionUI.show();
			// 		// store what activity this player is experiencing
			// 		p.activity = self.chances[6];
			// 		p.activity.decision = 'You lose $100.';
			// 		p.spendMoney(100);
					
			// 		decisionUI.info(p);
			// 	}})(),
			// },

			// {
			// 	type: 'chance',
			// 	detail: 'Your boss has given you a raise! Increase your salary by $20.',
			// 	effect: (() => {var self=this; return function(p){
			// 		decisionUI.show();
			// 		// store what activity this player is experiencing
			// 		p.activity = self.chances[7];
			// 		p.salary += 20
			// 		p.activity.decision = 'Your salary has now increased to $' + p.salary;
					
			// 		decisionUI.info(p);
			// 	}})(),
			// },

			// {
			// 	type: 'chance',
			// 	detail: 'You’ve been doing great at work and earned a bonus equal to your current salary.',
			// 	effect: (() => {var self=this; return function(p){
			// 		decisionUI.show();
			// 		// store what activity this player is experiencing
			// 		p.activity = self.chances[8];
			// 		p.money += p.salary
			// 		p.activity.decision = 'You just got a bonus of $' + p.salary;
					
			// 		decisionUI.info(p);
			// 	}})(),
			// },

			// {
			// 	type: 'chance',
			// 	detail: 'You made a great investment and earned $50.',
			// 	effect: (() => {var self=this; return function(p){
			// 		decisionUI.show();
			// 		// store what activity this player is experiencing
			// 		p.activity = self.chances[9];
			// 		p.activity.decision = 'You earned $50.';
			// 		p.money += 50;
					
			// 		decisionUI.info(p);
			// 	}})(),
			// },

			{
				type: 'chance',
				detail: 'Your boss does a surprise background check. If she finds that you have a criminal record, you are fired and the only job you can find has a salary that is half of your current salary.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[6];
					if(p.strike == 0) {
						p.activity.decision = 'Your boss does not find anything on your record.'
					} else {
						p.salary /= 2.;
						p.activity.decision = 'Due to the strike(s) on your criminal record, you now have a salary of $' + p.salary;
					}
					
					decisionUI.show();
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You have an accident and must go to the hospital. If you have a criminal record, this means that unfortunately you do not have Medicaid. Lose $200 to pay for the medical bill.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[7];
					if(p.strike == 0) {
						p.activity.decision = 'Medicaid covers your hospital bill.'
					} else {
						p.spendMoney(200);
						p.activity.decision = 'Due to the strike(s) on your criminal record, lose $200.';
					}
					
					decisionUI.show();
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You need to find an apartment. If you have a criminal record, you are do not qualify for public housing. Lose $100 to pay for your more expensive apartment.',
				effect: (() => {var self=this; return function(p){
					
					// store what activity this player is experiencing
					p.activity = self.chances[8];
					if(p.strike == 0) {
						p.activity.decision = 'You have public housing. You don\'t lose any money'
					} else {
						p.spendMoney(100);
						p.activity.decision = 'Due to the strike(s) on your criminal record, lose $100.';
					}
					
					decisionUI.show();
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'Trisha Meili was running in central park when she was attacked and raped. Despite your DNA not matching the DNA from the crime scene, the public strongly believes that you were involved in the attack. If you are not Peter Panda, you must go straight to jail and serve 2 turns.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[9];
					if(p.minority) {
						p.activity.decision = 'You got arrested! <br>';
						p.jailDecision(2);
					} else {
						p.activity.decision = "You are not a suspect. Nothing happens to you."
					}
					
					decisionUI.info(p);
				}})(),
			},

			{
				type: 'chance',
				detail: 'You are sitting in a coffee house waiting for a friend. The store owner is upset at you for staying in the coffee house despite not buying anything. If you are  Mandy Monkey, Penelope Pig, or Zachary Zebra, you have a 1 in 6 chance of the owner calling the police on you. The police arrest you for declining to leave the premises and you must serve 1 turn.',
				effect: (() => {var self=this; return function(p){
					decisionUI.show();
					// store what activity this player is experiencing
					p.activity = self.chances[10];
					if(p.minority) {
						if(p.jailProbability(4.0/6.0)){
							p.activity.decision = 'You got arrested! <br>';
							p.jailDecision(1);
						} else {
							p.activity.decision = "Nothing happens to you."
						}
					} else {
						p.activity.decision = "Nothing happens to you."
					}
					
					decisionUI.info(p);
				}})(),
			},


		];
	}

	getRandomChance(){
		// Just gets a random event
		let idx = getRandomInt(this.chances.length - 1);
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
		this.in_animation = false;
		this.display_four = false;
	}

	setupDOM(players, element, yb, nb, bb, quad_class_name, h_c_n, c_c_n, d_c_n, context_board, toggleBtn='toggleBtn', scoreBoard='scoreBoard'){
		this.players = players;
		// element is the overall display board
		this.element = element;
		this.yesButton = yb;
		this.noButton = nb;
		this.bailButton = bb;
		this.quads = element.getElementsByClassName(quad_class_name);
		this.header_class_name = h_c_n;
		this.content_class_name = c_c_n;
		this.decision_class_name = d_c_n;
		this.context_board = document.getElementById(context_board);
		this.toggleBtn = toggleBtn;
		this.scoreBoard = scoreBoard;
	}

	getInfo(idx){
		return {
			header: this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML,
			content: this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML,
			decision: this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML,
		};
	}

	getContextBoard(idx){
		return this.context_board.innerHTML;
	}

	info(ext_p){

		//loop through all players and display their status
		this.players.forEach((p, idx, arr) => {

			if(ext_p && ext_p != p){
				//Do nothing
			}else{
				if(p.activity){
					if(p.activity.type === 'event'){
						this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Event: ' + p.activity.name;
						//TODO: Event detail is really long, how to display it so it doesn't look ugly?
						this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = p.activity.action;// + '<br>' + p.activity.detail;
						this.context_board.innerHTML = p.activity.detail;
						this.context_board.innerHTML +=" <br><div class=\"btnpure\" onClick=\"window.open('" + p.activity.link + "','_blank');\">Learn More<\/div>";
						this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = p.activity.decision;
					}else if(p.activity.type === 'chance'){
						this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Chance: ';
						this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = p.activity.detail;
						this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = "<span class='orangeBold'>Result:</span> " + p.activity.decision;
					}else if(p.activity.type === 'payday'){
						// We are at a payday
						this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Payday: ';
						this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = 'Getting paid!';
						this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = '';
					}else if(p.activity.type === 'prison'){
						this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Life in Prison: ' + p.activity.name;
						this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = p.activity.action;
						this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = '';
						this.context_board.innerHTML = p.activity.detail;
						console.log(p.activity.link);
						this.context_board.innerHTML +=" <br><div class=\"btnpure\" onClick=\"window.open('" + p.activity.link + "','_blank');\">Learn More<\/div>";
					}else{
						this.quads[idx].getElementsByClassName(this.header_class_name)[0].innerHTML = 'Nothing happened';
						this.quads[idx].getElementsByClassName(this.content_class_name)[0].innerHTML = '';
						this.quads[idx].getElementsByClassName(this.decision_class_name)[0].innerHTML = '';
					}
				}
				let sta = 'Money: $' + p.money + '<br>' + 'Salary: $' + p.salary + '<br> ' + 'Strikes: ' + p.strike + '<br>';
				var p_sta = document.getElementById(this.scoreBoard).children[idx];
				if(p.human){
					// sta += ' (you)';
					p_sta.style.border= "3px dashed white";
				}else{
					p_sta.style.border= "0px";
				}
				p_sta.getElementsByClassName('p_status')[0].innerHTML = sta;
				// clear the activity for next round
				//p.activity = {};
			}
		});
	}

	show(){
		if(this.in_animation){
			// push this operation to queue is the best way
			// but let's just hack it
			window.setTimeout(this.show, 100);
		}
		// make element visible
		console.log("UI element" ,this.element);
		if(this.element.style.display === "block"){
			// Already visible, do nothing but hide buttons
			//console.log("no change...");
			this.hideDecisionButton();
			return;
		}
		this.element.style.display = "block";
		let divStyler = styler(this.element);
		this.in_animation = true;
		tween({
		  from: 0.0,
		  to: { opacity: 1.0 },
		  duration: 1000,
		  ease: easing.backOut,
		  //flip: Infinity,
		  // elapsed: 500,
		  // loop: 5,
		  // yoyo: 5
		}).start({update: divStyler.set, complete: () => { this.in_animation = false;} });
		this.hideDecisionButton();
		// let btn = document.getElementById(this.toggleBtn);
		// if(btn){
		// 	btn.innerHTML = 'See One';
		// }
	}

	showDecisionButton(y_text='Yes', n_text='No', b_text){
		this.yesButton.style.display = "block";
		this.yesButton.innerHTML = y_text;
		this.noButton.style.display = "block";
		this.noButton.innerHTML = n_text;
		if(b_text){
			// Bail text is provided
			this.bailButton.style.display = "block";
			this.bailButton.innerHTML = b_text;
		}
	}

	hideDecisionButton(){
		this.yesButton.style.display = "none";
		this.noButton.style.display = "none";
		this.bailButton.style.display = "none";
	}

	hide(){
		// hide element
		if(this.in_animation){
			// Hao: simple hack
			setTimeout(this.hide, 100);
		}
		let divStyler = styler(this.element);
		this.in_animation = true;
		tween({
		  from: 1.0,
		  to: { opacity: 0.0 },
		  duration: 1000,
		  ease: easing.backOut,
		  //flip: Infinity,
		  // elapsed: 500,
		  // loop: 5,
		  // yoyo: 5
		}).start({update: divStyler.set, complete: ()=>{this.element.style.display = "none"; this.in_animation = false;} });
			
	}

	toggle(){
		if(this.element.style.display === "block"){
			this.hide();
		}else{
			this.show();
		}
	}
}

var decisionUI = new DecisionUI();
var chance = new Chance();
var gevent = new GEvent();
var lifeInPrison = new LifeInPrison();
