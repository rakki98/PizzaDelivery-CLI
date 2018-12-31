var _data = require('../lib/data');
var helpers = require('../lib/helpers');

//Handler for account creation
var tokenDeleteHandlers={};

tokenDeleteHandlers.tokenDeleted=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Logged out',
        'head.description' : 'Youve been logged out',
        'body.class' : 'sessionDeleted'
      };
      //get the accountCreate html
      helpers.getTemplate('sessionDeleted',templateData,function(err,data){
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
module.exports=tokenDeleteHandlers;