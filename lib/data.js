//Library methods for storing and retreving data

//Dependencies
// 1.fs (file system) - To read and write files both synchronously and assynchronously
// 2.path -To access the path by directory

var fs=require("fs");
var path=require("path");

var lib={}
//To go one directory above from current directory and point to .data directory
lib.baseDir=path.join(__dirname,"/../.data/");

//Method for creating the file in .data directory
//Parameters that needs to be passed:
// 1. directory
// 2.file name
// 3.data
// 4 .callback function
lib.create=function(dir,file,data,callback){
   //Open the file in write mode
   
   fs.open(lib.baseDir + dir+ '/'+file + '.json','wx',function(err,fileDescriptor){
   //No error and fileDescriptor exists
    if(!err && fileDescriptor)
       {
         //Convert the data into Json format
         var stringData=JSON.stringify(data);
         //Write to file
         fs.write(fileDescriptor,stringData,function(err){
            if(!err)
            {
                //Contents are successfuly written to the file and no error
                //File needs to be closed after writing the data
                fs.close(fileDescriptor,function(err){
                    if(!err)
                    { //File succesfully closed
                        callback(false);
                    }
                    else{
                        callback('Error closing file');
                    }
                })
              
            }
            else
            {
                //Error occured while writing to the file
                callback('Error writing to new file');
            }
            
         })
       }
       else
       {
        callback('Could not create file,it may already exist');
  
       }
   } )

};

//Method to read from the exsiting file
//Parameters to be passed are :
//1. directory
// 2.file name
lib.read=function(dir,file,callback){

    fs.readFile(lib.baseDir + dir + '/' + file + '.json' ,'utf8',function(err,data){
        if(!err && data)
        {
         var parsedData=JSON.parse(data);
         callback(false,parsedData);

        }
        else{

            callback(err);
        }
    })
};


//Method to update the existing file
//Paremeters to be passed are:
// 1. directory
// 2.file name
// 3.data
// 4 .callback function

lib.update=function(dir,file,data,callback){

fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
  if(!err && fileDescriptor)  
  {
    var stringData=JSON.stringify(data);
    fs.truncate(fileDescriptor,function(err){
        if(!err){
            fs.writeFile(fileDescriptor,stringData,function(err){
                if(!err)
                {
                    fs.close(fileDescriptor,function(err){
                        if(!err)
                        {
                            callback(false);
                        }
                        else{
                            callback('Error closing file');
                        }
                    })
                }
                else
                callback('Error writing to exist file');
            }
            
        );}
        else
        callback("Error truncating the file");
    })      
  }
  else
  {
      callback('Could not add data');
  }
});
};

//Method to delete the  file
//Parameters to be passed are :
//1. directory
// 2.file name

lib.delete=function(dir,filename,callback){
     
    fs.unlink(lib.baseDir+dir+'/'+filename+'.json',function(err){
        callback(err);
    })

}
//Method to List all the files in  a directory
//Parameters to be passed are :
//1. directory

lib.list=function(dir,callback){
    fs.readdir(lib.baseDir + dir+ '/',function(err,fileName){
      if(!err && fileName && fileName.length > 0)
      {
         var trimedFileName=[];
         fileName.forEach(function(files){
             trimedFileName.push(files.replace('.json',''));
         });
         callback(false,trimedFileName);
      }
      else
      {
          callback(400,fileName);
      }
    });
 };
  
// Export the module

module.exports=lib;