/**
 * Following is the responsibilityof this file.
 * to display the paymentHistory of the logged in user
 * 
 **/

var _data=require('./data');
var loginService=require('./loginService')


var paymentHistory={}
//method to handle all the requests

paymentHistory.handleRequest=function(data,callback){
   var acceptableMethod = ['get'];
   if(acceptableMethod.indexOf(data.method) > -1){
    paymentHistory._paymentHistorys[data.method](data,callback);
   } else {
     callback(400,{'Error':'Method not supported'});
   }
 };
 //Container for the method supported 
 paymentHistory._paymentHistorys={}
/** paymentHistory - get
* Responsibililty : To display the paymentHistory of the logged in user
* Required data(mandatory fields): oken,email
* Desciption of each fields :
* -email - To identify the user
*  -token -to vaildate the user
* Optional data: none
**/
 paymentHistory._paymentHistorys.get=function(data,callback){
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    if(token ){
      _data.read('tokens',token,function(err,tokenData){
           if(!err && tokenData)
           {  var email=tokenData.email
              _data.read('paymentHistory',email,function(err,data){
              if(!err && data)
              {callback(200,data);}
              else
              callback(400);
    })  
 }
 else{
 callback(400,{'error':'invalid'})
    }
    });
    }
}

//Export the moudle
module.exports=paymentHistory;