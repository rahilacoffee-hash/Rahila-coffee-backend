// utils/orderConfirmationEmail.js

function orderConfirmationEmail({ userName, orderId, productName, productImage, totalAmt, deliveryAddress }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1A0F0A;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#D4A853;font-size:26px;font-weight:800;letter-spacing:1px;">☕ Rahila Coffee</h1>
              <p style="margin:6px 0 0;color:#B8A99A;font-size:13px;">Freshly Roasted · Delivered Fast</p>
            </td>
          </tr>

          <!-- Green success banner -->
          <tr>
            <td style="background:#D1FAE5;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#065F46;font-size:15px;font-weight:700;">✅ Your order has been placed successfully!</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;color:#1A0F0A;font-size:15px;">Hi <strong>${userName}</strong>,</p>
              <p style="margin:8px 0 0;color:#6B5B4E;font-size:14px;line-height:1.6;">
                Thank you for your order! We're preparing your coffee and will ship it soon.
                Here's a summary of what you ordered.
              </p>
            </td>
          </tr>

          <!-- Order ID box -->
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;display:inline-block;width:100%;box-sizing:border-box;">
                <p style="margin:0;font-size:11px;color:#92400E;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#1A0F0A;font-family:monospace;">${orderId}</p>
              </div>
            </td>
          </tr>

          <!-- Product -->
          <tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6B5B4E;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e8e0;border-radius:12px;overflow:hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding:14px 16px;">
                    ${productImage ? `<img src="${productImage}" alt="${productName}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;display:block;" />` : ""}
                  </td>
                  <td style="padding:14px 12px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#1A0F0A;">${productName || "Rahila Coffee Order"}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">Premium specialty coffee</p>
                  </td>
                  <td style="padding:14px 16px;text-align:right;">
                    <p style="margin:0;font-size:16px;font-weight:800;color:#92400E;">$${Number(totalAmt).toFixed(2)}</p>
                    <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF;">incl. shipping</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery address -->
          ${deliveryAddress ? `
          <tr>
            <td style="padding:16px 32px 0;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6B5B4E;text-transform:uppercase;letter-spacing:1px;">Delivery Address</p>
              <div style="background:#f9f9f9;border:1px solid #e8e0d8;border-radius:10px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#4B3832;line-height:1.6;">
                  ${deliveryAddress.street || ""}<br/>
                  ${deliveryAddress.city || ""}, ${deliveryAddress.zip || ""}<br/>
                  ${deliveryAddress.country || ""}
                </p>
              </div>
            </td>
          </tr>` : ""}

          <!-- Delivery estimate -->
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#1E40AF;">
                  🚚 <strong>Estimated delivery:</strong> 2-4 business days within Nigeria
                </p>
              </div>
            </td>
          </tr>

          <!-- Track button -->
          <tr>
            <td style="padding:24px 32px;" align="center">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/order-tracking"
                style="display:inline-block;background:#92400E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:12px;letter-spacing:0.5px;">
                Track My Order →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #f0e8e0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:hello@rahilacoffee.com" style="color:#92400E;text-decoration:none;font-weight:600;">hello@rahilacoffee.com</a>
              </p>
              <p style="margin:10px 0 0;font-size:11px;color:#C4B5A8;">
                © ${new Date().getFullYear()} Rahila Coffee · Abuja, Nigeria
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export default orderConfirmationEmail