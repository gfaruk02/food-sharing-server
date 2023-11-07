const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors(
    // {
    //     origin: ['http://localhost:5173'],
    //     credentials: true
    // }
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

        // //auth related api
        // app.post('/jwt', async(req, res)=>{
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.MY_ACCESS_SECRET_TOKEN, {expiresIn: '1h'});
        //     res
        //     .cookie('token', token, {
        //         httpOnly: true,
        //         secure: false,
        //         // sameSite: 'none'
        //     })
        //     .send({success: true})
        // })

        //server related Api
        const foodsCollection = client.db('foodSharing').collection('foods');
        const foodRequestCollection = client.db('foodSharing').collection('foodRequests');



        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })
        app.get('/food', async (req, res) => {
            console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        })


        //get for specific items
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodsCollection.findOne(query);
            res.send(result)
        })
        // app.get('/foodRequests/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const options = {
        //         // Include only the `title` and `imdb` fields in the returned document
        //         projection: {

        //             userName: 1,
        //             userEmail: 1,
        //             userImage: 1,
        //             time: 1,
        //             status: 1

        //         },
        //     };
        //     const result = await foodRequestCollection.findOne(query, options);
        //     res.send(result)
        // })

        //update 
        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedfood = req.body;
            const food = {
                $set: {
                    food_name: updatedfood.food_name,
                    food_quantity: updatedfood.food_quantity,
                    pickup_location: updatedfood.pickup_location,
                    expired_datetime: updatedfood.expired_datetime,
                    additional_notes: updatedfood.additional_notes,
                    food_image: updatedfood.food_image,
                }
            }
            const result = await foodsCollection.updateOne(filter, food, options);
            res.send(result);
        })


        app.get('/foods', async (req, res) => {
            // console.log(req.query.email);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        })



        //add food
        app.post('/foods', async (req, res) => {
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