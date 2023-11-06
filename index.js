const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors(
    {
        origin: ['http://localhost:5173'],
        credentials: true
    }
));
app.use(express.json());


const uri = `mongodb+srv://${process.env.MY_DB_USER}:${process.env.My_BD_PASS}@cluster0.zjs4f1h.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        
        //auth related api
        app.post('/jwt', async(req, res)=>{
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.MY_ACCESS_SECRET_TOKEN, {expiresIn: '1h'});
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                // sameSite: 'none'
            })
            .send({success: true})
        })

        //server related Api
        const foodsCollection = client.db('foodSharing').collection('foods');
        const foodRequestCollection = client.db('foodSharing').collection('foodRequests');



        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })

        //food Request Collection
        app.post('/foodRequests', async(req, res)=>{
            const foodRequest = req.body;
            console.log(foodRequest);
            const result = await foodRequestCollection.insertOne(foodRequest);
            res.send(result);
        })

        //add food
        app.post('/foods', async(req, res)=>{
            const addfood = req.body;
            console.log(addfood);
            const result = await foodsCollection.insertOne(addfood);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Foor Sharing is Running');
})

app.listen(port, () => {
    console.log(`Food Sharing server is running on port ${port}`);
})