var _data = require('../lib/data');
var helpers = require('../lib/helpers');

//Handler for account creation
var accountEditHandler={};

accountEditHandler.accountEdit=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Edit an Account',
        'body.class' : 'accountEdit'
      };
      //get the accountCreate html
      helpers.getTemplate('accountEdit',templateData,function(err,data){
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
module.exports=accountEditHandler;