//create express app
const exp = require("express")
const app = exp();

app.use(exp.json())
//import APIS
const userApi = require("./MY-APIS/user-api.js")
const adminApi = require("./MY-APIS/admin-api.js")



//execute specific api based on path
app.use("/user", userApi)
app.use("/admin", adminApi)
//invalid path
app.use((req, res, next) => {

    res.send({ message: `path ${req.url} is invalid` })
})

//error handling middleware
app.use((err, req, res, next) => {
    res.send({ message: `error is ${err.message}` })
})


//assign port
const port = 3000;
app.listen(port, () => console.log(`server on ${port}...`))