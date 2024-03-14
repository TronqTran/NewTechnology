const express = require("express");
const PORT = 3000;
const app = express()

const multer=require('multer'); // khai báo multer
const AWS=require('aws-sdk');   // khai báo aws-sdk
require("dotenv").config();    // khai báo dotenv
const path=require('path');

// cau hinh aws-sdk
process.env.AWS_SDK_JS_SUPPRESS_MAINTENNANCE_MODE_MESSAGE='1';

// cau hinh aws-sdk 
AWS.config.update({
    region:process.env.REGION,
    accessKeyId:process.env.ACCESS_KEY_ID,
    secretAccessKey:process.env.SECRET_ACCESS_KEY,
})
const s3=new AWS.S3(); // khai báo s3
const dynamobd=new AWS.DynamoDB.DocumentClient(); // khai báo dynamodb

const bucketName=process.env.S3_BUCKET_NAME;
const tableName=process.env.DYNAMODB_TABLE_NAME;

app.use(express.json({ extended: false }));
app.use(express.static('/views'));
app.use(express.urlencoded());

app.set('view engine', 'ejs');
app.set('views', './views');

// khai báo multer
const storage=multer.memoryStorage({
    destination(req, file, callback){
        callback(null,'');
    },
});
const upload=multer({
    storage,
    limits:{
        fileSize:2000000,
    },
    fileFilter(req, file, cb){
        checkFileType(file, cb);
    },
});

function checkFileType(file, cb){
    const fileType=/jpeg|jpg|png|gif/;
    const extname=fileType.test(path.extname(file.originalname).toLowerCase());
    const mimeType=fileType.test(file.mimetype);
    if(extname&& mimeType){
        return cb(null, true);
    }
    return cb("error to upload image")
}
// routes
app.get("/", async (req, resp) => {
    try {
    const params={TableName: tableName}
    const data=await dynamobd.scan(params).promise();
    console.log("data=", data.Items);
    return resp.render("index.ejs", {data: data.Items})
    
    } catch (error) {
        console.log(error);
        return resp.status(500).send("internal server error")
    }
})

app.post("/save", upload.single('image'), (req, res, next)=> {
    try {
        const MaSP=req.body.id;
        const tenSP=req.body.nameSP;

        const image=req.file?.originalname.split(".");
        const fileType=image;
        const filePath=`${MaSP}_${Date.now.toString()}.${fileType}`

        const paramsS3={
            Bucket: bucketName,
            Key: filePath,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }

        s3.upload(paramsS3, async (err, data)=>{
            if(err){
                console.log("error", err);
                return res.send("Internal server error");

            } else{
                const imageURL=data.Location;
                const paramsDynamoDb={
                    TableName: tableName,
                    Item:{
                        MaSP: MaSP,
                        tenSP: tenSP,
                        image:imageURL,
                    }
                };

                await dynamobd.put(paramsDynamoDb).promise();
                return res.redirect("/");
            }
        })
    } catch (error) {
        console.log(error);
    }
})
app.post("/delete", upload.fields([]),function (req, res) {
    const listCheckboxSeltect= Object.keys(req.body);
    console.log("listCheckboxSeltect=", listCheckboxSeltect);
    if (!listCheckboxSeltect || listCheckboxSeltect.length <= 0) {
        return res.redirect("/");
    }
    try {
        function onDelteItem(length) {
            const params = {
                TableName: tableName,
                Key: {
                    MaSP: listCheckboxSeltect[length]
                }
            };

            dynamobd.delete(params, function (err, data) {
                if (err) {
                    console.error("Error:", err);
                    return res.send("Internal server error");
                } else if (length > 0) {
                    onDelteItem(length - 1);
                } else {
                    return res.redirect("/");
                }
                
            });
        }
        onDelteItem(listCheckboxSeltect.length - 1);
        
    } catch (error) {
        console.error("error delete", error);
        return res.status(500).send("Internal server error");
    }
})
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})
