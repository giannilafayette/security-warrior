const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { fname, lname, email, phone, address, service, message } = await req.json()

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <div style="background:#0a0a2e;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Security Warrior</h1>
      <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">New Contact Form Submission</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;font-size:14px;width:120px;"><strong>Name</strong></td><td style="padding:8px 0;font-size:14px;">${fname} ${lname}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Email</strong></td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Phone</strong></td><td style="padding:8px 0;font-size:14px;">${phone}</td></tr>` : ''}
        ${address ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Address</strong></td><td style="padding:8px 0;font-size:14px;">${address}</td></tr>` : ''}
        ${service ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Service</strong></td><td style="padding:8px 0;font-size:14px;">${service}</td></tr>` : ''}
      </table>
      <div style="margin-top:20px;background:#f8f8ff;border-left:4px solid #0a0a2e;padding:16px 20px;border-radius:0 6px 6px 0;">
        <p style="margin:0;color:#333;font-size:14px;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#999;">Reply directly to this email to respond to ${fname}.</p>
    </div>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Security Warrior Website <reminders@securitywarrior.net>',
      to: ['info@securitywarrior.net'],
      reply_to: email,
      subject: `New Contact: ${fname} ${lname}`,
      html,
    }),
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
