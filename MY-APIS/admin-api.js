const exp = require('express')
const adminApi = exp.Router();
const oracledb = require('oracledb');
const expressErrorHandler = require("express-async-handler");
const { response } = require('express');
let adminDataBase;

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
      adminDataBase=connection;
      console.log("Connection to Data base was successful")
    });

    //login authentication

    adminApi.post("/login", expressErrorHandler(async (req, res) => {
        //gettig data from api
        loginObj=req.body;
        inputId=loginObj.id
        console.log(inputId)
        inputPassword=loginObj.password;
        //retreviewing the password respected to the username received
        let adminAuth =await adminDataBase.execute(`SELECT password from admin where adminid=${inputId}`)
        console.table(adminAuth)
        //if it returns empty array then invalid id 
        if(adminAuth.rows.length==0){
            res.send({message:"Invalid Id"})
        }
         //if it returns non empty array then verify password
        else{
        if(adminAuth.rows[0]==inputPassword){
           res.send({message:"successful"})
        }
        else{
            res.send({message:"unsuccessfull"})
        }
        }
    }))

    //get request for users list from admin
    adminApi.get("/getuserslist",expressErrorHandler( async(req,res)=>{
        let usersList= await adminDataBase.execute("select custname,custaddress,custmobileno,custdob,custemail,accno,accbal,status from customer,account where customer.custid=account.custid");
        res.send({message:usersList})
        console.log(" list ",usersList)
    }))

    
    //updating userdetails by admin
    adminApi.put("/updateuser/:id",expressErrorHandler(async(req,res)=>{
        let id=(+req.params.id)
        console.log(id)
        let updateObj=req.body;
        let custName=updateObj.custname,custAddress=updateObj.custaddress,custDob=updateObj.custdob,custPhone=updateObj.custmobileno,custEmail=updateObj.custemail;
        await adminDataBase.execute(`update customer set custdob='${custDob}',custName='${custName}',custaddress='${custAddress}',custmobileno='${custPhone}',custemail='${custEmail}' where custid=${id}`);
        let temp=await adminDataBase.execute(`select * from customer where custid=${id}`);
        console.log(temp)
        res.send({message:"Updated Successfully"})
    }))

    //deleting user account by admin
    adminApi.delete("/deleteaccount/:id",expressErrorHandler( async(req,res)=>{
        //accesing the id that to be deleted from req body
        let deleteId=req.body.id;
        //deleting account details
        await adminDataBase.execute(`delete from account where custid=${deleteId}`);
        //deleting the user details 
        await adminDataBase.execute(`delete from customer where custid=${deleteId}`);
        res.send({message:"User Account Deleted Successfully"});
    }))

    //for balance enquiry
    adminApi.get("/getbalance/:id",expressErrorHandler( async(req,res)=>{
        let balanceInquiryId=(+req.params.id);
        let balance=await adminDataBase.execute(`select accbal from account where custid=${balanceInquiryId}`);
        res.send({message:balance});

    }))

    //for updating balance 
    adminApi.put("/updatebalance/:id",expressErrorHandler( async(req,res)=>{
        let updateBalanceId=req.params.id;
        updatedBalance=req.body.balance;
        //updating in the account table
        await adminDataBase.execute(`update account set accbal=${updatedBalance} where custid=${updateBalanceId}`)
        res.send({message:"Successfully Updated"})
    }))

    //
module.exports=adminApi;