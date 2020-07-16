const satellite = require('satellite.js')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const julian = require('julian')

exports.getCoords = (fileN = "ISS_Zarya.tle") => {
	let sat_name = '';
	let iterations = [];
	
	if(fileN === 'ISS_Zarya.tle'){//
		sat_name = "Satellite/ISS";
	}
	else{
        /*
		sat_name = fileN.substring(0,5);
		fileN = (path.join(__dirname, "../TLEs/", fileN.substring(0,5), fileN));
        */
		/* Create custom dir for every TLE [Done in sockets.js] */
        sat_name = fileN.substring(0,5);
	}
	let readFile = fs.readFileSync(fileN).toString()
	iterations = readFile.split("\n")
	let tleLine = []

	for (let count = 0; count < iterations.length; count++) {
		tleLine.push(iterations[count].substring(0, iterations[count].length - 1)) //XXX SUCCESS
	}

	let res = []; //result for position
	let satrec //Set satrec
	if(iterations.length === 3){
		satrec = satellite.twoline2satrec(tleLine[1], tleLine[2]);
	}
	else{
		satrec = satellite.twoline2satrec(tleLine[0], tleLine[1]);
	}
	
	//to go from RAD/DAY -> REV/DAY: rad * 1440 * 0.159155
	//to go from REV/PER DAY to MINS/REV -> 1440/RevPerDay
	let totalIntervalsInDay = satrec.no * 1440 * 0.159155; //1440 = min && 0.159155 = 1turn
	let minsPerInterval = 1440 / totalIntervalsInDay; // mins for 1 revolution around earth
	let intervalTime = moment(julian.toDate(satrec.jdsatepoch).toISOString()).toISOString()

	//set intervals 
	let initialTime = moment(julian.toDate(satrec.jdsatepoch).toISOString()).toISOString();//start date of TLE 
	let endTime = moment(julian.toDate(satrec.jdsatepoch).toISOString()).add(120, 'h').toISOString();; //add 120hours(5days)
	let leadIntervalArray = [];
	let trailIntervalArray = [];

	console.log("Setting intervals...");
	for (let i = 0; i <= 7200; i += minsPerInterval) {//7200===120hours===5days(which is our end time)
		if (i === 0) { // intial interval 
			intervalTime = moment(intervalTime).add(minsPerInterval, 'm').toISOString();
			let currentOrbitalInterval = {
				"interval": `${initialTime}/${intervalTime}`,
				"epoch": `${initialTime}`,
				"number": [
					0, minsPerInterval * 60,
					minsPerInterval * 60, 0
				]
			}
			let currTrail = {
				"interval": `${initialTime}/${intervalTime}`,
				"epoch": `${initialTime}`,
				"number": [
					0, 0,
					minsPerInterval * 60, minsPerInterval * 60
				]
			}
			leadIntervalArray.push(currentOrbitalInterval);
			trailIntervalArray.push(currTrail);
		}
		else {	//not initial so make intervals 
			let nextIntervalTime = moment(intervalTime).add(minsPerInterval, 'm').toISOString();
			let currentOrbitalInterval = {
				"interval": `${intervalTime}/${nextIntervalTime}`,
				"epoch": `${intervalTime}`,
				"number": [
					0, minsPerInterval * 60,
					minsPerInterval * 60, 0
				]
			}
			let currTrail = {
				"interval": `${intervalTime}/${nextIntervalTime}`,
				"epoch": `${intervalTime}`,
				"number": [
					0, 0,
					minsPerInterval * 60, minsPerInterval * 60
				]
			}
			intervalTime = moment(intervalTime).add(minsPerInterval, 'm').toISOString();
			leadIntervalArray.push(currentOrbitalInterval);
			trailIntervalArray.push(currTrail);
		}
	}
	let sec = 0;
	for (let i = 0; i <= 432000; i++) { //iterates every second (86400sec in 1day)
		if(iterations.length === 3){
			satrec = satellite.twoline2satrec(tleLine[1], tleLine[2]);
		}
		else{
			satrec = satellite.twoline2satrec(tleLine[0], tleLine[1]);
		}
		let positionAndVelocity = satellite.sgp4(satrec, i * 0.0166667); // 0.0166667min = 1sec
		let positionEci = positionAndVelocity.position;
		positionEci.x = positionEci.x * 1000;
		positionEci.y = positionEci.y * 1000;
		positionEci.z = positionEci.z * 1000;

		res.push(i, positionEci.x, positionEci.y, positionEci.z);
		sec += 900;
	}

	//set initial object start for czml
	let initialCZMLProps = [{
		"id": "document",
		"name": "CZML Point - Time Dynamic",
		"version": "1.0",
		"clock": {
			"interval": `${initialTime}/${endTime}`,
			"multiplier": 1,
			"range": "LOOP_STOP",
			"step": "SYSTEM_CLOCK"
		}
	},

	{
		"id": `${sat_name}`,
		"name": `${sat_name}`,
		"availability": `${initialTime}/${endTime}`,
		"description": "Insert the altitude here??",
		"label": {
			"fillColor": {
				"rgba": [
					255, 0, 255, 255
				]
			},
			"font": "11pt Lucida Console",
			"horizontalOrigin": "LEFT",
			"outlineColor": {
				"rgba": [
					0, 0, 0, 255
				]
			},
			"outlineWidth": 2,
			"pixelOffset": {
				"cartesian2": [
					12, 0
				]
			},
			"show": true,
			"style": "FILL_AND_OUTLINE",
			"text": `${sat_name}`,
			"verticalOrigin": "CENTER"
		},
		"path": {
			"show": [
				{
					"interval": `${initialTime}/${endTime}`,
					"boolean": true
				}
			],
			"width": 1,
			"material": {
				"solidColor": {
					"color": {
						"rgba": [
							255, 0, 255, 255
						]
					}
				}
			},
			"resolution": 120,
			"leadTime": leadIntervalArray,
			"trailTime": trailIntervalArray
		},
		"model":{
            "show": true,
            "gltf": "../../models/satg.gltf",
			//Animation(s).
			"minimumPixelSize": 99,
        },
		"position": {
			"interpolationAlgorithm": "LAGRANGE",
			"interpolationDegree": 2,
			"referenceFrame": "INERTIAL",
			"epoch": `${initialTime}`,
			"cartesian": res
		}
	}
	]

	//Write into a file
	let tle = fileN + ".czml";
	fs.writeFile(tle, JSON.stringify(initialCZMLProps, null, 4), function (err) {
		if (err) { console.log(err) }
		console.log("Success! Wrote to czml file...")
	})

	let tempCZML = []
	tempCZML.push({ initialCZMLProps });
	return tle;
}