/*
CLI Related Tasks
*/

//All dependencies

var readline=require('readline');
var util=require('util');
var debug=util.debuglog('cli');
var events=require('events');
class _events extends events{};
var e=new _events();
var os = require('os');
var v8 = require('v8');
var _data=require('./data')



//Instantiate CLI Object
var cli={};
//Input handlers
e.on('man',function(str){
  cli.responders.help();
});

e.on('help',function(str){
    cli.responders.help();
  });

e.on('exit',function(str){
    cli.responders.exit();
  });

e.on('stats',function(str){
    cli.responders.stats();
  });

e.on('list user cart',function(str){
    cli.responders.listUserCart(str);
});

e.on('list users',function(str){
    cli.responders.listUsers();
  });
  
e.on('more user info',function(str){
    cli.responders.moreUserInfo(str);
  });
  
e.on('recent orders',function(str){
    cli.responders.recentOrders();
  });
    
  e.on('list menu',function(str){
    cli.responders.listMenu();
  });
 e.on('recent login',function(str){
     cli.responders.recentLogin();
 })  
  
//Responders object
cli.responders={}

//Help/man
cli.responders.help=function(){
  var commands={
    'man':'Show this help page',
    'help':'Alia of man',
    'stats':'Configuratoin',
    'list users':'list of registered users aka un deleted users',
    'more user info -- {userId}':'Show details of specific user',
    'list user cart  --{userId}':'Lists all the cart details of the particular user',
    'recent orders':'List of recent orders done by users with in 24 hours',
    'recent login':'List the users who have logged in within 24 hours',
    'list menu':'Displays the menu items',
    'exit':'Kill th cli'
  };

  //Show a header for the help page 
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace();
  cli.verticalSpace(2);


  //Show each command followed by details in white and yellow
  for(var key in commands){
    if(commands.hasOwnProperty(key)){
       var value = commands[key];
       var line = '      \x1b[33m '+key+'      \x1b[0m';
       var padding = 60 - line.length;
       for (i = 0; i < padding; i++) {
           line+=' ';
       }
          line+=value;
          console.log(line);
          cli.verticalSpace();
        }
  }
  cli.verticalSpace(1);
  //End with horiazontal line
  cli.horizontalLine();
};
//Create vertical space
cli.verticalSpace=function(lines){
    lines=typeof(lines) == 'number' && lines >0 ? lines:1;
    for(i=0;i<lines;i++)
    console.log('');

}

//Horizontal line
cli.horizontalLine=function(){
    //Get the available window size
    var width=process.stdout.columns;

    var line='';
    for(i=0;i<width;i++)
     line+='-';
console.log(line);
    }
 //Centerd Text   
 cli.centered=function(str){
    str=typeof(str) == 'string' && str.trim().length>0 ? str.trim():false;
  //Get the available window size
  var width=process.stdout.columns;

  //Calcualte the left padding
  var leftPadding=Math.floor(width-str.length)/2;

  //Put in left padded spaces;

  var line='';
  for(i=0;i<leftPadding;i++)
  line+=' ';
  line+=str
  console.log(line);
 }

//Exit
cli.responders.exit=function(){
    process.exit(0);
};

//Stats
cli.responders.stats=function(){
    // Compile an object of stats
  var stats = {
    'Load Average' : os.loadavg().join(' '),
    'CPU Count' : os.cpus().length,
    'Free Memory' : os.freemem(),
    'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    'Uptime' : os.uptime()+' Seconds'
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for(var key in stats){
     if(stats.hasOwnProperty(key)){
        var value = stats[key];
        var line = '      \x1b[33m '+key+'      \x1b[0m';
        var padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }

  // Create a footer for the stats
  cli.verticalSpace();
  cli.horizontalLine();

};

//List Users
cli.responders.listUsers=function(){
  _data.list('users',function(err,userIds){
      if(!err && userIds && userIds.length >0){
          cli.verticalSpace();
          var details={};
        
        //Get the count of cart objects
        userIds.forEach(function(userId){
            var user=userId;
            details[user]=0
            _data.read('cart',userId,function(err,cartData){
                if(!err && cartData){
                    var length=cartData.cartObjects.length > 0 ? cartData.cartObjects.length : 0;
                    
                    details[user]=length;
                }
            })
        })
        console.log(details)

        //Get the details of the users
          userIds.forEach(function(userId){
              _data.read('users',userId,function(err,userData){
                if(!err && userData){
                
                    var line='Name: '+userData.name +' '+ 'email: '+userData.email + ' ' + ' cart details :'+ details[userId];
                    console.log(line);
                    cli.verticalSpace();
                
                    }
                 });
          })
      }
  });    

};
//More info of user
cli.responders.moreUserInfo=function(str){
    console.log(str)
   var arr=str.split('--');
   var userId=typeof(arr[1])=='string' &&  arr[1].trim().length > 0 ?  arr[1].trim() : false;
    console.log(userId)
   if(userId){
       
    _data.read('users',userId,function(err,userData){
        if(!err && userData){
            delete userData.hashedPassword
            cli.verticalSpace();
            console.dir(userData,{'colors':true});
            cli.verticalSpace();
            }
         });
   } 
};
//Recent Orders
cli.responders.recentOrders=function(){
    _data.list('paymentHistory',function(err,orderIds){
       if(!err && orderIds){
         orderIds.forEach(function(email){
            _data.read('paymentHistory',email,function(err,orderData){
                if(!err && orderData){
                   
                    var currentData=Date(Date.now()).toString();
                    currentData=currentData.substring(0,15)
                    var loginData=orderData.paymentHistory[0]['time'];
                    loginData=loginData.substring(0,15)
                  
                    if(currentData==loginData){
                        console.log(email)
                        console.dir(orderData,{'colors':true})
                        orderData.paymentHistory.forEach(function(paymentData){
                            console.log(paymentData['item'])
                        })
                    }
                }
            })

         })
  
       }
   })
};
//List items
cli.responders.listUserCart=function(str){
    var arr=str.split('--');
    var userId=typeof(arr[1])=='string' &&  arr[1].trim().length > 0 ?  arr[1].trim() : false;
    if(userId){
        
     _data.read('cart',userId,function(err,cartData){
         if(!err && cartData){
             cli.verticalSpace();
             console.dir(cartData,{'colors':true});
             cli.verticalSpace();
             }
          });
    } 
};

//List Menu
cli.responders.listMenu=function(){
    _data.read('menu','pizza',function(err,menuData){
        if(!err && menuData){
            cli.verticalSpace();
            console.dir(menuData,{'colors':true});
            cli.verticalSpace();
            }
         });
}

cli.responders.recentLogin=function(){
  
    _data.list('tokens',function(err,tokenIds){
          console.log("Ads")
        if(!err && tokenIds){
            tokenIds.forEach(function(tokenId){
                
                _data.read('tokens',tokenId,function(err,tokenData){
                    if(!err && tokenData){
                        var currentTime=Date.now()-1000*24*60*60;
                        var validTime=tokenData.expires-currentTime>0 ? 1: 0;
                        console.log(validTime)
                        if(validTime){
                            var userId=tokenData.email;
                            var details={}
                            details[userId]=0;                          
                            _data.read('cart',userId,function(err,cartData){
                                if(!err && cartData){
                                    var length=cartData.cartObjects.length > 0 ? cartData.cartObjects.length : 0; 
                                    details[userId]=length;
                                }
                            })
                            //Get the details of the users
                            _data.read('users',userId,function(err,userData){
                                if(!err && userData){       
                                    var line='Name: '+userData.name +' '+ 'email: '+userData.email + ' ' + ' cart details :'+ details[userId];
                                    console.log(line);
                                    cli.verticalSpace();
                                
                                    }
                                 });
                             
                        }
                    }
                })

            })
         
        }
    })
}


//Handler for the user input 
cli.processInput=function(str){
    str=typeof(str) == 'string' && str.trim().length>0 ? str.trim():false;
    if(str){
        //Identify the unique questions from the user
        var uniqueInputs=[
            'man',
            'help',
            'stats',
            'exit',
            'list users',
            'more user info',
            'list user cart',
            'recent orders',
            'list menu',
            'recent login'
            
        ];

        //Go through inputs and emit an event if found
        var matchfound=false;
        uniqueInputs.some(function(input){
            if(str.toLowerCase().indexOf(input) > -1){
                matchfound=true;
                //Emit the matched event 
             
                e.emit(input,str);
                return true;
           
            }
                 });

            //If not match is found,try agian
    if(!matchfound){
        console.log("Sorry try again");
       
    }
    }

    
}
cli.init=function(){
    //Send the start message to the console,in dark blue
    console.log('\x1b[34m%s\x1b[0m','The CLI is running');

  //Start the interface

   var _interface=readline.createInterface({
       input:process.stdin,
       output:process.output,
       prompt:''
   });
    //Create an initial prompt
   _interface.prompt();

   //Handle each line of input separately
   _interface.on('line',function(str){
       //Sebnd to the input processor
       cli.processInput(str);
   })
    //Reinitialize the prompt
    _interface.prompt();

    //If user stops the cli
    _interface.on('close',function(){
        process.exit(0);
    })
};














//Export the cli
module.exports=cli;





