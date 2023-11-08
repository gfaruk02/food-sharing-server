const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
app.use(cookieParser())


//middleware for secure api
const logger = (req, res, next)=>{
    // console.log('log: info', req.method, req.url);
    next();
}

//verifyToken middleware
const verifyToken = (req, res, next)=>{
    const token = req?.cookies?.token;
    // console.log('token middleware', token);
// next()
    //no token
    if(!token){
        return res.status(401).send({message: 'Unauthorized Access'})
    }

    jwt.verify(token, process.env.MY_ACCESS_SECRET_TOKEN, (err, decoded)=>{
        if(err){
            return res.status(401).send({message: 'Unauthorized Access'})
        }
        req.user = decoded;
        next();
    })
}


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
        app.post('/jwt', async(req, res)=>{
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.MY_ACCESS_SECRET_TOKEN, {expiresIn: '1h'});
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                // sameSite: 'none'
            })
            .send({success: true})
        })
        app.post('/logout', async(req, res)=>{
            const user = req.body;
            // console.log('out user', user);
            res.clearCookie('token', {maxAge: 0}).send({success: true})
        })

        //server related Api
        const foodsCollection = client.db('foodSharing').collection('foods');
        const foodRequestCollection = client.db('foodSharing').collection('foodRequests');



        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })
        app.get('/food', logger, verifyToken, async (req, res) => {
            // console.log(req.query);
            // console.log('token owner info', req.user);
            if(req.user?.email !== req.query?.email){
                return res.status(403).send({message: 'Forbidden Access'});
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/foodRequests', async (req, res) => {
            const cursor = foodRequestCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })
        // app.get('/foodRequests', async (req, res) => {
        //     // console.log(req.query.email);
        //     let query = {};
        //     if (req.query?.email) {
        //         query = { email: req.query.email }
        //     }
        //     const result = await foodRequestCollection.find(query).toArray();
        //     res.send(result);
        // })
        app.get('/foodreruest',  async (req, res) => {
            // console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodRequestCollection.find(query).toArray();
            res.send(result);
        })
        //get for specific items
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodsCollection.findOne(query);
            res.send(result)
        })
        
        app.get('/foodRequests/:requistId', async (req, res) => {
            const requistId = req.params.requistId;
            const query = { requistId: requistId };
            const result = await foodRequestCollection.findOne(query);
            res.send(result)
        })

        

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


        app.get('/foods',logger, verifyToken,async (req, res) => {
               if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'Forbidden Access'});
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        })

        //food Request Collection
        app.post('/foodRequests', async (req, res) => {
            const foodRequest = req.body;
            // console.log(foodRequest);
            const result = await foodRequestCollection.insertOne(foodRequest);
            res.send(result);
        })

        //add food
        app.post('/foods', async (req, res) => {
            const addfood = req.body;
            // console.log(addfood);
            const result = await foodsCollection.insertOne(addfood);
            res.send(result);
        })
        
        //food delete
        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodsCollection.deleteOne(query);
            res.send(result);
        })
        //Cancel Request
        app.delete('/foodRequests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodRequestCollection.deleteOne(query);
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