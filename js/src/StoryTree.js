/* StoryTree class, the top class with all client functions
*
* 	SDB(SDB) - The SDB of the StoryTree
* 	characters(CharacterDB) - The database of all characters
* 	loadingSDB(bool) - true if SDB is loading
*	loadingCharacters(bool) - true if Characters are loading
*	loadingTree(bool) - true if Trees are loading
*	badFormatting(bool) - if this is true, this aborts all loading functions
*/
var StoryTree = function(){
	this.SDB = new SDB();
	this.characterDB = new CharacterDB();

	this.loadingSDB = false;
	this.loadingCharacters = false;
	this.loadingTree = false;

	this.badFormatting = false;
};

// StoryTree.setSDB(String path)
// Set up the SDB of the StoryTree
// ARGUMENTS:
//	path(String) - the file path to the local json file representing the SDB
// RETURN void
StoryTree.prototype.setSDB = function(path){

	//Check for bad formatting first
	if(this.badFormatting) return;

	//Start the XMLHttpRequest for the JSON file
	var that = this;
	var request = new XMLHttpRequest();
	request.open('GET', path, true);

	this.loadingSDB = true;

	request.onload = function() {
	  if (request.status >= 200 && request.status < 400) {
	    // Success!
	    var data = JSON.parse(request.responseText);

	    //Add each SDBClass into the SDB
	    for(var i = 0; i < data.length; i++){
	    	var sdbClass = data[i];

	    	//Check the formatting of the JSON object to make sure that the typing is correct, simply abort if bad formatting
	    	that.badFormatting = that.SDB.checkSDB(sdbClass.class, sdbClass.types, sdbClass.isBoolean, sdbClass.min, sdbClass.max, sdbClass.defaultVal);
	    	if(that.badFormatting) return;

	    	that.SDB.addClass(new SDBClass(sdbClass.class, sdbClass.types, sdbClass.isBoolean, sdbClass.min, sdbClass.max, sdbClass.defaultVal));
	    }

	  }
	  that.loadingSDB = false;
	};

	request.onerror = function() {
	  alert("Unable to parse SDB from this path: " + path);
	  that.loadingSDB = false;
	};

	request.send();
};

//StoryTree.setChracters(String path)
//Set up the characters of the StoryTree
//ARGUMENTS:
//	path(String) - the file path to the local json file representing the characters and the characteristics
//RETURN void
StoryTree.prototype.setCharacters = function(path){

	//Check for bad formatting first
	if(this.badFormatting) return;

	var that = this;

	//First check to see if SDB has been loaded
	//We're loading JSON asynchronously, so it is a bit wonky with the timing
	if(this.SDB.isEmpty()){
		var setT = function(){that.setCharacters(path);}; 
		//reload function every 100 milliseconds
		window.setTimeout(setT, 100);
		return;
	}

	//Start an XMLHttpRequest to load in a JSON
	var request = new XMLHttpRequest();
	request.open('GET', path, true);

	this.loadingCharacters = true;

	request.onload = function() {
	  if (request.status >= 200 && request.status < 400) {
	    // Success!
	    var data = JSON.parse(request.responseText);

	    //Push new character objects into the game
	    var chars = data.characters;
	    for(var i = 0; i < chars.length; i++){
	    	that.characterDB.addCharacter(chars[i]);
	    }
	    that.characterDB.addCharacter("World");
	    that.characterDB.addCharacter("Player");

	    //Loop through each characteristic
	    var characteristics = data.characteristics;
	    for(var j = 0; j < characteristics.length; j++){
	    	//Find the correct corresponding character for that characteristic
	    	var character = that.characterDB.getCharacter(characteristics[j].name);
	    	//Check if that sdbClass and type exists
			var sdbClass = that.SDB.SDBClasses[characteristics[j].class	];
			if(sdbClass.types[characteristics[j].type]){
				//Now add the characteristic to the correct character
				character.addCharacteristic(characteristics[j].class, characteristics[j].type, sdbClass.min, sdbClass.max, sdbClass.isBoolean, sdbClass.defaultVal);

				//Manually set the value of that characteristic
				character.parseExpression(characteristics[j].class, characteristics[j].type, "=", characteristics[j].value);
			}
	    }

	  }
	  that.loadingCharacters = false;
	};

	request.onerror = function() {
	  alert("Unable to parse characters from this path: " + path);
	  that.loadingCharacters = false;
	};

	request.send();
};

//StoryTree.setTrees(String path)
//Set up the the actual Trees of the StoryTree
//ARGUMENTS:
//	path(String) - the file path to the local folder that holds all of the characters' Trees, these files have to be the same as the name of the character
//RETURN void
StoryTree.prototype.setTrees = function(path){

	//Check for bad formatting first
	if(this.badFormatting) return;

	var that = this;

	this.loadingTree = true;

	//First check to see if characters have been loaded
	//We're loading JSON asynchronously, so it is a bit wonky with the timing
	if(this.characterDB.isEmpty()){
		var setT = function(){that.setTrees(path);}; 
		//reload function every 100 milliseconds
		window.setTimeout(setT, 100);
		return;
	}

	//Do a check for bad formatting in the path
	if(path.substr(path.length - 1) !== "/"){
		alert("StoryTree.setTrees() error: pathname to folder needs to end with a /");
		return;
	}

	//First, get a reference to all characters
	var characters = this.characterDB.getListOfCharacters();


	//Loop through each character, adding their corresponding speak tree to the path name
	for(var b = 0; b < characters.length; b++){
		var myChar = that.characterDB.getCharacter(characters[b]);
		var newPath = path + myChar.name + ".json";


		var request = new XMLHttpRequest();
		request.open('GET', newPath, true);

		request.onload = function() {
		  if (request.status >= 200 && request.status < 400) {
		    // Success!
		    var data = JSON.parse(request.responseText);

		    //Code once data has been parsed

		    console.log(myChar);

		    //Create Speak tree and set it to the character
		    var sTree = new STree();
		    myChar.setStoryTree(sTree);

		    //Loop through each action
		    for(var c = 0; c < data.length; c++){

		    	var action = data[c];

		    	//If the action is labeled as a first, set it to be a first
		    	if(action.first){
		    		sTree.addFirst(action.uid);
		    	}

		    	//Give the Speak Tree a Lookup reference to that action
		    	var uid = action.uid;
		    	sTree.mapAction(action.name, uid);

		    	//Now get that action object that the Speak Tree created
		    	var actionObj = sTree.actions[uid];

		    	//Loop through each precondition and set it to the action object
		    	for(var d = 0; d < action.preconditions.length; d++){
		    		var pre = action.preconditions[d];
		    		actionObj.addPrecondition(pre.character, pre.class, pre.type, pre.operation, pre.value);
		    	}

		    	//Loop through each expression and set it to the action object
		    	if(action.expressions !== undefined) {
		    		for(var e = 0; e < action.expressions.length; e++){
		    			var exp = action.expressions[e];
		    			actionObj.addExpression(exp.character, exp.class, exp.type, exp.operation, exp.value);
		    		}
		    	}

		    	//Loop through each child uid and set it to the action object
		    	if(action.leadsTo !== undefined) {
			    	for(var f = 0; f < action.leadsTo.length; f++){
			    		var child = action.leadsTo[f];
			    		actionObj.addChild(child);
			    	}
			    }

		    	//Set the action's parents
		    	if(action.parents !== undefined){
		    		for(var g = 0; g < action.parents.length; g++){
		    			actionObj.addParent(action.parents[g]);
		    		}
		    	}
		    }

		    //Go through each action again to set the classes
		    for(var d = 0; d < data.length; d++){
		    	var action = data[d];

		    	//Set the action's class if it exists
		    	if(action.class !== undefined){
		    		sTree.setClasses(action.uid, action.class);
		    	}
		    }

		  }
		  that.loadingTree = false;
		};

		request.onerror = function() {
		  console.log("Unable to parse character Speak Tree from this path: " + newPath);
		  that.loadingTree = false;
		};
		console.log(myChar);
		request.send();
	}
};

//StoryTree.getOptions(int numOfOptions)
//Return a number of options in a specific characters StoryTree
//ARGUMENTS:
//	character(String) - character name
//	numOfOptions(int) - number of options for that character
//RETURN [[int]] uids - an array of the paths of the action uids available to execute
StoryTree.prototype.getOptions = function(character, numOfOptions){

	var that = this;

	//check to see if we're still loading JSON
	if(this.loadingSDB || this.loadingCharacters || this.loadingTree){
		var l = function(){that.getOptions(character, numOfOptions)};
		console.log("Wait 500 ms for the JSONs to load....");
		window.setTimeout(l, 500);
		return;
	}

	//Get the character's corresponding speak tree
	var tree = that.characterDB.getCharacter(character).tree;

	//If there's no tree, that means there's no character with that name
	//Error checking
	if(tree == undefined){
		alert("getOptions() Error: There's no character with the name " + character);
		return;
	}

	//Private function that evaluates a precondition
	//Used to see if an action can be traversed to
	//ARGUMENTS:
	//	precondition(Precondition) - the precondition to be evaluated
	//RETURN bool - is the precondition true
	function evaluatePrecondition(precondition){			
		//find the character for that characteristic
		var char = that.characterDB.getCharacter(precondition.characterName);
		var characteristics = char.characteristics;

		//Get the characteristic
		var characteristic = char.characteristics[precondition.cls][precondition.type];
		//If the characteristic doesn't exist for that character, we just use the default value for that character
		if(characteristic == undefined){
			//Get sdbClass values for that characteristic
			var sdbClass = that.SDB.SDBClasses[precondition.cls];
			if(sdbClass == undefined){
				alert("Error: There's no class called " + precondition.cls + ". Look in " + precondition.characterName + "'s Speak Tree.");
				return;
			}

			characteristic = new Characteristic(precondition.cls, precondition.type, sdbClass.min, sdbClass.max, sdbClass.isBoolean, sdbClass.defaultVal);
			//Quickly load that characteristic into the character
			char.setCharacteristic(characteristic);

		}

		//Depending on the operator, see if the precondition passes evaluation
		var returnVal;
		switch(precondition.operation){
			case ">": returnVal = (characteristic.value > precondition.value);
					  break;
			case "<": returnVal = (characteristic.value < precondition.value);
					  break;
			case "==": returnVal = (characteristic.value === precondition.value);
					   break;
		}

		//Return the correct value
		return returnVal;
	}

	//Private function that traverses the non-binary StoryTree
	//Recursively goes through the tree and finds each available action
	//ARGUMENTS:
	//	uid(int) - the uid of the action to be traversed
	//return void
	function traverse(uid){

		//Before anything, see if the counter for max returns is at 0
		//If so, we immediately bypass the tree traversal
		if(counter === 0){
			return;
		}

		// get the action object and loop through each of its children
		var action = tree.actions[uid];
		for(var i = 0; i < action.children.length; i++){
			var actionUID = action.children[i];
			var actionObj = tree.actions[actionUID];

			//evaluate each precondition for the child object
			var trig = false;
			for(var j = 0; j < actionObj.preconditions.length; j++){
				var pre = actionObj.preconditions[j];

				//check to see if we get a false value
				if(!evaluatePrecondition(pre)){
					trig = true;
					break;
				}
			}
			//If we do get a false value, move on in the loop
			if(trig) continue;

			//Now check if the class has been added to the list in the past
			//If so, disregard this whole branch in our traversal
			for(var k = 0; k < classes.length; k++){
				if(classes[k] === actionObj.cls) continue;
			}

			//We can assume now that we've succesfully passed the preconditions
			//This means we can add the action to the uid list
			uidList.push(actionUID);

			//If it's a leaf, we push it onto the return list and decrement the counter for max returns
			//If not a leaf, we keep traversing
			if(actionObj.isLeaf()){
				uids.push(uidList);
				uidList = [];
				if(actionObj.cls !== ""){
					classes.push(actionObj.cls);
				}
				counter--;
			} else {
				traverse(actionUID);
			}

			
		}
	}

	//loop through each top action, traversing through their corresponding trees
	//keep track of which actions we've added and how many were added
	var uids = [];
	var uidList = [];
	var counter = numOfOptions;
	var classes = [];
	console.log(tree);
	for(var j = 0; j < tree.firsts.length; j++){

		
		var actionUID = tree.firsts[j];
		var actionObj = tree.actions[actionUID];

		//evaluate each precondition for the child object
		var trig = false;
		for(var k = 0; k < actionObj.preconditions.length; k++){
			var pre = actionObj.preconditions[k];

			//check to see if we get a false value
			if(!evaluatePrecondition(pre)){
				trig = true;
				break;
			}
		}
		//If we do get a false value, move on in the loop
		if(trig) {
			continue;
		}

		//We can assume now that we've succesfully passed the preconditions
		//If it's a leaf, we push it onto the return list and decrement the counter for max returns
		//If not a leaf, we keep traversing
		if(actionObj.isLeaf()){
			uids.push([actionUID]);
			if(actionObj.cls !== ""){
				classes.push(actionObj.cls);
			}
			counter--;
		} else {
			uidList.push(actionUID);
			traverse(actionUID);
		}

	}

	//return the list of uids for doable actions
	return uids;

}

//StoryTree.getActionName(String character, int uid)
//Given a character and a uid for an action, return the name of that action
//ARGUMENTS:
//	character(String) - the name of the character with the action you want
//	uid(int) - the action's uid
//return String -the name of the corresponding action
StoryTree.prototype.getActionName = function(character, uid){

	var that = this;

	//check to see if we're still loading JSON
	if(this.loadingSDB || this.loadingCharacters || this.loadingTree){
		var l = function(){that.getActionName(character, uid)};
		console.log("Wait 500 ms for the JSONs to load....");
		window.setTimeout(l, 500);
		return;
	}

	//find the right character and their tree
	var tree = that.characterDB.getCharacter(character).tree;

	//If the tree is undefined, that means that there's no character with that name
	//Error checking
	if(tree == undefined){
		alert("getActionName() Error: There's no character with the name " + character);
		return;
	}

	//get the name from the lookup
	var actionName = tree.actions[uid].name;
	//If the action isn't able to be found, that means there's no action with that uid
	//Error checking
	if(actionName == undefined){
		alert("getActionName() Error: There's no uid with the number " + uid);
		return;
	}

	//return the correct name
	return actionName;
}

//StoryTree.isLoaded()
//Just a simple function to tell if it's been loaded
//RETURN bool - have the JSONs been loaded
StoryTree.prototype.isLoaded = function(){
	return !(this.loadingSDB || this.loadingTree || this.loadingCharacters);
}

//StoryTree.executeAction()
//Executes a given action for a given character
//ARGUMENTS:
//	character(String) - Name of the character
//	uidPath([int]) - uids of the action path to be executed
//RETURN void
StoryTree.prototype.executeAction = function(character, uidPath){
	var that = this;

	//check to see if we're still loading JSON
	if(this.loadingSDB || this.loadingCharacters || this.loadingTree){
		var l = function(){that.getActionName(character, uid)};
		console.log("Wait 500 ms for the JSONs to load....");
		window.setTimeout(l, 500);
		return;
	}

	//Get action tree for character
	var tree = that.characterDB.getCharacter(character).tree;

	//If the tree is undefined, that means that there's no character with that name
	//Error checking
	if(tree == undefined){
		alert("executeAction() Error: There's no character with the name " + character);
		return;
	}

	//Loop through each action in the uidList and execute that action
	for(var i = 0; i < uidPath.length; i++){

		//get the object of the action
		var uid = uidPath[i];
		var actionObj = tree.actions[uid];

		//If the uid is undefined, that means that there's no corresponding action
		//Error checking
		if(tree.actions[uid] == undefined){
			alert("executeAction() Error: There's no uid with the number " + uid);
			return;
		}

		//Now loop through all expressions of the action
		for(var j = 0; j < actionObj.expressions.length; j++){
			var exp = actionObj.expressions[j];
			//console.log(actionObj);

			//Get the correct character for that expression
			var char = that.characterDB.getCharacter(exp.characterName);

			//Check if the characteristic exists for that character, 
			//If not, we just use the default value for that character
			if(char.characteristics[exp.cls] == undefined){
				//Get sdbClass values for that characteristic
				var sdbClass = that.SDB.SDBClasses[exp.cls];
				if(sdbClass == undefined){
					alert("Error: There's no class called " + exp.cls + ". Look in " + exp.characterName + "'s Speak Tree.");
					return;
				}

				characteristic = new Characteristic(exp.cls, exp.type, sdbClass.min, sdbClass.max, sdbClass.isBoolean, sdbClass.defaultVal);
				//Quickly load that characteristic into the character
				char.setCharacteristic(characteristic);

			}

			//parse the action for that character
			char.parseExpression(exp.cls, exp.type, exp.operation, exp.value);

		}
	}
}

//StoryTree.getCharacters()
//Get the names of all available characters
//	return([string]) - list of all characters that are available in the StoryTree
StoryTree.prototype.getCharacters = function(){
	return this.characterDB.getListOfCharacters();
}

StoryTree.prototype.getCharacteristics = function(character){
	var characteristics = this.characterDB.getCharacter(character).characteristics;
	return characteristics;
}