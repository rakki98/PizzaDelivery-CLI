/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken' : false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

// Bind the logout button
app.bindLogoutButton = function(){
  document.getElementById("logoutButton").addEventListener("click", function(e){

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();

  });
};

// Log the user out then redirect them
app.logUserOut = function(){
  // Get the current token id
  var id = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'id' : id
  };
  app.client.request(undefined,'api/login','DELETE',queryStringObject,undefined,function(statusCode,responsePayload){
    // Set the app.config token as false
    
    app.setSessionToken(false);

    // Send the user to the logged out page
    window.location = '/session/deleted';

  });
};

// Bind the forms
app.bindForms = function(){
  if(document.querySelector("form")){

    var allForms = document.querySelectorAll("form");
    for(var i = 0; i < allForms.length; i++){
        allForms[i].addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();
        console.log(method)

        // Hide the error message (if it's currently shown due to a previous error)
       document.querySelector("#"+formId+" .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }



             // Turn the inputs into a payload
             var payload = {};
             var elements = this.elements;
             for(var i = 0; i < elements.length; i++){
               if(elements[i].type !== 'submit'){
                 // Determine class of element and set value accordingly
                 var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
                 var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
                 var elementIsChecked = elements[i].checked;
                 // Override the method of the form if the input's name is _method
                 var nameOfElement = elements[i].name;
                 if(nameOfElement == '_method'){
                   method = valueOfElement;
                 } else {
                   // Create an payload field named "method" if the elements name is actually httpmethod
                   if(nameOfElement == 'httpmethod'){
                     nameOfElement = 'method';
                   }
                   // Create an payload field named "id" if the elements name is actually uid
                   if(nameOfElement == 'uid'){
                     nameOfElement = 'id';
                   }
                   // If the element has the class "multiselect" add its value(s) as array elements
                   if(classOfElement.indexOf('multiselect') > -1){
                     if(elementIsChecked){
                       payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                       payload[nameOfElement].push(valueOfElement);
                     }
                   } else {
                     payload[nameOfElement] = valueOfElement;
                   }
     
                 }
               }
             }
        
        var queryStringObject = method == 'DELETE' ? payload : {};
        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
          // Display an error on the form if needed
          console.log(payload)
          
          if(statusCode !== 200){
            console.log(responsePayload)
            if(statusCode == 403){
              // log the user out
              console.log("illi")

              app.logUserOut();
             console.log("illi")

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
             // console.log(responsePayload.Error)
              // Set the formError field with the error text
             document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
            document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }

        });
      });
    }
  }
};
// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){

  // If account creation was successful, try to immediately log the user in
  if(formId == 'accountCreate'){
    // Take the phone and password, and use it to log the user in
    var newPayload = {
      'email' : requestPayload.email,
      'password' : requestPayload.password
    };

    app.client.request(undefined,'api/login','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);
        window.location = '/cart/all';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = 'cart/all';
  }

   // If forms saved successfully and they have success messages, show them
   var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','admin','cartCreate','checkOut'];
   if(formsWithSuccessMessages.indexOf(formId) > -1){
     document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
   }
 
   // If the user just deleted their account, redirect them to the account-delete page
   if(formId == 'accountEdit3'){
     app.logUserOut(false);
     window.location = '/account/deleted';
   }

   if(formId =='cartCreate')
   {
    window.location = '/cart/all';
   }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
  var tokenString = localStorage.getItem('token');
  console.log(tokenString);
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    }catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    console.log(target);
    target.classList.add('loggedIn');
  } else {
    console.log(target);
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback){
  var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    };
    app.client.request(undefined,'api/login','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/login','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function(){
  setInterval(function(){
    app.renewToken(function(err){
      if(!err){
        console.log("Token renewed successfully @ "+Date.now());
      }
    });
  },1000 * 60);
};

// Load data on the page
app.loadDataOnPage = function(){
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if(primaryClass == 'accountEdit'){
    app.loadAccountEditPage();
  }
  //Logic for displaying cart
  if(primaryClass=='cartList'){
    app.loadCartDataPage()
  }
  //Logic for edit cart
  if(primaryClass=='cartEdit'){
    app.loadCartEditPage()
  }

  if(primaryClass=='checkOut'){
    app.loadCheckOutPage()
  }

  if(primaryClass=='paymentHistory'){
    app.loadPaymentHistory();
  }
  //Logic for displaying menu
  if(primaryClass=='menuDisplay'){
    app.loadMenuPage();
  }
  
  
  
};

//Load Menu Page
app.loadMenuPage=function(){

  app.client.request(undefined,'api/menu','GET',undefined,undefined,function(statusCode,responsePayload){
    if(statusCode==200){
      
       // Determine how many checks the user has
       var allPizza = typeof(responsePayload.items) == 'object' && responsePayload.items instanceof Array && responsePayload.items.length > 0 ? responsePayload.items : [];
      
       if(allPizza.length > 0){

         // Show each created check as a new row in the table
         allPizza.forEach(function(cartData){
           // Get the data for the check
          
              
               var table = document.getElementById("checksListTable");
               var tr = table.insertRow(-1);
               tr.classList.add('checkRow');
               var td0 = tr.insertCell(0);
               var td1 = tr.insertCell(1);
               var td2 = tr.insertCell(2);
                
               td0.innerHTML = cartData.id;
               td1.innerHTML = cartData.title;
               td2.innerHTML = cartData.price;
             
            
         
         });

        if(app.config.sessionToken.isAdmin){
          document.getElementById('admin').style.visibility='visible'
        }
        else
        {
          document.getElementById('admin').style.visibility='hidden'
        }
         
       } 
    }
  })
}
//Load the payment history page
app.loadPaymentHistory=function(){
 // Get the email from the current token, or log the user out if none is there
 var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
 if(email){
   // Fetch the user data
 
   app.client.request(undefined,'api/paymentHistory','GET',undefined,undefined,function(statusCode,responsePayload){
     if(statusCode == 200){

       // Determine how many checks the user has
       var allPizza = typeof(responsePayload.paymentHistory) == 'object' && responsePayload.paymentHistory instanceof Array && responsePayload.paymentHistory.length > 0 ? responsePayload.paymentHistory : [];
     
       if(allPizza.length > 0){
        for(var j=0;j<allPizza.length;j++){
        
         var cartDatas=allPizza[j].item.cartObjects
         
          console.log(cartDatas.length)
        
         for(var i=0;i<cartDatas.length;i++){
           console.log(cartDatas[i])
           var table = document.getElementById("checksListTable");
             var tr = table.insertRow(-1);
             tr.classList.add('checkRow');
             var td0 = tr.insertCell(0);
             var td1 = tr.insertCell(1);
             var td2 = tr.insertCell(2);
             var td3=tr.insertCell(3)
             var td4=tr.insertCell(4)
             td0.innerHTML = cartDatas[i].id;
             td1.innerHTML = cartDatas[i].title;
             td2.innerHTML = cartDatas[i].price;
             td3.innerHTML=cartDatas[i].quantity;
             td4.innerHTML=allPizza[j].time
          
         }
        

        }
         
       }
     } else {
       // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
       //app.logUserOut();
       console.log(":Onde")
     }
   });
 } else {
   //app.logUserOut();
   console.log(":Erdu")
 }


}
//Load the check out page
app.loadCheckOutPage=function(){
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
 if(email){
   // Fetch the user data
   var queryStringObject = {
     'email' : email
   };
   app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,function(statusCode,responsePayload){
     if(statusCode == 200){
       console.log(responsePayload)

       // Determine how many checks the user has
       var allPizza = typeof(responsePayload.cartObjects) == 'object' && responsePayload.cartObjects instanceof Array && responsePayload.cartObjects.length > 0 ? responsePayload.cartObjects : [];
      
       // Determine how many checks the user has
       var allPizza = typeof(responsePayload.cartObjects) == 'object' && responsePayload.cartObjects instanceof Array && responsePayload.cartObjects.length > 0 ? responsePayload.cartObjects : [];
      
       if(allPizza.length > 0){

         // Show each created check as a new row in the table
         allPizza.forEach(function(cartData){
           // Get the data for the check
             console.log(cartData)
              
               var table = document.getElementById("checksListTable");
               var tr = table.insertRow(-1);
               tr.classList.add('checkRow');
               var td0 = tr.insertCell(0);
               var td1 = tr.insertCell(1);
               var td2 = tr.insertCell(2);
               var td3=tr.insertCell(3)
               var td4=tr.insertCell(4)
               td0.innerHTML = cartData.id;
               td1.innerHTML = cartData.title;
               td2.innerHTML = cartData.price;
               td3.innerHTML=cartData.quantity;
               document.querySelector("#amount").value = cartData.totalPrice;
               
            
         
         });
        
           app.client.request(undefined,'api/user','GET',queryStringObject,undefined,function(statusCode,responsePayload){
             if(statusCode == 200){
               console.log(responsePayload)
               // Put the data into the forms as values where needed
               document.querySelector("#userDetails .name").value = responsePayload.name;
               document.querySelector("#userDetails .address").value = responsePayload.address;
               document.querySelector("#userDetails .displayEmail").value = responsePayload.email;
               document.querySelector("#userDetails .pinCode").value = responsePayload.pinCode;
               document.getElementById('checkOut').style.display='block'
               // Put the hidden phone field into both forms
               var hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
               for(var i = 0; i < hiddenPhoneInputs.length; i++){
                   hiddenPhoneInputs[i].value = responsePayload.email;
               }
       
             }
            });
        
               
            
         
        

 
  }
     }});
    }
  }
//Load the cart edit page
app.loadCartEditPage=function(){
  // Get the check id from the query string, if none is found then redirect back to dashboard
  var id = typeof(window.location.href.split('=')[1]) == 'string' && window.location.href.split('=')[1].length > 0 ? window.location.href.split('=')[1] : false;
  if(id){
    // Fetch the check data
    var queryStringObject = {
      'id' : id
    };
    app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){

        // Put the hidden id field into both forms
        var hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput");
        for(var i = 0; i < hiddenIdInputs.length; i++){
            hiddenIdInputs[i].value = responsePayload.id;
        }
        console.log(responsePayload)
        // Put the data into the top form as values where needed
        document.querySelector("#checksEdit1 .displayIdInput").value = responsePayload.id;
        document.querySelector("#checksEdit1 .displayTitleInput").value = responsePayload.title;
        document.querySelector("#checksEdit1 .displayPrizeInput").value = responsePayload.price;
        document.querySelector("#checksEdit1 .quantity").value = responsePayload.quantity;
        var successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
        for(var i = 0; i < successCodeCheckboxes.length; i++){
          if(responsePayload.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1){
            successCodeCheckboxes[i].checked = true;
          }
        }
      } else {
        // If the request comes back as something other than 200, redirect back to dashboard
        window.location = '/cart/all';
      }
    });
  } else {
    window.location = '/cart/all';
  }
}
//Load the cart page
app.loadCartDataPage=function(){
 // Get the email from the current token, or log the user out if none is there
 var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
 if(email){
   // Fetch the user data
   var queryStringObject = {
     'email' : email
   };
   app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,function(statusCode,responsePayload){
     if(statusCode == 200){

       // Determine how many checks the user has
       var allPizza = typeof(responsePayload.cartObjects) == 'object' && responsePayload.cartObjects instanceof Array && responsePayload.cartObjects.length > 0 ? responsePayload.cartObjects : [];
      
       if(allPizza.length > 0){

         // Show each created check as a new row in the table
         allPizza.forEach(function(cartData){
           // Get the data for the check
          
              
               var table = document.getElementById("checksListTable");
               var tr = table.insertRow(-1);
               tr.classList.add('checkRow');
               var td0 = tr.insertCell(0);
               var td1 = tr.insertCell(1);
               var td2 = tr.insertCell(2);
               var td3=tr.insertCell(3)
               var td4=tr.insertCell(4)
               td0.innerHTML = cartData.id;
               td1.innerHTML = cartData.title;
               td2.innerHTML = cartData.price;
               td3.innerHTML=cartData.quantity;
               td4.innerHTML = '<a href="/cart/edit?id='+cartData.id+'">Edit / Delete</a>';
            
         
         });

        
           document.getElementById("createCheckCTA").style.display = 'block';
           

       } else {
         // Show 'you have no checks' message
         document.getElementById("noChecksMessage").style.display = 'table-row';

         //Hide the checkout button
         document.getElementById("checkOut").style.display='none';

         // Show the createCheck CTA
         document.getElementById("createCheckCTA").style.display = 'block';

       }
     } else {
       // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
       //app.logUserOut();
       console.log(":Onde")
     }
   });
 } else {
   //app.logUserOut();
   console.log(":Erdu")
 }



}
// Load the account edit page specifically
app.loadAccountEditPage = function(){
  // Get the phone number from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    app.client.request(undefined,'api/user','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        // Put the data into the forms as values where needed
        document.querySelector("#accountEdit1 .name").value = responsePayload.name;
        document.querySelector("#accountEdit1 .address").value = responsePayload.address;
        document.querySelector("#accountEdit1 .displayEmail").value = responsePayload.email;

        // Put the hidden phone field into both forms
        var hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
        for(var i = 0; i < hiddenPhoneInputs.length; i++){
            hiddenPhoneInputs[i].value = responsePayload.email;
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }



};



// Init (bootstrapping)
app.init = function(){

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  //Load data
  app.loadDataOnPage();

};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};