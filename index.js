const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const port = 8080;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ws0m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(cors()); // cross origin resource sharing (cors)
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-62315-firebase-adminsdk-wcd2z-9f0ef5b24f.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
        console.log(newBooking);
    })
    // perform actions on the collection object
    console.log("Database connection successfully!");
    //   client.close();


    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    
                    if (tokenEmail == req.query.email) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else{
                        res.status(401).send('Unauthorized access')
                    }
                }).catch(function (error) {
                    res.status(401).send('Unauthorized access');
                });
        }
        else{
            res.status(401).send('Unauthorized access')
        }

    })

});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
})