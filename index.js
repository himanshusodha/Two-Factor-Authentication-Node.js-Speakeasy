const express = require("express");
const app = express();
const PORT = 3000;
const speakeasy = require("speakeasy");
const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");
const uuid = require("uuid");


const db = new JsonDB(new Config("myDatabase", true, false, "/"));
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to 2FA ",
  });
});

app.post("/register", (req, res) => {
  try {
    const id = uuid.v4();
    const path = `/users/${id}`;
    const temSc = speakeasy.generateSecret({ length: 20 });
    db.push(path, { id, temSc });
    res.json({
      message: "User Registered",
      id,
      secret: temSc.base32,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/verify", (req, res) => {
  const { id, token } = req.body;
  console.log(id, token);
  console.log(token);

  try {
    const path = `/users/${id}`;
    const user = db.getData(path);
    const { base32: secret } = user.temSc;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });
    console.log(secret);
    if (verified) {
      db.push(path, { id: id, secret: user.temSc });
      res.json({
        message: "Verified",
      });
    } else {
      res.json({
        message: "Invalid Token",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/validate",(req,res) => {
    const {id,token} = req.body;
    try {
        const path = `/users/${id}`;
        const user = db.getData(path);
        const {base32:secret} =user.secret;
        const tokenValidates = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,window:1
        });

        if(tokenValidates){
        res.json({
            validated:true
        })
        }else{
        res.json({
            validated:false
        })
        }
    } catch (error) {
        res.status(500).json({
        message: error.message,
        });
    }
    })

 



app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
