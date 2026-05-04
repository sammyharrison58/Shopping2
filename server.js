const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

/**
 * SHOEMALL M-PESA DARAJA BACKEND
 * ------------------------------
 * Replace the placeholders below with your real Safaricom Daraja API credentials.
 * Get them at: https://developer.safaricom.co.ke/
 */

const DARAJA_CONFIG = {
    consumerKey: '7382528',
    consumerSecret: 'JohnLibendi',
    passkey: '737381',
    shortCode: '174379', // Sandbox default, replace with your real Paybill/Till
    callbackUrl: 'https://your-public-url.com/callback', // Must be a public HTTPS URL (use ngrok for local testing)
    isSandbox: true // Set to false for Production
};

// Route to trigger M-Pesa STK Push
app.post('/api/stk-push', async (req, res) => {
    const { phone, amount, orderID } = req.body;

    console.log(`[STK PUSH] Initiating for Order #${orderID} - Phone: ${phone}, Amount: ${amount}`);

    try {
        // 1. Get Access Token
        const auth = Buffer.from(`${DARAJA_CONFIG.consumerKey}:${DARAJA_CONFIG.consumerSecret}`).toString('base64');
        const tokenResponse = await axios.get(
            DARAJA_CONFIG.isSandbox
                ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );

        const accessToken = tokenResponse.data.access_token;

        // 2. Prepare STK Push Request
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = Buffer.from(DARAJA_CONFIG.shortCode + DARAJA_CONFIG.passkey + timestamp).toString('base64');

        const stkResponse = await axios.post(
            DARAJA_CONFIG.isSandbox
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: DARAJA_CONFIG.shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline', // Or CustomerBuyGoodsOnline
                Amount: amount,
                PartyA: phone.replace('+', ''), // Must be 2547XXXXXXXX
                PartyB: DARAJA_CONFIG.shortCode,
                PhoneNumber: phone.replace('+', ''),
                CallBackURL: DARAJA_CONFIG.callbackUrl,
                AccountReference: `Order #${orderID}`,
                TransactionDesc: 'ShoeMall Purchase'
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log('[STK PUSH] Success Response:', stkResponse.data);
        res.json({ success: true, data: stkResponse.data });

    } catch (error) {
        console.error('[STK PUSH] Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate STK Push. Ensure your credentials are correct and you are using a valid Safaricom number.'
        });
    }
});

// Callback route (Safaricom will send payment results here)
app.post('/callback', (req, res) => {
    console.log('[CALLBACK] Received payment result:', req.body);
    // You should process the result and update your database here
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 ShoeMall M-Pesa Backend Running!
    -----------------------------------
    URL: http://localhost:${PORT}
    Endpoint: http://localhost:${PORT}/api/stk-push
    
    1. Run 'npm install express axios cors'
    2. Add your Daraja details in server.js
    3. Start with 'node server.js'
    `);
});
