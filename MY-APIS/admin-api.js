const exp = require('express')
const adminApi = exp.Router();
const oracledb = require('oracledb');
const expressErrorHandler = require("express-async-handler");
const { response, json } = require('express');
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
        let usersList= await adminDataBase.execute("select customer.custid,custname,custaddress,custmobileno,custdob,custemail,accno,accbal,custaadharno,custpanno,status from customer,account where customer.custid=account.custid");
        res.send({message:usersList})
    }))

    
    //updating userdetails by admin
    adminApi.put("/updateuser/:id",expressErrorHandler(async(req,res)=>{
        let id=(+req.params.id);
        let updateObj=req.body;
        let custName=updateObj.custname,custAddress=updateObj.custaddress,custDob=updateObj.custdob,custPhone=updateObj.custmobileno,custEmail=updateObj.custemail;
        await adminDataBase.execute(`update customer set custdob='${custDob}',custName='${custName}',custaddress='${custAddress}',custmobileno='${custPhone}',custemail='${custEmail}' where custid=${id}`);
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

    //****function for creating a new unique customer id
    async function generateId(){
        // max id of the customer table
        let maxCustId=await adminDataBase.execute("select max(custid) from customer")
        //adding 1 to the max custId 
        return (+maxCustId.rows[0])+1
    }

    //****function for autogenerating a random password
    function makePassword(maxLength) {
        var collectionOfLetters = "@$&#%ABCDEFGHI0123456789JKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        var generatedPassword = "";
        var size = collectionOfLetters.length;
        for (var i = 0; i < maxLength; ++i) {
           generatedPassword = generatedPassword + collectionOfLetters.charAt(Math.floor(Math.random() * size));
        }
         return generatedPassword;
    }

    //****function for creating a new and new account number 
    async function generateAccNO(){
        let maxAccNo=await adminDataBase.execute("select max(accno) from account");
        return (+maxAccNo.rows[0])+1;
    }

    //Creating account by admin after verification of users requests which are stored in register table
    adminApi.post("/createaccount/usersrequest",expressErrorHandler(async(req,res)=>{
        //getting aadhar number from req.body
        newAccAadharNo=req.body.aadharno;
        //creating new and unique customer id for new uer
        let newId=await generateId();
        //creating new password
        let newPassword=makePassword(8);
        //creating new account number
        let newAccNo=await generateAccNO();
        //initial balance as 0
        let newAccBal=0;
        //Retreviewing the new user details from register table
        newCustDetails=await adminDataBase.execute(`select * from register where aadharno=${newAccAadharNo}`); 
        newCustDetails=newCustDetails.rows[0];
        //await adminDataBase.execute(`insert into customer values(${newId},'${newCustDetails[0]}','${newPassword}','${newCustDetails[2]}','${newCustDetails[3]}',${newCustDetails[4]},'${newCustDetails[1]}',${newCustDetails[5]},'${newCustDetails[6]}')`)
        //inserting new  user details into customer table
        let bindCust=[newId,newCustDetails[0],newPassword,newCustDetails[2],newCustDetails[3],newCustDetails[4],newCustDetails[1],newCustDetails[5],newCustDetails[6]];
        await adminDataBase.execute(`insert into customer values(:1,:2,:3,:4,:5,:6,:7,:8,:9)`,bindCust);
        //inserting account details into accounts table
        let bindAcc=[newId,newAccNo,newAccBal,'active'];
        await adminDataBase.execute(`insert into account values(:0,:1,:2,:3)`,bindAcc);
        //after creating the account delect the respective user details in the register table
        await adminDataBase.execute(`delete from register where aadharno=${newAccAadharNo}`)
        res.send({message:"Account Created"})
    }))

    //Creating account directly by the admin
    adminApi.post("/createaccount/adminrequest",expressErrorHandler(async(req,res)=>{
        //getting user details from the form filled by the admin
        newUserDetailsObj=req.body;
        //creating new and unique customer id for new uer
        let newUserId=await generateId();
        //creating new password
        let newUserPassword=makePassword(8);
        //creating new account number
        let newUserAccNo=await generateAccNO();
        //initial balance as 0
        let newUserAccBal=0;
        //inserting new user details into customer table
        let bindAdminCust=[newUserId,newUserDetailsObj.username,newUserPassword,newUserDetailsObj.address,newUserDetailsObj.dob,newUserDetailsObj.phoneno,newUserDetailsObj.email,newUserDetailsObj.aadharno,newUserDetailsObj.panno];
        await adminDataBase.execute(`insert into customer values(:1,:2,:3,:4,:5,:6,:7,:8,:9)`,bindAdminCust);
        //inserting new ubindAdminAcc=[]ser accout details into account table
        let bindAdminAcc=[newUserId,newUserAccNo,newUserAccBal,'active'];
        await adminDataBase.execute(`insert into account values(:0,:1,:2,:3)`,bindAdminAcc);
        console.log(await adminDataBase.execute(`select * from customer where custid=${newUserId}`));
        console.log(await adminDataBase.execute(`select * from account where custid=${newUserId}`));
        res.send({message:"Account Created"})

    }))







module.exports=adminApi;