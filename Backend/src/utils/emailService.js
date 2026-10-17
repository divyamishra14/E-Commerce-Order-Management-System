// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');
const Order = require('../models/Order');

/* ─── Transporter (Ethereal test SMTP, cached) ───────────────────────── */
let transporterPromise = null;

const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`📧 Ethereal Email Account Created: ${testAccount.user}`);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })().catch((error) => {
      console.error('❌ Failed to create Ethereal email account:', error.message);
      transporterPromise = null; // allow a retry on the next email
      return null;
    });
  }
  return transporterPromise;
};

/* ─── Low-level send. Returns true/false, never throws ───────────────── */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transport = await getTransporter();
    if (!transport) {
      console.warn('[Email] No transporter available — email not sent');
      return false;
    }
    const info = await transport.sendMail({
      from: '"ShopEase" <noreply@shopease.com>',
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
    console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error.message);
    return false;
  }
};

/* ─── Send each email type at most once per order ────────────────────────
   Atomically "claims" emailsSent.<type> in MongoDB before sending, so a
   retried request or two simultaneous requests can't both send it.
   If sending fails, the claim is released so a later attempt can retry. */
const sendOnce = async (order, type, build) => {
  const field = `emailsSent.${type}`;
  try {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, [field]: null }, // matches "never sent" (null or missing)
      { $set: { [field]: new Date() } }
    );
    if (!claimed) {
      console.log(`[Email] "${type}" already sent for ${order.orderId} — skipping`);
      return false;
    }

    const ok = await sendEmail({ to: order.customerEmail, ...build(order) });
    if (!ok) {
      await Order.updateOne({ _id: order._id }, { $unset: { [field]: '' } });
    }
    return ok;
  } catch (error) {
    console.error(`[Email] "${type}" failed for ${order.orderId}:`, error.message);
    return false;
  }
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const layout = ({ title, color, body, footer }) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:30px;border-radius:12px;">
    <h1 style="color:${color};text-align:center;">${title}</h1>
    ${body}
    <p style="margin-top:30px;font-size:0.9em;color:#94a3b8;">${footer}</p>
  </div>`;

const infoBox = (rows) => `
  <div style="background:#1a1a2e;padding:20px;border-radius:8px;margin:20px 0;">${rows}</div>`;

/* ─── Templates ──────────────────────────────────────────────────────── */
const buildCreated = (order) => {
  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px;border:1px solid #333;">${esc(item.productName)}</td>
        <td style="padding:8px;border:1px solid #333;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #333;text-align:right;">$${item.priceAtOrder.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #333;text-align:right;">$${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `Order Received - #${order.orderId}`,
    html: layout({
      title: '📦 Order Received!',
      color: '#7c3aed',
      footer: 'Thank you for shopping with ShopEase!',
      body: `
        <p>Hi <strong>${esc(order.customerName)}</strong>,</p>
        <p>Your order has been placed and is waiting for payment. Here are your order details:</p>
        ${infoBox(`
          <p><strong>Order ID:</strong> <span style="color:#7c3aed;">${esc(order.orderId)}</span></p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${esc(order.orderStatus)}</p>`)}
        <h3>Items Ordered:</h3>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <thead><tr style="background:#7c3aed;color:white;">
            <th style="padding:8px;border:1px solid #333;">Product</th>
            <th style="padding:8px;border:1px solid #333;">Qty</th>
            <th style="padding:8px;border:1px solid #333;">Unit Price</th>
            <th style="padding:8px;border:1px solid #333;">Subtotal</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;margin-top:15px;font-size:1.2em;">
          <strong>Total: <span style="color:#7c3aed;">$${order.totalAmount.toFixed(2)}</span></strong>
        </div>`,
    }),
  };
};

const buildPaymentSuccess = (order) => ({
  subject: `Payment Confirmed - #${order.orderId}`,
  html: layout({
    title: '💳 Payment Successful!',
    color: '#22c55e',
    footer: 'Thank you for your purchase! Your order is being processed.',
    body: `
      <p>Hi <strong>${esc(order.customerName)}</strong>,</p>
      <p>Your payment has been processed successfully!</p>
      ${infoBox(`
        <p><strong>Order ID:</strong> <span style="color:#7c3aed;">${esc(order.orderId)}</span></p>
        <p><strong>Amount Paid:</strong> <span style="color:#22c55e;font-size:1.3em;"><strong>$${order.totalAmount.toFixed(2)}</strong></span></p>
        <p><strong>Payment Status:</strong> <span style="color:#22c55e;">Paid ✅</span></p>
        <p><strong>Order Status:</strong> ${esc(order.orderStatus)}</p>`)}`,
  }),
});

const buildCancelled = (order) => ({
  subject: `Order Cancelled - #${order.orderId}`,
  html: layout({
    title: '❌ Order Cancelled',
    color: '#ef4444',
    footer: "We're sorry for any inconvenience caused.",
    body: `
      <p>Hi <strong>${esc(order.customerName)}</strong>,</p>
      <p>We're writing to let you know that your order has been cancelled.</p>
      ${infoBox(`
        <p><strong>Order ID:</strong> <span style="color:#7c3aed;">${esc(order.orderId)}</span></p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p><strong>Status:</strong> <span style="color:#ef4444;">Cancelled</span></p>`)}
      <p>If you believe this was a mistake, please contact our support team.</p>`,
  }),
});

/* ─── Public API (same function names your controllers already use) ──── */
const sendOrderCreatedEmail = (order) => sendOnce(order, 'created', buildCreated);
const sendPaymentSuccessEmail = (order) => sendOnce(order, 'paid', buildPaymentSuccess);
const sendOrderCancelledEmail = (order) => sendOnce(order, 'cancelled', buildCancelled);

module.exports = {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
  sendOrderCancelledEmail,
};
