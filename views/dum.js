// const CLIENT_ID =
//   "676428409321-31c91qsfqad148tpoikgv201jv817t9p.apps.googleusercontent.com";
// const CLIENT_SECRET = "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";
// const REDIRECT_URI = "https://developers.google.com/oauthplayground";
// const REFRESH_TOKEN =
//   "1//043hIE02f9oS2CgYIARAAGAQSNwF-L9Ir1kxVGjxNDI_c00I4upzu-vhihGVebFy2dRJg0T4yHEksLnaQO6OUbS9RvTyTRVGLa58";

// const OAuth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// );
// OAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const nodemailer = require("nodemailer");
const { google } = require("googleapis");

async function sendMail(to, link) {
  try {
    const accessToken = await OAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "dhanesh1296@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "Sheryians Coding School <dhanesh1296@gmail.com>",
      to,
      subject: "Change Password",
      html: `<h1>Click link below</h1>click <a href="${link}">here</a> to change password.`,
      // html: '<a href="https://www.google.com">here</a>',
    };
    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}
router.post("/forgot-password", function (req, res) {
  const { email } = req.body;
  User.findOne({ email })
    .then(function (userFound) {
      if (!userFound)
        return res.send(
          "User not found <a href='/forgot-password'>go back</a>"
        );

      const link = `${req.protocol}://${req.get("host")}/change-password/${
        userFound._id
      }`;
      sendMail(userFound.email, link)
        .then(function (result) {
          console.log("email sent...");
          userFound.refreshToken = 1;
          userFound.save();
          res.send("<h1>check inbox!<h1><a href='/'>Go Home</a>");
          // res.json()
        })
        .catch(function (err) {
          console.log(err);
        });
      // res.redirect("/change-password/" + userFound._id);
    })
    .catch(function (err) {
      res.send(err);
    });
});
//
router.get("/change-password/:id", function (req, res) {
  User.findById(req.params.id)
    .then(function (user) {
      if (user.refreshToken === 1) {
        res.render("changepassword", {
          id: req.params.id,
          title: "Change Password",
          isloggedin: false,
        });
      } else {
        res.send("Makade! change toh kr chuka or kitne baar krega...");
      }
    })
    .catch(function (err) {
      res.send(err);
    });
});
// 
<!-- <%- include('./partials/header')%> <%- include('./partials/navigation')%>
<form action="/signup" method="post">
  <input type="text" placeholder="John Doe" name="name" />
  <input type="text" placeholder="@johndoe" name="username" />
  <input type="email" placeholder="example@john.doe" name="email" />
  <input type="password" placeholder="********" name="password" />

  <p>Have an account? <a href="/">Sign in</a></p>