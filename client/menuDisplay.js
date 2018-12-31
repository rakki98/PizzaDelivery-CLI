var _data = require('../lib/data');
var helpers = require('../lib/helpers');

//Handler for account creation
var menuDisplayHandler={};

menuDisplayHandler.menuDisplay=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Menu Details',
        'body.class' : 'menuDisplay'
      };
      //get the accountCreate html
      helpers.getTemplate('menuDisplay',templateData,function(err,data){
        if(!err && data){
          helpers.addUniversalTemplates(data,templateData,function(err,data){
            if(!err && data){
              callback(200,data,'html');
            }
            else
            {
              callback(500,undefined,'html');
            }
          })
        }
        else
        {
          callback(500,undefined,'html');
        }
      })
    }
    else{
      callback(405,undefined,'html');
    }
  }
//Export the module
module.exports=menuDisplayHandler;