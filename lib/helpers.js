//Container for all the handlers


var helpers={}
var crypto=require('crypto');
var config=require('./config')
var querystring = require('querystring');
var https=require("https")
var path=require('path')
var fs=require('fs');
var _data=require('./data')


//Create a SHA256 hash
helpers.hash=function(str){
    if(typeof(str)=='string' && str.length>0){
     var hash=crypto.createHash('sha256',config.hashingSecret).update(str).digest('hex');
     return hash;
    }
    else
    return false;
}
//Parse a JSON string to an object
helpers.parsedJSONToObject=function(str)
{
    try{
     var obj=JSON.parse(str);
     return obj;
    }
    catch(e){
    return {};
}
};
//Create a random string 
helpers.createRandomString=function(strLength){
    strLength=typeof(strLength) =='number' && strLength>0 ? strLength : false;
    if(strLength)
    {
      var possibleCharacters='abcdefghijklmnopqrstuvwxyz1234567890';
      //start the final string 
      var str=''
      for(i=1;i<=strLength;i++)
      {
          var random=possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length));
          str+=random;
      }
      return str;
    }
    else
    {
        return false;
    }

}
//To check whether password contains a upper case letter
helpers.uppercase=function(password){
    var regex = /^(?=.*[A-Z]).+$/;

    if( regex.test(password) ) {
        return true;
    }
    else
    {return false;}
   
};
//To check whether password contains a lower case letter

helpers.lowercase=function(password){
    var regex = /^(?=.*[a-z]).+$/;

    if( regex.test(password) ) {
        return true;
    }
    else
    {return false;}
   
   
};
//To check whether password contains a special character

helpers.specialCharacters=function(password){
    var regex = /^(?=.*[0-9_\W]).+$/;

    if( regex.test(password) ) {
        return true;
    }
    else
    {return false;}
   
};
//To validate the password
helpers.validatePassword=function(password){
  var upperCase= helpers.uppercase(password);
  var lowerCase=helpers.lowercase(password);
  var specialCharacters=helpers.specialCharacters(password);
  
  if(upperCase && lowerCase  && specialCharacters)
  {
      return true;
  }
  else
  {return false;
    }

};  
// Payment by stripe API
  helpers.stripe = function(amount,currency,description,source,callback){
    // Configure the request payload
    var payload = {
      'amount' : amount,
      'currency' : currency,
      'description' : description,
      'source' : source,
    }
  
    // Stringify the payload
    var stringPayload = querystring.stringify(payload);
  
    // Configure the request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.stripe.com',
      'method' : 'POST',
      'auth' : config.stripe.secretKey,
      'path' : '/v1/charges',
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    }
  
    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
      // Grab the status of the sent request
      var status = res.statusCode;
      // Callback successfully if the request went through
      if(status==200 || status==201){
        callback(false);
      } else {
        callback('Status code return was '+status);
      }
    });
  
    // Bind to the error event so it doesn't get the thrown
    req.on('error',function(e){
      callback(e);
    });
  
    // Add the payload
    req.write(stringPayload);
  
    // End the request
    req.end();
  }
  
  // Send the email by mailgun API
  helpers.mailgun = function(to,subject,text,callback){
    // Configure the request payload
    var payload = {
      'from' : config.mailgun.sender,
      'to' : to,
      'subject' : subject,
      'text' : text
    }
  
    // Stringify the payload
    var stringPayload = querystring.stringify(payload);
  
    // Configure the request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.mailgun.net',
      'method' : 'POST',
      'auth' : config.mailgun.apiKey,
      'path' : '/v3/'+config.mailgun.domainName+'/messages',
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    }
  
    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
      // Grab the status of the sent request
      var status = res.statusCode;
      // Callback successfully if the request went through
      if(status==200 || status==201){
        callback(true,{'msg':res});
      } else {
        callback('Status code return was '+status);
      }
    });
  
    // Bind to the error event so it doesn't get the thrown
    req.on('error',function(e){
      callback(e);
    });
  
    // Add the payload
    req.write(stringPayload);
  
    // End the request
    req.end();
  }

//get the string content of  a template
helpers.getTemplate=function(templateName,data,callback){
  tempalteName=typeof(tempalteName) == 'string' && tempalteName.length > 0 ? templateName : '';
  data=typeof(data) == 'object' && data !=null ? data : {};

  if(templateName)
  {
    var templatesDir=path.join(__dirname,'/../templates/');
  fs.readFile(templatesDir+templateName+'.html','utf-8',function(err,str){
    if(!err && str && str.length > 0)
    { //Do interpolation on the string
     var finalString=helpers.interpolate(str,data);
     callback(false,finalString)  
    }
    else
    {
      callback("No tempalte found");
    }
  })
  } 
}

//Take a given string and a object and replace with the keys
helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
     if(config.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.templateGlobals[keyName]
     }
  }
  
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

//Add global headers and footers

helpers.addUniversalTemplates=function(str,data,callback){
  str=typeof(str) == 'string' && str.length>0 ? str : "";
 data=typeof(data) == 'object' && data !=null ? data : {};

 helpers.getTemplate("_headers",data,function(err,headerString){
   if(!err && headerString)
   {
    helpers.getTemplate("_footers",data,function(err,footerString){
      if(!err && footerString){
        var finalString=headerString+str+footerString;
        callback(false,finalString)
      } 
      else
      {
        callback("No footerr tempoaltes")
      }
    })
   }
   else
   {
     callback('No headers temoplate')
   }
 })

};
  // Export the module


// Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};
module.exports=helpers;