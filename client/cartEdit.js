var helpers = require('../lib/helpers');

//Handler for account creation
var cartEditHandlers={};

cartEditHandlers.cartEdit=function(data,callback){
    if(data.method=='get'){
      var templateData = {
        'head.title' : 'Edit the cart ',
        'head.description' : 'Edit the cart',
        'body.class' : 'cartEdit'
      };
      //get the accountCreate html
      helpers.getTemplate('cartEdit',templateData,function(err,data){
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
module.exports=cartEditHandlers;