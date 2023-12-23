const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 7000;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173","https://phone-fusion-364.web.app"],
  })
);

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.zfvsexa.mongodb.net/?retryWrites=true&w=majority`;

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

    const phoneCollection = client.db("phoneDB").collection("phones");

    app.get("/phones", async (req, res) => {
      const search = req.query.search;
      const type = req.query.type;
      const brand = req.query.brand;
      const priceRange = req.query.priceRange;
      const sortBy = req.query.sortBy;
      let sortField = "defaultField";
      let sortOrder = 1;

      if (sortBy === "price-asc") {
        sortField = "price";
        sortOrder = 1;
      } else if (sortBy === "price-desc") {
        sortField = "price";
        sortOrder = -1;
      }
      const query = {};
      const filters = [];

      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split("-");
        filters.push({
          price: {
            $gte: parseInt(minPrice),
            $lte: parseInt(maxPrice),
          },
        });
      }

      if (search) {
        filters.push({
          $or: [
            { brand: { $regex: search, $options: "i" } },
            { model: { $regex: search, $options: "i" } },
            { processor: { $regex: search, $options: "i" } },
            { OS: { $regex: search, $options: "i" } },
            { memory: { $regex: search, $options: "i" } },
            { type: { $regex: search, $options: "i" } },
          ],
        });
      }

      if (type) {
        filters.push({ type: { $regex: type, $options: "i" } });
      }

      if (brand) {
        filters.push({ brand: { $regex: brand, $options: "i" } });
      }

      if (filters.length > 0) {
        query.$and = filters;
      }
      const result = await phoneCollection
        .find(query)
        .sort({ [sortField]: sortOrder })
        .toArray();
      res.send(result);
    });

    app.get("/featured", async (req, res) => {
      const cursor = phoneCollection.aggregate([{ $sample: { size: 6 } }]);
      const result = await cursor.toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
  res.send("Phone Fusion is running");
});

app.listen(port, () => {
  console.log("Phone Fusion is running on port", port);
});
