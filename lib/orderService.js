/**
 * Following are the responsibilities of this file.
 * To checkout the order for the cart
 * User can pay moiney through  visa or mastercard integrated with stripe api
 * if the payment is successful user gets the message reagarding the order  integregated with mailgun api
 * for every successful transaction the cart object of the user is deleted and 
 * payments detail are wriiten in paymentHistory directory for each of the users
 **/

var _data=require('./data');
var fs=require('fs')
var helpers=require('./helpers')
var loginService=require('./loginService')

var order={}
//method to handle all the requests

order.handleRequest=function(data,callback){
   var acceptableMethod = ['post'];
   if(acceptableMethod.indexOf(data.method) > -1){
    order._orders[data.method](data,callback);
   } else {
     callback(400,{'Error':'Method not supported'});
   }
 };
 //Container for the method supported 
 order._orders={}

 order._orders.post=function(data,callback){     
    //Get the id from the headers
    var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var paymentBrand = typeof(data.payload.paymentBrand) == 'string' && ['visa','mastercard'].indexOf(data.payload.paymentBrand) > -1 ? data.payload.paymentBrand : false;
    console.log(data)
    if(token  && paymentBrand){
      _data.read('tokens',token,function(err,tokenData){
           if(!err && tokenData)
           {  var email=tokenData.email
        //Lookup the user to check whether he is admin to add items
        _data.read('cart',email,function(err,cartData){
          //if no error and userData exists then proceed
          if(!err && cartData.cartObjects)
          { var totalPrice=0;            
            cartData.cartObjects.forEach(function(data){
               
            totalPrice+=parseInt(data.totalPrice);
            })
              // Define the token source
              var paymentToken = 'tok_'+paymentBrand;
              // Create the date time now
              var dateTime = Date(Date.now()).toString();
              // Create the data of payment
              var amount = totalPrice;
              var currency = 'usd';
              var description = 'charge for '+email+' - '+dateTime;
              var source = paymentToken;
              helpers.stripe(amount,currency,description,source,function(err){
                if(!err){
                  // Delete the user cart
                  _data.delete('cart',email,function(err){
                    if(!err){
                        // Send email to user after payment
                        var to = email;
                        var subject = 'Your pizza order at '+dateTime;
                        var text = 'This is your order <br>'+cartData.cartObjects;
                        //Create the payment object which contains the pizza details,timestamp and price
                        var payment={}
                        payment.item=cartData;
                        payment.time=dateTime;
                        payment.price=totalPrice;
                        //Create payments object which contains paymentHistory property which is an array to track the transactions of the user
                        var payments={}
                        payments.paymentHistory=[];
                        payments.paymentHistory.push(payment);
                        //Create the payment object with respect to the email
                         // Call mailgun to send the email to user
                         helpers.mailgun(to,subject,text,function(err,msg){
                          if(!err){
                            callback(500,{'Error' : 'Could not sent the email to user'});
                          }
                           else {
                            _data.create('paymentHistory',email,payments,function(err){
                              if(!err)
                              {  console.log(msg)
                                callback(200);
                              }
                              else
                              {   //if error occurs that means user already exist add the new cart object to existing cart
                                  _data.read('paymentHistory',email,function(err,paymentData){
                                      if(!err && paymentData)
                                      {        
                                        paymentData.paymentHistory.push(payment);
                                                      _data.update('paymentHistory',email,paymentData,function(err){
                                                          if(!err){
                                                              // Return the data about the new check
                                                              console.log(msg)
                                                              callback(200);
                                                          } else {
                                                              callback(500,{'Error' : 'Could not update the user with the new check.'});
                                                          }
                                                          });                                             
                                      }
                                      else{
                                          callback(400);
                                      }
                                    })
                                }
                          })
                         
                       
                          }
                        });
                    

                        }
                        else {
                            callback(500,{'Error' : 'Could not delete the user cart'});
                          }
                        });
                    }
                     else {
                        
                        callback(500,{'Error' : 'Could not transfer the money'});
                      }
                    });
        }           
        else
          {callback(403,{'error':'empty cart plz fill the cart'});}
        });
      }
      else{
        callback(403,{"Error" : " token is invalid."});
      }
      });
    }
    else{
      callback(404,{"Error" : "Missing required token in header, or email.",token,paymentBrand});
       }
};

// Export the module
module.exports=order;