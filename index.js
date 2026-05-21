const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;

const port = 8000;

const cors = require("cors");
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hello Developer!");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("smart-care-plus-data");
    const doctorsCollection = db.collection("doctors");

    const appointmentCollection = db.collection("appointments");

    app.get("/doctors", async (req, res) => {
      try {
        const result = await doctorsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/doctors/:id", async (req, res) => {
      const id = req.params.id;
      const result = await doctorsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/appointments", async (req, res) => {
      const result = await appointmentCollection.find().toArray();
      res.send(result);
    });

    app.post("/appointments", async (req, res) => {
      const result = await appointmentCollection.insertOne(req.body);
      res.send(result);
    });

    app.delete("/appointments/:id", async (req, res) => {
      const id = req.params;
      const result = await appointmentCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log(error);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
