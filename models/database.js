var mongoose = require("mongoose");
mongoose.set("strictQuery", true);
mongoose
  .connect(
    "mongodb+srv://ashu:1234@nodeexpress.fuqyyju.mongodb.net/CHAT-APP?retryWrites=true&w=majority"
  )
  .then(function () {
    console.log("Database connected!");
  })
  .catch(function (err) {
    console.log(err);
  });
