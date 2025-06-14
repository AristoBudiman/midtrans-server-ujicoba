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

    const parameter = {
      transaction_details: {
        order_id: "ORDER-" + Date.now(),
        gross_amount: total,
      },
      customer_details: {
        email: email,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token });
  } catch (error) {
    console.error("Midtrans Error:", error.message);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.get("/check-transaction/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const transaction = await snap.transaction.status(orderId);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: "Failed to get transaction status" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Midtrans server running at http://localhost:${PORT}`);
});
