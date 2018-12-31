/**
 * Following are the responsibilities of this file.
 * - Handle user creation
 * - Call token service and generate tokens which are associated with user
 * - Handle user deletion
 * - Handle user data update functionality
 **/


 //Dependencies 
 var fs=require('fs');
 var helpers=require('./helpers');
 var _data=require('./data');
 var loginService=require('./loginService')

 
 var user = {};

 
 //method to handle all the requests

 user.handleRequest=function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
      user._users[data.method](data,callback);
    } else {
      callback(400,{'Error':'Method not supported'});
    }
  };
//Container to handle all the methods
user._users={};

/** Users - post
* Responsibililty : To create the new user
* Required data(mandatory fields):  name,email, password ,street address , pinCode (*)
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order 
* - password -  minimum 8 characters, should contain atleast on capital letter
 *                                       should contain numbers and character
 *                                       and atleast one Symbol
 * name,address,pincode  - to send the pizza order to correct address
 *  
* Optional data: none
**/

  user._users.post=function(data,callback){
      //Check whether data (payload) is sent 
      var payload=data.payload;
    
      if(payload)
      { //Check for all the required fields
        var name=typeof(payload.name) == 'string' && payload.name.trim().length > 0 ? payload.name.trim() : false;
        var email=typeof(payload.email) == 'string' && payload.email.trim().length > 0 ? payload.email.trim(): false;
        var password = typeof(payload.password) == 'string' && payload.password.trim().length >= 8 ? payload.password.trim() : false;
        var address=typeof(payload.address) == 'string' && payload.address.trim().length > 0 ? payload.address.trim() : false;
        var pinCode=typeof(payload.pinCode) == 'string' && payload.pinCode.trim().length > 0 ? payload.pinCode.trim() : false;
        var isAdmin=typeof(payload.admin) == 'string' && payload.pinCode.trim().length > 0 ? payload.admin.trim() : false;

        if(name && email && password && address && pinCode)
       
        {  //Validation of the password
         
            if(!helpers.validatePassword(password))
            {
              console.log("312!")
              callback(400,{'Error':'minimum 8 characters, should contain atleast on capital letter should contain numbers and character and atleast one Symbol'});
                 return;
            }
            // Make sure the user doesnt already exists
            _data.read('users',email,function(err){
                if(err)
                {
                  // Hash the password
                  var hashedPassword = helpers.hash(password);
                  if(hashedPassword)
                  {  //Create new user object
                      var userObject={
                          'name' : name,
                          'email' : email,
                          'hashedPassword' : hashedPassword,
                          'address' : address,
                          'pinCode' : pinCode,
                          'isAdmin':isAdmin
                         }
                      //Store the user in the file
                      _data.create('users',email,userObject,function(err){
                            if(!err)
                            callback(200);
                            else
                            callback(500,{'Error' : 'Could not create the new user'});
                      });
                  }
                  else
                  {
                      callback(500,{'Error' : 'Could not hash the user\'s password.'});
                  
                  }
                }
                else
                {                 
                   // User already exists
                   callback(400,{'Error' : 'A user with that email  already exists'});   
                   
               }
            });  
        }
        else
        {   console.log(data)
            callback(400,{'Error':' Required fieds are'});
       
        }     
      }
      else
      {
          callback(400,{'Error':'Payload is missing'});
      
      }
  };

  /** Users - get
* Responsibililty : To fetch the details of tehe user basedf on email
* Required data(mandatory fields): email
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order 

**/
  user._users.get=function(data,callback){
    console.log(data)
    var email=typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim(): false;
    if(email)
    {   // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        loginService.verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
      _data.read('users',email,function(err,data){
          if(!err && data)
          {
               // Remove the hashed password from the user user object before returning it to the requester
               delete data.hashedPassword;
               callback(200,data);
          }
          else
          callback(404);
      });
    }else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."})
      }
    });
    }
    else
    {
       callback(400,{'Error' : 'Get Method Missing id  in query string'});
    }

};

 /** Users - put
* Responsibililty : To update the details of the user
* Required data(mandatory fields): email
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order .Cannot update the email
* Optional data : password,address,pinCode
**/
user._users.put=function(data,callback){
    var payload=data.payload;
   // console.log(payload);
   //Check for the required field
   var email=typeof(payload.email) == 'string' && payload.email.trim().length > 0 ? payload.email.trim(): false;
   //Check for the optional fields
    var name=typeof(payload.name) == 'string' && payload.name.trim().length > 0 ? payload.name.trim() : false;
    var password = typeof(payload.password) == 'string' && payload.password.trim().length >= 8 ? payload.password.trim() : false;
    var address=typeof(payload.address) == 'string' && payload.address.trim().length > 0 ? payload.address.trim() : false;
    var pinCode=typeof(payload.pinCode) == 'string' && payload.pinCode.trim().length > 0 ? payload.pinCode.trim() : false;
        if(email){
            if(name ||password || address || pinCode)
            {  // Get token from headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          
                // Verify that the given token is valid for the email 
                loginService.verifyToken(token,email,function(tokenIsValid){
                  if(tokenIsValid){
          
                
                //Lookup the user based on email
                _data.read('users',email,function(err,userData){
                    if(name){
                        userData.name = name;
                      }
                      if(address){
                        userData.address = address;
                      }
                      if(password){
                        userData.hashedPassword = helpers.hash(password);
                      }
                      if(pinCode){
                        userData.pinCode = pinCode;
                      }
                      
                      _data.update('users',email,userData,function(err){
                        if(!err){
                          callback(200);
                        } else {
                          callback(500,{'Error' : 'Could not update the user.'});
                        }
                      });
    
                });
                } 
                else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."});
               }
              });
           }
        else 
         {
            callback(400,{'Error' : 'Missing fields to update.'});
         }
      
        }
      else
      {
       callback(400,{'Error' : 'Missing required field.',data});
      }
};
    
  /** Users - delete
* Responsibililty : To delete the details of the user
* Required data(mandatory fields): email
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order .Cannot update the email
* Optional data : none
**/
user._users.delete=function(data,callback){
  console.log("delete",data)
    var email=typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim(): false;
    if(email)
    {    // Get token from headers
         var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
         // Verify that the given token is valid for the phone number
         loginService.verifyToken(token,email,function(tokenIsValid){
           if( tokenIsValid){  
               // Lookup the user
          _data.read('users',email,function(err,userData){
          if(!err && userData)
        {
            // Delete the user's data asscoiated cart data and payment history of the user
             _data.delete('users',email,function(err){
              if(!err)
              {
               _data.delete('cart',email,function(err){
                 if(!err)
                 {
                   _data.delete('paymentHistory',email,function(err){
                     if(!err)
                     {callback(200);}
                     else{callback(200,{'Error':'Payment history does not exist'});}
                   })
                 }
                 else{
                   callback(200,{'Error':'Cart does not exist user deleted'});
                 }
               })
              }  
              else
              {                
                    callback(500,{'Error' : 'Could not delete the specified user'});
               
              }
             });    
        }
          else {
             callback(400,{'Error' : 'Could not find the specified user.'});
              }
         });
        }
        else {
            callback(403,{"Error" : err});
          }
        });
    }
    else
    {
        callback(403,{"Error" : "nangu gothila"});        
    }       
};

 // Export the module
 module.exports=user;