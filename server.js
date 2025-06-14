require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const midtransClient = require("midtrans-client");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Inisialisasi Snap Midtrans
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY, // Ganti dengan SERVER KEY milikmu
});

// Endpoint untuk generate token
app.post("/create-transaction", async (req, res) => {
  try {
    const { total, email } = req.body;
    const order_id = "ORDER-" + Date.now();

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: total,
      },
      customer_details: {
        email: email,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token, order_id });
  } catch (error) {
    console.error("Midtrans Error:", error.message);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.get("/check-transaction-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const status = await coreApi.transaction.status(orderId);
    res.json({ status: status.transaction_status });
  } catch (error) {
    res.status(500).json({ error: "Failed to check transaction status" });
  }
});

app.post("/midtrans-webhook", async (req, res) => {
  try {
    const notif = req.body;
    console.log("Webhook received:", notif);

    const status = notif.transaction_status;
    const orderId = notif.order_id;

    // Lakukan sesuatu berdasarkan status
    if (status === "settlement" || status === "capture") {
      
      console.log(`Order ${orderId} paid successfully.`);
    } else if (status === "cancel" || status === "expire") {
      console.log(`Order ${orderId} failed or expired.`);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Midtrans server running at http://localhost:${PORT}`);
});
