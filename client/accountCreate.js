var _data = require('../lib/data');
var helpers = require('../lib/helpers');

//Handler for account creation
var accountCreateHandlers={};

accountCreateHandlers.accountCreate=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Create an Account',
        'head.description' : 'Signup is easy and only takes a few seconds.',
        'body.class' : 'accountCreate'
      };
      //get the accountCreate html
      helpers.getTemplate('accountCreate',templateData,function(err,data){
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
module.exports=accountCreateHandlers;