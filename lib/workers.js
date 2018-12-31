/**Following is the responsibility of the file
 * This file  runs every 5 minutes and clears the tokens once they are expired
 *
 */
var _data=require('./data')

var workers={}
//Clears or deletes the token once they are expired
workers.clearTokens=function(){
    _data.list('tokens',function(err,tokens){
      if(!err && tokens.length > 0 ){      
      for(var i=0;i<tokens.length;i++)
        {   var token=tokens[i];
            _data.read('tokens',token,function(err,tokenData){
            if(!err && tokenData && tokenData.expires < Date.now()){
                  
                   _data.delete('tokens',token,function(err){
                       if(!err)
                       { //console.log('Deleted ',token);
                       }
                       else
                       {//console.log('Not Deleted ',token);
                       }
                    })
                }
            // else
            // {console.log("Need not delete")}
            })   
        }
    }
    else
    {
       // console.log("No files to delete")
    }
    })
}
//Method that runs every five minute which calls clearTokens function
workers.rotation = function(){
    setInterval(function(){
      workers.clearTokens();
    },1000 *1);
  }
//init function
 workers.init=function(){
     workers.rotation();

 }
 // Export the module
 module.exports=workers;