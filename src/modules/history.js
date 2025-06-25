const {Schema, model} = require('mongoose');

const moveSchema= new Schema({
    imei:{
        type:String,
        required:true,
        unique:false,
        trim:true
           },
    moving:[{

    latitude:{
        type:String,
        required:true,
        unique:false,
    },
    longitude:{
        type:String,
        required:true,
        unique:false,
    },
    speed:{
        type:String,
        required:true,
        unique:false,
    },
    course:{
        type:String,
        required:true,
        unique:false,
    },
    }],
   

     done: Boolean,},{
        timestamps:true,
        versionKey:false
     
});

module.exports=model('history', moveSchema);