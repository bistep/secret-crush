// Email Notification Service for Secret Crush
// Alerts the owner whenever a visitor joins, sends a message, or clicks a locked chat

const RECIPIENT_EMAILS = [
  'itsmenjcut@gmail.com',
  'nivedh151@gmail.com',
  'ta3980682@gmail.com'
];

let nodemailer = null;
let transporter = null;

// Initialize transporter dynamically
async function getTransporter() {
  if (transporter) return transporter;
  try {
    const mod = await import('nodemailer');
    nodemailer = mod.default || mod;

    const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'secretcrushalert@gmail.com';
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';

    if (pass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      // Fallback test transport or console logger
      transporter = {
        sendMail: async (opts) => {
          console.log(`\n🔔 [EMAIL ALERT NOTIFICATION]`);
          console.log(`To: ${opts.to}`);
          console.log(`Subject: ${opts.subject}`);
          console.log(`Content:\n${opts.text || opts.html}\n`);
          return { messageId: 'simulated_' + Date.now() };
        }
      };
    }
    return transporter;
  } catch (err) {
    // If nodemailer not yet installed locally
    return {
      sendMail: async (opts) => {
        console.log(`\n🔔 [EMAIL ALERT TO: ${RECIPIENT_EMAILS.join(', ')}] Subject: ${opts.subject}`);
        console.log(`Details: ${opts.text || opts.html}`);
        return { messageId: 'fallback_' + Date.now() };
      }
    };
  }
}

/**
 * Send alert email to the 3 owner emails
 */
export async function sendOwnerAlert({ subject, text, html }) {
  try {
    const t = await getTransporter();
    const mailOptions = {
      from: `"Secret Crush Live Alert" <alerts@secret-crush.com>`,
      to: RECIPIENT_EMAILS.join(', '),
      subject: `🚨 [Secret Crush] ${subject}`,
      text,
      html: html || `<div style="font-family:sans-serif;padding:20px;background:#0d0918;color:#fff;border-radius:12px;">
        <h2 style="color:#f43f5e;">Secret Crush Instant Alert</h2>
        <p style="font-size:15px;line-height:1.6;">${text.replace(/\n/g, '<br/>')}</p>
        <hr style="border-color:#33204e;"/>
        <p style="font-size:12px;color:#a8a29e;">Open your laptop inbox at: <a href="https://secret-crush.onrender.com/owner/inbox" style="color:#ec4899;">/owner/inbox</a></p>
      </div>`
    };

    const res = await t.sendMail(mailOptions);
    console.log(`✉️ Alert dispatched to ${RECIPIENT_EMAILS.length} emails. ID: ${res.messageId}`);
  } catch (e) {
    console.log('Error dispatching email alert:', e.message);
  }
}
