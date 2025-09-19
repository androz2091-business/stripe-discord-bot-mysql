"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLifetimePaymentDate = exports.getCustomerPayments = exports.cancelSubscription = exports.findActiveSubscriptions = exports.findSubscriptionsFromCustomerId = exports.resolveCustomerIdFromEmail = void 0;
const p_queue_1 = __importDefault(require("p-queue"));
const queue = new p_queue_1.default({ concurrency: 1, interval: 1000, intervalCap: 1 });
/**
 * Gets the Stripe customer ID for a given user email
 */
const resolveCustomerIdFromEmail = async (email) => {
    let customerData;
    if (email.includes('+')) {
        const endPart = email.split('+')[1];
        const customers = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/customers/search?query=email~'${endPart}'`, {
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        })).json());
        const matchingCustomers = customers.data.filter((c) => c.email === email);
        customerData = matchingCustomers[0];
    }
    else {
        const customers = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${email}'`, {
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        })).json());
        customerData = customers.data[0];
    }
    return customerData?.id;
};
exports.resolveCustomerIdFromEmail = resolveCustomerIdFromEmail;
/**
 * Gets all the Stripe subscriptions from a given customer ID
 */
const findSubscriptionsFromCustomerId = async (oldCustomerId) => {
    const subscriptions = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/subscriptions?customer=${oldCustomerId}`, {
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    })).json());
    return subscriptions.data || [];
};
exports.findSubscriptionsFromCustomerId = findSubscriptionsFromCustomerId;
/**
 * Filter the active subscriptions from a list of subscriptions
 */
const findActiveSubscriptions = (subscriptions) => {
    return subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trialing' || (sub.cancel_at && sub.current_period_end > Date.now() / 1000));
};
exports.findActiveSubscriptions = findActiveSubscriptions;
/**
 * Cancels a subscription
 */
const cancelSubscription = async (subscriptionId) => {
    await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    })).json());
};
exports.cancelSubscription = cancelSubscription;
/**
 * Gets all the Stripe payments from a given customer ID
 */
const getCustomerPayments = async (customerId) => {
    const invoices = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/payment_intents?customer=${customerId}`, {
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    })).json());
    return invoices?.data || [];
};
exports.getCustomerPayments = getCustomerPayments;
/**
 * Gets the lifetime payment date from a list of payments
 */
const getLifetimePaymentDate = (payments) => {
    let lifetimeStartDate = null;
    for (const payment of (payments || [])) {
        for (const charge of (payment.charges?.data || [])) {
            if (charge.description.includes(process.env.LIFETIME_INVOICE_LABEL_KEYWORD)) {
                lifetimeStartDate = charge.created * 1000;
            }
        }
    }
    return lifetimeStartDate;
};
exports.getLifetimePaymentDate = getLifetimePaymentDate;
