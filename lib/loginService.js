/**
 * Following are the responsibilities of this file.
 * - Handle the token creation
  * - Handle token deletion
 * - Handle the method to extend the duration of token time
  **/

//Dependecies
var helpers=require('./helpers');
 var _data=require('./data');

 var token={};
 //method to handle all the requests

 token.handleRequest=function(data,callback){
    var acceptableMethods = ['post','put','delete','get'];
    if(acceptableMethods.indexOf(data.method) > -1){
      token._tokens[data.method](data,callback);
    } else {
      callback(400,{'Error':'Method not supported'});
    }
  };
//Container to handle all the methods
token._tokens={};

/** tokens - post
* Responsibililty : To create the new token when the user logged in 
* Required data(mandatory fields):  email, password 
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order 
* - password -  minimum 8 characters, should contain atleast on capital letter
 *                                       should contain numbers and character
 *                                       and atleast one Symbol

* Optional data: none
**/

token._tokens.post = function(data,callback){
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(email && password){
      // Lookup the user who matches that email
      _data.read('users',email,function(err,userData){
        if(!err && userData){
          // Hash the sent password, and compare it to the password stored in the user object
          var hashedPassword = helpers.hash(password);
          var isAdmin=userData.isAdmin;
          if(hashedPassword == userData.hashedPassword){
            // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
            var id = helpers.createRandomString(20);
            var expires = Date.now() + 1000 * 60 * 60 *60 *24;
            var tokenObject = {
              'email' : email,
              'id' : id,
              'expires' : expires,
              'isAdmin':isAdmin
            };
            // Store the token
            _data.create('tokens',id,tokenObject,function(err){
              if(!err){
                callback(200,tokenObject);
              } else {
                callback(500,{'Error' : 'Could not create the new token'});
              }
            });
          } else {
            callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
          }
        } else {
          callback(400,{'Error' : 'Could not find the specified user.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field(s).'})
    }
  };  
 /** tokens - get
* Responsibililty : To display the token id for the user
* Required data(mandatory fields): id
* Desciption of each fields :
* - id -valid id to lookup
* Optional data: none
**/
  token._tokens.get = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          callback(200,tokenData);
        } else {
          callback(404);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field, or field invalid'})
    }
  };
/** token (method)-verifyToken
* Responsibililty : To verify the token
* Required data(mandatory fields):  email, token id 
* Desciption of each fields :
* - email - should be valid email address in order to send the details of the order 
* - token id 
* Optional data: none
**/
token.verifyToken = function(id,email,callback){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check that the token is for the given user and has not expired
        if(tokenData.email == email && tokenData.expires > Date.now()){
          callback(true);
        } else {
          callback(false,{'error':'invalid email or token has expired'});
        }
      } else {
        callback(false,{'error':'token does not exist'});
      }
    });
  };

/** token (method)-put
* Responsibililty : To extend the duration of token
* Required data(mandatory fields):   token id ,extends (boolean)
* Desciption of each fields :
* - extends - if true timestamp of token will be extended or else not
* token id -id of the that was created when user was  logged in
* Optional data: none
**/
token._tokens.put = function(data,callback){
  var payload=data.payload;
  if(payload){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60 * 24;
          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{"Error" : "The token has already expired, and cannot be extended."});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  }
  else {
    callback(400,{"Error": " Missing required field(s) or field(s) are invalid."});
  }
 }
 else {
  callback(400,{"Error": " Payload Missing"});
}
};

/** token (method)-delete
* Responsibililty : To delete a particular token when user logs out
* Required data(mandatory fields):   token id 
* Desciption of each fields :
* 
* - token id -id of the that was created when usert logged in
* Optional data: none
**/
token._tokens.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};
 
// Export the module
 module.exports=token;
