const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 2800;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        const shopCollectionsDB = client.db("inventoryManagementSystemDB").collection("shopCollectionsDB");
        const addProductsDB = client.db("inventoryManagementSystemDB").collection("addProductsDB");

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

        // patch data from imsUsersDB
        app.patch("/imsUsersDB/:email", async (req, res) => {
            const userEmail = req.params.email

            const shopDetails = req.body
            // console.log(shopDetails);

            const filter = {email: userEmail}
            const updatedDoc = {
                $set: {
                    role: "manager",
                    shopId: shopDetails.shopId,
                    shopName: shopDetails.shopName,
                    shopLogo: shopDetails.shopLogo,
                }
            }
            const result = await imsUsersDB.updateOne(filter, updatedDoc)
            res.send(result)
        });

        // patch data from shopCollectionsDB
        app.patch("/shopCollectionsDB/:shopOwnerEmail", async (req, res) => {
            const userEmail = req.params.shopOwnerEmail

            const shopDetails = req.body
            console.log(shopDetails);

            const filter = {email: userEmail}
            const updatedDoc = {
                $set: {
                    productsLimit: shopDetails.productsLimit - 1
                }
            }
            const result = await shopCollectionsDB.updateOne(filter, updatedDoc)
            res.send(result)
        });


        // post imsUsers info
        app.post("/imsUsersDB", async (req, res) => {
            const usersData = req.body;
            const result = await imsUsersDB.insertOne(usersData);
            res.send(result);
        });

        // get shopCollections info
        app.get("/shopCollectionsDB", async (req, res) => {
            const cursor = shopCollectionsDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // post shopCollections info
        app.post("/shopCollectionsDB", async (req, res) => {
            const userEmail = req.body.shopOwnerEmail
            const existShop = await shopCollectionsDB.findOne({shopOwnerEmail: userEmail})

            if(!existShop){

                const usersData = req.body;
            const result = await shopCollectionsDB.insertOne(usersData);
            res.send(result);

            }
            else{
                return res.status(400).send("user already has a shop")
            }

        });

        // get data from addProductsDB
        app.get("/addProductsDB", async (req, res) => {
            const cursor = addProductsDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // post data to addProductsDB
        app.post("/addProductsDB", async (req, res) => {
            const usersData = req.body;

            const userShop = await shopCollectionsDB.findOne({shopOwnerEmail: usersData?.userEmail})
            if(userShop && userShop.productsLimit > 0) {
                const result = await shopCollectionsDB.updateOne(
                    {shopOwnerEmail: usersData.userEmail},
                    {$inc: {productsLimit: -1}}
                )
                if(result.modifiedCount === 1) {

                    const result = await addProductsDB.insertOne(usersData);
            res.send(result);

                }
                else {
                    res.status(400).send("Failed to update productsLimit."); }
            }
            else {
                res.status(400).send("User has reached the products limit. Please purchase a subscription.");}

            
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
