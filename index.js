/*
* Primary file for the Pizza Api
*
*/

//Dependencies
//1.server - includes all the methods for starting the server

var server=require('./lib/server');
var workers=require('./lib/workers')


//Command Line Interface

var cli=require('./lib/cli')
//Declare the app

var app={}

//App init function
app.init=function(){
    //start the server
     server.init();
    //start the workers
    workers.init();

     //start the cli after all the previous functions are loaded
     setTimeout(function(){
    //start the cli
    cli.init();
     },50);
};

//Execute the init function
app.init();

//Export the app
module.export=app;