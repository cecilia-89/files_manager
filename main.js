const dbClient = require("./utils/db")

dbClient.getFiles({}).then((value) => {
    console.log(value)
})
