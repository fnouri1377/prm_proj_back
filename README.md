# What is this project about?
This is a webserver in NodeJS that performs some GIS functionality.There are some initial GIS information which is some polygons of some regions on map. the user is given two APIs to either add a new polygon or find ones which contain a specific coordinate . The goal in this project was implementing two APIs in NodeJS that can do the mentioned jobs. In order to run this project on your local machine, first run <b>npm install</b> command to install all the dependencies and Then try runnig the server by the command <b>node server.js</b> . At this point you can send following requests to this server :
<ul>
  <li>A GET (/gis/testpoint) endpoint that receives a pair of parameters (lat, long) and returns a JSON structure which has a member called polygons and it contains the name of the polygons that the point is inside them</li>
  <li>A PUT (/gis/addpolygon) endpoint that we can add a new polygon to server for subsequent get calls.</li>
</ul>


# Which packages I used?
In this project , I tried to use some npm packages for simplicity's sake, e.g. <b>express</b> package helped me to write APIs and the server much easier. And <b>point-in-polygon</b> package is for deciding whether a coordinate is inside a polygon or not .<b>body-parser</b> is for parsing the bodies of all incoming requests and so handling requests will become more handy. In this project I added a generic JSON and URL-encoded parser as a top-level middleware.

# Load Test and Report
I also used a NodeJS tool called <i>artillery</i> to test how many requests my application can handle. I used this tool to virtualize 10 users per second and in 60 seconds send requests to the server. Out of these tests , some succeeded and some failed. Some of the requests got completed like 98 out of 100 . And the others got completed like 0 out of 100. The test script is written in test.yml file . You can run this script by <b>artillery run test.yml</b> command and see the details and complete logs.

# You can find this project on heroku too!
I have deployed this application into heroku platform and you can find it on https://vast-inlet-08992.herokuapp.com. Remember to use the endpoints (/gis/testpoint and /gis/addpolygon ) at the end of this link if you want to send requests to that. You can send the same requests as you sent in your local machine to this link.
