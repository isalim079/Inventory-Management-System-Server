const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 2800;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId, Long } = require("mongodb");
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
        const demoShopDB = client
            .db("inventoryManagementSystemDB")
            .collection("demoShopDB");
        const imsUsersDB = client
            .db("inventoryManagementSystemDB")
            .collection("imsUsersDB");
        const shopCollectionsDB = client
            .db("inventoryManagementSystemDB")
            .collection("shopCollectionsDB");
        const addProductsDB = client
            .db("inventoryManagementSystemDB")
            .collection("addProductsDB");
        const checkoutProductsDB = client
            .db("inventoryManagementSystemDB")
            .collection("checkoutProductsDB");
        const salesCollectionsDB = client
            .db("inventoryManagementSystemDB")
            .collection("salesCollectionsDB");

        // get data from demoShopDB
        app.get("/demoShopDB", async (req, res) => {
            const cursor = demoShopDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // get data from salesCollectionsDB
        app.get("/salesCollectionsDB", async (req, res) => {
            const cursor = salesCollectionsDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // get data from imsUsersDB
        app.get("/imsUsersDB", async (req, res) => {
            const cursor = imsUsersDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // patch data from imsUsersDB
        app.patch("/imsUsersDB/:email", async (req, res) => {
            const userEmail = req.params.email;

            const shopDetails = req.body;
            // console.log(shopDetails);

            const filter = { email: userEmail };
            const updatedDoc = {
                $set: {
                    role: "manager",
                    shopId: shopDetails.shopId,
                    shopName: shopDetails.shopName,
                    shopLogo: shopDetails.shopLogo,
                },
            };
            const result = await imsUsersDB.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // patch data from shopCollectionsDB
        app.patch("/shopCollectionsDB/:shopOwnerEmail", async (req, res) => {
            const userEmail = req.params.shopOwnerEmail;

            const shopDetails = req.body;
            console.log(shopDetails);

            const filter = { email: userEmail };
            const updatedDoc = {
                $set: {
                    productsLimit: shopDetails.productsLimit - 1,
                },
            };
            const result = await shopCollectionsDB.updateOne(
                filter,
                updatedDoc
            );
            res.send(result);
        });

        // patch data from shopCollectionsDB

        app.patch(
            "/shopCollectionsDB/:shopOwnerEmail/increaseLimit",
            async (req, res) => {
                const userEmail = req.params.shopOwnerEmail;
                // console.log(userEmail, "line 132");
                const productsLimitIncrease = req.body.productsLimitIncrease;
                // const filter = {email: userEmail}
                // console.log(filter, "line 136")
                // console.log(productsLimitIncrease, "line 137");
                const userShop = await shopCollectionsDB.findOne({
                    shopOwnerEmail: userEmail,
                });
                // console.log(userShop, "line 139");
                if (userShop) {
                    const updateDoc = await shopCollectionsDB.updateOne(
                        { shopOwnerEmail: userEmail },
                        { $inc: { productsLimit: +productsLimitIncrease } }
                    );
                    res.send(updateDoc);
                }
            }
        );

        // patch income for admin

        app.patch("/imsUsersDB", async (req, res) => {
            const income = req.body.income;
            console.log(income, "line 135");

            const updateDoc = await imsUsersDB.updateOne(
                { email: "salim@mail.com" },
                { $inc: { income: +income } }
            );
            res.send(updateDoc);
        });

        // post imsUsers info
        app.post("/imsUsersDB", async (req, res) => {
            const usersData = req.body;
            const result = await imsUsersDB.insertOne(usersData);
            res.send(result);
        });

        // post imsUsers salesCollectionsDB
        app.post("/salesCollectionsDB/:productsId", async (req, res) => {
            const productsId = req.params.productsId;

            const usersData = req.body;
            const result = await salesCollectionsDB.insertOne(usersData);

            const salesResult = await addProductsDB.updateOne(
                { _id: new ObjectId(productsId) },
                { $inc: { saleCount: +1, productQuantity: -1 } }
            );

            res.send({ result, salesResult });
        });

        // get shopCollections info
        app.get("/shopCollectionsDB", async (req, res) => {
            const cursor = shopCollectionsDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // post shopCollections info
        app.post("/shopCollectionsDB", async (req, res) => {
            const userEmail = req.body.shopOwnerEmail;
            const existShop = await shopCollectionsDB.findOne({
                shopOwnerEmail: userEmail,
            });

            if (!existShop) {
                const usersData = req.body;
                const result = await shopCollectionsDB.insertOne(usersData);
                res.send(result);
            } else {
                return res.status(400).send("user already has a shop");
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

            const userShop = await shopCollectionsDB.findOne({
                shopOwnerEmail: usersData?.userEmail,
            });
            if (userShop && userShop.productsLimit > 0) {
                const result = await shopCollectionsDB.updateOne(
                    { shopOwnerEmail: usersData.userEmail },
                    { $inc: { productsLimit: -1 } }
                );
                if (result.modifiedCount === 1) {
                    const result = await addProductsDB.insertOne(usersData);
                    res.send(result);
                } else {
                    res.status(400).send("Failed to update productsLimit.");
                }
            } else {
                res.status(400).send(
                    "User has reached the products limit. Please purchase a subscription."
                );
            }
        });

        // getting specific products
        app.get("/addProductsDB/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const productDetails = await addProductsDB.findOne(query);
            res.send(productDetails);
        });

        // updating products details
        app.patch("/addProductsDB/:id", async (req, res) => {
            const id = req.params.id;
            const productsData = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    productName: productsData.productName,
                    productImage: productsData.productImage,
                    productQuantity: productsData.productQuantity,
                    productLocation: productsData.productLocation,
                    productionCost: productsData.productionCost,
                    profitMargin: productsData.profitMargin,
                    discount: productsData.discount,
                    productDescription: productsData.productDescription,
                    sellingPrice: productsData.sellingPrice,
                },
            };
            const result = await addProductsDB.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // delete user products
        app.delete("/addProductsDB/:id", async (req, res) => {
            const id = req.params.id;

            const products = await addProductsDB.findOne({
                _id: new ObjectId(id),
            });

            const shopOwnerCollections = await shopCollectionsDB.findOne({
                shopOwnerEmail: products?.userEmail,
            });

            if (shopOwnerCollections) {
                const updatedCollections = await shopCollectionsDB.updateOne(
                    { shopOwnerEmail: products.userEmail },
                    { $inc: { productsLimit: +1 } }
                );

                if (updatedCollections.modifiedCount === 1) {
                    const query = { _id: new ObjectId(id) };
                    const result = await addProductsDB.deleteOne(query);
                    res.send(result);
                }
            }
        });

        // delete checkoutProductsDB info
        app.delete("/checkoutProductsDB/:productsId", async (req, res) => {
            const productsId = req.params.productsId;

            const query = { productsId: productsId };

            const result = await checkoutProductsDB.deleteOne(query);
            res.send(result);
        });

        // get data from checkoutProductsDB
        app.get("/checkoutProductsDB", async (req, res) => {
            const cursor = checkoutProductsDB.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // post data from checkoutProductsDB
        app.post("/checkoutProductsDB", async (req, res) => {
            const userData = req.body;
            const result = await checkoutProductsDB.insertOne(userData);
            res.send(result);
        });

        // payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;

            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log(
        //     "Pinged your deployment. You successfully connected to MongoDB!"
        // );
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
