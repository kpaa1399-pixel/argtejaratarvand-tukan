const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  const dbName = 'arg_tejrat';
  const ORDER_ID = 'ORD123456';
  const ACTOR_ID = 'ARG789234';

  const stages = [
    {
      user_id: "64bfc1234567890abcde1f2",
      created_at: new Date("2024-05-30T06:38:00Z"),
      related_entity: ORDER_ID,
      role: "seller",
      assigned_to: ACTOR_ID,
      status: "pending",
      notes: "this is a note"
    },
    {
      user_id: ACTOR_ID,
      created_at: new Date("2024-05-30T07:10:00Z"),
      related_entity: ORDER_ID,
      role: "manager",
      assigned_to: ACTOR_ID,
      status: "completed",
      notes: "approved by manager"
    },
    {
      user_id: ACTOR_ID,
      created_at: new Date("2024-05-30T08:00:00Z"),
      related_entity: ORDER_ID,
      role: "delivery",
      assigned_to: ACTOR_ID,
      status: "active",
      notes: "out for delivery"
    }
  ];

  try {
    console.log("start");
    await client.connect();
    const db = client.db(dbName);
    const ravand = db.collection('ravand_admin');

    const result = await ravand.insertMany(stages);
    console.log("inserted:", result.insertedCount);

    const history = await ravand.find({ related_entity: ORDER_ID }).sort({ created_at: 1 }).toArray();
    history.forEach(doc => {
      console.log('${doc.status} ${doc.created_at.toISOstring()} ${doc.notes}');
    });
  } catch (err) {
    console.error("error:", err.message);
  } finally {
    await client.close();
  }
}

run();