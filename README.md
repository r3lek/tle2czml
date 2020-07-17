# tle2czml

A module that converts a TLE to a czml file that can be ingested by Cesium. This is thanks to [satellite.js](https://github.com/shashwatak/satellite-js)


Note: This module takes in a .tle and writes out a .czml file and sets orbit path for 5 days. Feel free to change this if you wish. I believe it is suggested to use it for only 3days. 



## Install:
```bash
npm install tle2czml
```


## How to use:

```js
const tle2czml = require('tle2czml');

tle2czml.getCoords('25544.tle');
```

## Output: 
A .czml file with the same name as .tle passed in

## Example of 25544.tle contents:
```
0 ISS (ZARYA)
1 25544U 98067A   20199.03008672 -.00000576  00000-0 -22221-5 0  9991
2 25544  51.6440 200.7619 0001412 122.6206 338.3473 15.49512746236640
```
or
```
1 25544U 98067A   20199.03008672 -.00000576  00000-0 -22221-5 0  9991
2 25544  51.6440 200.7619 0001412 122.6206 338.3473 15.49512746236640
```

## Test TLE:
You can go to https://cesium.com/cesiumjs/cesium-viewer/?
drag the czml file produced into the browser and click play on the bottom left or move the dial. 



## TODO:
Make it more efficient? 

Read: https://celestrak.com/NORAD/documentation/gp-data-formats.php

