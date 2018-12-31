var helpers = require('../lib/helpers');

//Handler for account creation
var cartCreateHandlers={};

cartCreateHandlers.cartCreate=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Create the cart ',
        'head.description' : 'Easy',
        'body.class' : 'cartCreate'
      };
      //get the accountCreate html
      helpers.getTemplate('cartCreate',templateData,function(err,data){
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
module.exports=cartCreateHandlers;