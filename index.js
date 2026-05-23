const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;

const port = 8000;

const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  const JWKS = createRemoteJWKSet(
    new URL(" http://localhost:3000/api/auth/jwks"),
  );

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("smart-care-plus-data");
    const doctorsCollection = db.collection("doctors");
    const appointmentCollection = db.collection("appointments");
    const usersCollection = db.collection("user");

    app.get("/doctors", async (req, res) => {
      const result = await doctorsCollection.find().toArray();
      res.send(result);
    });

    app.get("/doctors/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await doctorsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/appointments/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await appointmentCollection
        .find({
          "user.userId": userId,
        })
        .toArray();
      res.send(result);
    });

    app.post("/appointments", verifyToken, async (req, res) => {
      const result = await appointmentCollection.insertOne(req.body);
      res.send(result);
    });

    app.delete("/appointments/:id", verifyToken, async (req, res) => {
      const id = req.params;
      const result = await appointmentCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/appointments/:id", verifyToken,  async (req, res) => {
      const id = req.params;
      const updateData = req.body;
      const result = await appointmentCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updateData,
        },
      );
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
