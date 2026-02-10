# Subscription & Payment Implementation Plan

## Goal
Implement a subscription flow where users receive a **1-month free trial**, followed by a **$9.90/month** recurring charge. This step should occur immediately after the user logs in and completes their profile onboarding.

## Architecture

### 1. Database Schema (Supabase)
We need a table to track the subscription status of each user.
- **Table Name**: `subscriptions`
- **Fields**:
  - `user_id` (FK to auth.users)
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `status` (active, trialing, past_due, canceled)
  - `current_period_end`

### 2. Payment Provider (Stripe)
We will use Stripe for handling payments.
- **Product**: "Monthly Subscription" ($9.90/month).
- **Trial**: Configured in code as `trial_period_days: 30` (or 31).

### 3. User Flow
1.  **Login**: User logs in.
2.  **Onboarding**: User checks profile data (existing flow).
3.  **Subscription Check**: Middleware or Page logic checks `subscriptions` table.
4.  **Payment Wall**: If no active subscription, redirect to specific "Subscribe" page/modal.
    - UI: Light/Bright mode.
    - Message: "First month free, then $9.90/mo".
5.  **Checkout**: User clicks "Subscribe", goes to Stripe Checkout.
6.  **Success**: Redirects back to Dashboard/Profile.

## Step-by-Step Implementation

### Step 1: Install Dependencies
- Install `stripe` package.
- Install `stripe` CLI (optional, for local webhook testing instructions).

### Step 2: Database Setup
- Create a migration SQL file to add the `subscriptions` table.

### Step 3: Backend API Routes
- `POST /api/checkout`: Creates a Stripe Checkout Session with a 30-day trial.
- `POST /api/webhooks/stripe`: Listens for `checkout.session.completed` and `invoice.payment_succeeded` to update the database.

### Step 4: Frontend UI
- Modify `app/onboarding/page.tsx` or create `app/subscription/page.tsx`.
- Create a **Pricing Card** component.
  - **Design**: Clean, bright, simple instructions.
  - **Features**: "First month $0", "Cancel anytime".

### Step 5: Environment Variables
- User needs to provide:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_BASE_URL`

## Questions for User
- Do you have a Stripe account ready?
- Is the price exactly $9.90 or $9.99? (I will assume $9.90).
