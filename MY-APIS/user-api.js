//create mini express
const exp = require('express');
const userApi = exp.Router();
const oracledb = require('oracledb');
const expressErrorHandler = require("express-async-handler");
let userDataBase;
//connecting to oracle database
oracledb.getConnection(
    {
      user          : "NIT",
      password      : "NIT",
      connectString : "localhost/XE"
    },
    function(err, connection)
    {
        if (err) { console.error(err); return; }
      //when connection is successfull
      userDataBase=connection;
      console.log("Connection to Data base was successful")
    });

    //login authentication
    userApi.post("/login", expressErrorHandler(async (req, res) => {
        //gettig data from api
        loginObj=req.body;
        inputId=loginObj.id
        inputPassword=loginObj.password;
        //retreviewing the password respected to the username received
        let userList =await userDataBase.execute(`SELECT custpassword from customer where custid=${inputId}`)
        //if it returns empty array then invalid id 
        if(userList.rows.length==0){
            res.send({message:"Invalid Id"})
        }
        //if it returns non empty array then verify password 
        else{
       if(userList.rows[0]==inputPassword){
           res.send({message:"successful"})
       }
        else{
            res.send({message:"unsuccessfull"})
        }
     }
    }))

    //updating balance after transactions
    userApi.put("/updatebalance/:id",expressErrorHandler(async (req,res)=>{
        updateId=req.params.id;
        updatedBalance=req.body.balance;
        //updating balance in account table
        await userDataBase.execute(`update account set accbal=${updatedBalance} where custid=${updateId}`);
        res.send({message:"Updated Successfully"})
    }))

    //account registration by the user
    userApi.post("/register",expressErrorHandler(async(req,res)=>{
        let newRegister=req.body;
        console.log(newRegister)
        //adding the registered details in register table 
        await userDataBase.execute(`insert into register values
           ('${newRegister.username}',
            '${newRegister.email}',
            '${newRegister.address}',
            '${newRegister.dob}',
            '${newRegister.phoneno}',
            '${newRegister.aadharno}',
            '${newRegister.panno}')`)
        res.send({message:"Registered Successfully"})
    }))






module.exports=userApi
