/**
 * Following are the responsibilities of this file.
 * Call token service and generate tokens which are associated with user
 * if the user is logged in he can enjoy following services
 * - Provides the user to add items to their cart 
 * - Provides the user to delete items from their cart
 * - Provides the user to update items 
 **/

 //Dependencies
 var _data=require('./data');
 var loginService=require('./loginService')
 


var cart={}
 //method to handle all the requests

 cart.handleRequest=function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        cart._carts[data.method](data,callback);
    } else {
      callback(400,{'Error':'Method not supported'});
    }
  };
//Container to handle all the methods
cart._carts={};
/** cart - post
* Responsibililty : To add the pizza to cart
* Required data(mandatory fields):  pizza Id,quantity,token
* Desciption of each fields :
* - pizza Id - should be valid pizza id provided in the menu
* - quantity- total number of pizza of particular type  
*  -token -to vaildate the user
* Optional data: none
**/
cart._carts.post=function(data,callback){
    //Get all the required fields from the headers and the payload
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var email = typeof(data.headers.email) == "string" && data.headers.email.trim().length > 0 ? data.headers.email.trim() : false;
    var id=typeof(data.payload.pizzaId) == "string" && data.payload.pizzaId.trim().length == 5 ?  data.payload.pizzaId.trim() : false;
    var quantity=typeof(data.payload.quantity) == "string"  ?  data.payload.quantity : false;
    console.log(data.payload,quantity)
    
    //Check whether all the fields are provided
    if(token && id && quantity){
       _data.read('tokens',token,function(err,tokenData){
            if(!err && tokenData)
            {  var email=tokenData.email
               //Check if the pizaa id is valid if valid create an object
               _data.read('menu','pizza',function(err,pizzaData){
                   if(!err && pizzaData){
                        var flag=0;
                        var pizzaObjects=pizzaData.items;
                        var pos=0;
                        for(var i=0;i<pizzaObjects.length;i++)
                        {
                            if(pizzaObjects[i].id==id)
                            {
                                
                                flag=1;
                                break;
                            }
                            pos++;
                        }

                        if(flag){
                         pizzaObjects[pos].quantity=quantity;
                         pizzaObjects[pos].totalPrice=pizzaObjects[pos].price * quantity;
                         var items={}
                         items.cartObjects=[];
                         items.cartObjects.push(pizzaObjects[pos]);
                         //Create the cart object with respect to the email
                         _data.create('cart',email,items,function(err){
                             if(!err)
                             {
                               callback(200);
                             }
                             else
                             {   //if error occurs that means user already exist add the new cart object to existing cart
                                 _data.read('cart',email,function(err,cartData){
                                     if(!err && cartData)
                                     {         //To check whether the cart object with the particular id already exist
                                               //if it exist user cannot add the item to the cart he/she may update the quantity
                                        var flag=1;
                                        var cartObjects=cartData.cartObjects;
                                        for(var i=0;i<cartObjects.length;i++)
                                        {
                                            if(cartObjects[i].id==id)
                                            {
                                                
                                                flag=0;
                                                break;
                                            }
                                            
                                        }
                                        if(flag){  
                                            cartData.cartObjects.push( pizzaObjects[pos]);
                                            _data.update('cart',email,cartData,function(err){
                                                if(!err){
                                                    // Return the data about the new check
                                                    callback(200,cartData);
                                                } else {
                                                    callback(500,{'Error' : 'Could not update the user with the new check.'});
                                                }
                                                });
                                            }                                    
                                        else{
                                                   callback(400,{'Error':'item already exist try to update'});
                                        }                                                                   
                                    }
                                    else{
                                         callback(400);
                                    }
                                })
                             }
                        })
                   }
                   else{
                       callback(400,{'Error':'invalid pizza id'});
                   }
                }
             })
               
            }
            else
            {
                callback(400,{'Error':'invalid token'})
            }
        })
    }
    else{
        callback(400,{'Error':'missing required fields or token in headers',token,id,quantity});
    }
};

/** cart - get
* Responsibililty : To display all the pizza in the users cart
* Required data(mandatory fields):  pizza Id,quantity,token
* Desciption of each fields :
* -email - To identify the user
*  -token -to vaildate the user
* Optional data: none
**/
cart._carts.get=function(data,callback){
    //Get all the credentials from the quertString and headers
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 5 ? data.queryStringObject.id.trim() : false;
 
    if(token || id){

     _data.read('tokens',token,function(err,tokenData){
            if(!err && tokenData)
            {  var email=tokenData.email;
                _data.read('cart',email,function(err,cartData){
                if(!err && cartData && id){
                //Get the specific cart object wrt id
                 var cartObjects=cartData.cartObjects;
                  for(var i=0;i<cartObjects.length;i++)
                  {
                      if(cartObjects[i].id==id)
                      {
                        callback(200,cartObjects[i])
                        console.log(cartObjects[i])
                        break;
                      }                     
                  }
                }
                else if(!err && cartData && token)
                {   
                    callback(200,cartData)
                }
                else
                {callback(200)}
            })
         }
         else
         {callback(403,{'Error':'token does not match to the user'})}
     });
    }
    else{
        callback(400,{'Error':'Missing email id or tokens'});
    }
 };
/** cart - put
* Responsibililty : To update the quantity of items in cart
* Required data(mandatory fields):  pizza Id,quantity,token,email
* Desciption of each fields :
* -email - To identify the user
*  -token -to vaildate the user
* -id ,qunatity - To identify which pizza id's quantity to be updated by specified quantity
* Optional data: none
**/
cart._carts.put=function(data,callback){
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var id=typeof(data.payload.id) == "string" && data.payload.id.trim().length == 5 ?  data.payload.id.trim() : false;
    var quantity=typeof(data.payload.quantity) == "string" ?  data.payload.quantity : false;
    
    if(token && id && quantity){
        _data.read('tokens',token,function(err,tokenData){
             if(!err && tokenData)
             {  var email=tokenData.email
             //Lookup the cart and get the details of the cart of the particular user
           _data.read('cart',email,function(err,cartData){
               var flag=0;
               if(!err && cartData){
                  var cartObjects=cartData.cartObjects;
                  for(var i=0;i<cartObjects.length;i++)
                  {
                      if(cartObjects[i].id==id)
                      {
                          cartObjects[i].quantity=quantity;
                          flag=1;
                          break;
                      }                     
                  }
                  if(flag){  
                        cartData.cartObjects=cartObjects;
                        _data.update('cart',email,cartData,function(err){
                            if(!err){
                                // Return the data about the new check
                                callback(200,cartData);
                            } else {
                                callback(500,{'Error' : 'Could not update the user with the new check.'});
                            }
                            });}
                  
                  else{
                      callback(403,{'Error':'could not mention the id'});
                  }
               }
               else
               {
                   callback(403,{'Error':'cart does not exist for the given email id'})}
           })
        }
        else
        {callback(403,{'Error':'token does not match to the user'})}
    });
  }
  else
  {
      callback(400,{'Error':'missing fields'})
  }
};

/** cart - delete
* Responsibililty : To delete an item from the cart
* Required data(mandatory fields):  pizza Id,quantity,token,email
* Desciption of each fields :
* -email - To identify the user
*  -token -to vaildate the user
* -id -To identify which pizza id needs to be deleted from the cart
* Optional data: none
**/
cart._carts.delete=function(data,callback){
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var id=typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 5 ?  data.queryStringObject.id.trim() : false;
    if(token && id ){
        _data.read('tokens',token,function(err,tokenData){
             if(!err && tokenData)
             {  var email=tokenData.email
            //Lookup the cart and get the details of the cart of the particular user          
           _data.read('cart',email,function(err,cartData){
               var flag=0;
               if(!err && cartData){
                  var cartObjects=cartData.cartObjects;
                  for(var i=0;i<cartObjects.length;i++)
                  {
                      if(cartObjects[i].id==id)
                      {
                          cartObjects.splice(i,1);
                          flag=1;
                          break;
                      }                      
                  }
                  if(flag){  
                        cartData.cartObjects=cartObjects;
                        _data.update('cart',email,cartData,function(err){
                            if(!err){
                                // Return the data about the new check
                                callback(200,cartData);
                            } else {
                                callback(500,{'Error' : 'Could not update the user with the new check.'});
                            }
                            });
                        }                  
                  else{
                      callback(403,{'Error':'could not mention the id'});
                  }
               }
               else
               {
                   callback(403)}
           })
        }
        else
        {callback(403,{'Error':'token does not match to the user'})}
    });
    }
    else
    {
        callback(400,{'Error' : 'missing fields'})
    }
};

// Export the module
 module.exports=cart;


 