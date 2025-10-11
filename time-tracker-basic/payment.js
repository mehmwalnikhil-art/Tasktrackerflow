// Payment Gateway Integration - Stripe
(function() {
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'; // Replace with your Stripe key
  const SUBSCRIPTION_KEY = 'taskflow:subscription';
  
  // Pricing plans
  const PLANS = {
    free: {
      name: 'Free',
      price: 0,
      features: [
        'Up to 10 tasks',
        'Basic time tracking',
        'Local storage only',
        'Email support'
      ]
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      priceId: 'price_YOUR_PRICE_ID', // Stripe Price ID
      features: [
        'Unlimited tasks',
        'Advanced analytics',
        'Cloud sync',
        'Priority support',
        'Team collaboration',
        'Custom integrations'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 29.99,
      priceId: 'price_YOUR_ENTERPRISE_PRICE_ID',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom branding',
        'API access',
        'SLA guarantee',
        'Advanced security'
      ]
    }
  };

  function getSubscription() {
    try {
      return JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY)) || { plan: 'free', status: 'active' };
    } catch {
      return { plan: 'free', status: 'active' };
    }
  }

  function setSubscription(data) {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(data));
  }

  function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
      <div class="payment-modal-overlay"></div>
      <div class="payment-modal-content">
        <button class="payment-close">✕</button>
        
        <div class="payment-header">
          <h2>Upgrade to Pro</h2>
          <p>Unlock all features and boost your productivity</p>
        </div>

        <div class="pricing-plans">
          ${Object.entries(PLANS).map(([key, plan]) => `
            <div class="pricing-card ${key === 'pro' ? 'featured' : ''}">
              ${key === 'pro' ? '<div class="featured-badge">Most Popular</div>' : ''}
              <h3>${plan.name}</h3>
              <div class="price">
                <span class="currency">$</span>
                <span class="amount">${plan.price}</span>
                <span class="period">/month</span>
              </div>
              <ul class="features-list">
                ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
              </ul>
              <button class="pricing-btn ${key === 'free' ? 'current' : ''}" 
                      data-plan="${key}" 
                      ${key === 'free' ? 'disabled' : ''}>
                ${key === 'free' ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          `).join('')}
        </div>

        <div class="payment-footer">
          <p>🔒 Secure payment powered by Stripe</p>
          <p>Cancel anytime • 30-day money-back guarantee</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.payment-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.payment-modal-overlay').addEventListener('click', () => {
      modal.remove();
    });

    // Plan selection
    modal.querySelectorAll('.pricing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.dataset.plan;
        if (plan !== 'free') {
          initiateCheckout(plan);
        }
      });
    });
  }

  async function initiateCheckout(plan) {
    const planData = PLANS[plan];
    
    // In production, this would call your backend to create a Stripe Checkout session
    // For demo, we'll simulate the process
    
    const confirmed = confirm(
      `Upgrade to ${planData.name} for $${planData.price}/month?\n\n` +
      `This is a demo. In production, you'll be redirected to Stripe Checkout.\n\n` +
      `Click OK to simulate successful payment.`
    );

    if (confirmed) {
      // Simulate successful payment
      setSubscription({
        plan: plan,
        status: 'active',
        startDate: Date.now(),
        nextBilling: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      alert('✓ Payment successful! You are now on the ' + planData.name + ' plan.');
      window.location.reload();
    }
  }

  // Real Stripe integration (for production)
  async function createStripeCheckout(plan) {
    try {
      // Call your backend API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PLANS[plan].priceId,
          userId: window.TaskFlowAuth?.getCurrentUser()?.userId
        })
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        alert('Payment failed: ' + error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to initiate checkout. Please try again.');
    }
  }

  function checkSubscriptionLimits() {
    const sub = getSubscription();
    const user = window.TaskFlowAuth?.getCurrentUser();
    
    if (!user) return true;

    // Get user's task count
    const taskKey = `taskflow:data:${user.email}`;
    const userData = JSON.parse(localStorage.getItem(taskKey) || '{"tasks":[]}');
    const taskCount = userData.tasks?.length || 0;

    if (sub.plan === 'free' && taskCount >= 10) {
      alert('You have reached the free plan limit of 10 tasks. Upgrade to Pro for unlimited tasks!');
      showUpgradeModal();
      return false;
    }

    return true;
  }

  function initPayment() {
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', showUpgradeModal);
    }

    // Show subscription status
    const sub = getSubscription();
    if (sub.plan !== 'free') {
      const sidebar = document.querySelector('.sidebar-footer');
      if (sidebar) {
        const badge = document.createElement('div');
        badge.className = 'subscription-badge';
        badge.innerHTML = `
          <div class="sub-badge-content">
            <span class="sub-icon">⭐</span>
            <span class="sub-text">${PLANS[sub.plan].name} Plan</span>
          </div>
        `;
        sidebar.insertBefore(badge, sidebar.firstChild);
      }
    }
  }

  // Export functions
  window.TaskFlowPayment = {
    init: initPayment,
    showUpgrade: showUpgradeModal,
    checkLimits: checkSubscriptionLimits,
    getSubscription: getSubscription
  };
})();
