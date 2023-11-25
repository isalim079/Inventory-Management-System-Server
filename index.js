const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 2800;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sja1kis.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // creating database
        const demoShopDB = client.db("inventoryManagementSystemDB").collection("demoShopDB");
        const imsUsersDB = client.db("inventoryManagementSystemDB").collection("imsUsersDB");

        // get data from demoShopDB
        app.get('/demoShopDB', async(req, res) => {
            const cursor = demoShopDB.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // get data from imsUsersDB
        app.get("/imsUsersDB", async (req, res) => {
            const cursor = imsUsersDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // post imsUsers info
        app.post("/imsUsersDB", async (req, res) => {
            const usersData = req.body;
            const result = await imsUsersDB.insertOne(usersData);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("IMS is running");
});

app.listen(port, () => {
    console.log(`IMS Server is running on port ${port}`);
});
