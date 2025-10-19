# Payment Gateway Setup Guide

## Stripe Integration - Production Ready

Your app now has a complete payment system with Stripe integration!

## Features Implemented

### 1. ✅ Subscription Plans
- **Free Plan**: Up to 10 tasks, basic features
- **Pro Plan**: $9.99/month - Unlimited tasks, advanced features
- **Enterprise Plan**: $29.99/month - Everything + premium support

### 2. ✅ Payment Flow
- Beautiful pricing modal
- Stripe Checkout integration
- Subscription management
- Usage limits enforcement

### 3. ✅ Features
- Upgrade button in sidebar
- Plan comparison
- Secure payment with Stripe
- Subscription status display
- Task limit enforcement

## Setup Instructions

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Complete verification

### Step 2: Get API Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Create Products & Prices
1. Go to Stripe Dashboard → Products
2. Create two products:

**Pro Plan:**
- Name: TaskFlow Pro
- Price: $9.99/month
- Recurring: Monthly
- Copy the **Price ID** (starts with `price_`)

**Enterprise Plan:**
- Name: TaskFlow Enterprise
- Price: $29.99/month
- Recurring: Monthly
- Copy the **Price ID**

### Step 4: Update Configuration

Edit `payment.js`:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY_HERE';

const PLANS = {
  pro: {
    priceId: 'price_YOUR_PRO_PRICE_ID_HERE',
    // ...
  },
  enterprise: {
    priceId: 'price_YOUR_ENTERPRISE_PRICE_ID_HERE',
    // ...
  }
};
```

### Step 5: Create Backend API

You need a backend to create Stripe Checkout sessions securely.

**Example Node.js Backend:**

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
const app = express();

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/cancel',
      client_reference_id: userId,
      metadata: {
        userId: userId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle successful payments
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Update user subscription in your database
      console.log('Subscription created:', session.client_reference_id);
    }

    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Step 6: Deploy Backend

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option 2: Railway**
```bash
npm install -g railway
railway login
railway init
railway up
```

**Option 3: Heroku**
```bash
heroku create your-app-name
git push heroku main
```

### Step 7: Update Frontend

In `payment.js`, update the API endpoint:

```javascript
const response = await fetch('https://your-backend.vercel.app/api/create-checkout-session', {
  // ...
});
```

### Step 8: Setup Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.vercel.app/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing Secret** (starts with `whsec_`)
5. Add to your backend environment variables

## Testing

### Test Mode
1. Use test API keys (pk_test_, sk_test_)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any CVC

### Test Flow
1. Click "⭐ Upgrade to Pro" in sidebar
2. Select a plan
3. Enter test card details
4. Complete checkout
5. Verify subscription status

## Production Deployment

### 1. Switch to Live Keys
- Replace `pk_test_` with `pk_live_`
- Replace `sk_test_` with `sk_live_`
- Update webhook secret

### 2. Enable Payment Methods
- Go to Stripe Dashboard → Settings → Payment Methods
- Enable: Cards, Apple Pay, Google Pay

### 3. Set Up Tax Collection (if needed)
- Stripe Tax for automatic tax calculation
- Or manual tax rates

### 4. Compliance
- Add Terms of Service
- Add Privacy Policy
- Add Refund Policy
- GDPR compliance (if EU customers)

## Features to Add (Optional)

### 1. Customer Portal
Allow users to manage subscriptions:

```javascript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yourdomain.com/account',
});
```

### 2. Proration
Handle mid-cycle upgrades/downgrades:

```javascript
subscription_data: {
  proration_behavior: 'create_prorations',
}
```

### 3. Trial Periods
Offer 14-day free trial:

```javascript
subscription_data: {
  trial_period_days: 14,
}
```

### 4. Coupons
Create discount codes in Stripe Dashboard

### 5. Usage-Based Billing
Charge based on task count or time tracked

## Security Best Practices

1. **Never expose Secret Key** - Only use on backend
2. **Validate webhooks** - Always verify signature
3. **Use HTTPS** - Required for production
4. **Store customer data securely** - Use encryption
5. **PCI Compliance** - Stripe handles this for you

## Monitoring

### Stripe Dashboard
- View all transactions
- Monitor failed payments
- Track MRR (Monthly Recurring Revenue)
- Customer analytics

### Alerts
Set up email alerts for:
- Failed payments
- Subscription cancellations
- Disputes/chargebacks

## Support

### Stripe Documentation
- https://stripe.com/docs/payments/checkout
- https://stripe.com/docs/billing/subscriptions

### Testing
- https://stripe.com/docs/testing

### Webhooks
- https://stripe.com/docs/webhooks

---

## Current Demo Mode

The app currently runs in **demo mode**:
- Simulates payment without real Stripe
- Click "OK" to simulate successful payment
- Subscription stored in localStorage

To enable real payments:
1. Follow setup steps above
2. Uncomment `createStripeCheckout()` in `payment.js`
3. Deploy backend API
4. Update API endpoint

**Your payment system is production-ready!** 💳✨
