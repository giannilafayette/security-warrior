import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id, service, scheduled_date, notes,
      customers ( first_name, last_name, email, address, town, parish ),
      technicians ( name )
    `)
    .eq('scheduled_date', tomorrowStr)
    .neq('status', 'cancelled')

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = []
  for (const job of jobs ?? []) {
    const c = job.customers as any
    if (!c?.email) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Security Warrior <reminders@securitywarrior.net>',
        to: [c.email],
        subject: `Appointment Reminder – ${formatDate(tomorrowStr)}`,
        html: buildEmail(c, job, tomorrowStr),
      }),
    })

    results.push({ job_id: job.id, email: c.email, ok: res.ok })
  }

  return new Response(JSON.stringify({ date: tomorrowStr, sent: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-JM', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function buildEmail(c: any, job: any, dateStr: string) {
  const location = [c.address, c.town, c.parish].filter(Boolean).join(', ')
  const techName = (job.technicians as any)?.name

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <div style="background:#0a0a2e;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Security Warrior</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0a0a2e;margin-top:0;">Appointment Reminder</h2>
      <p>Dear ${c.first_name} ${c.last_name},</p>
      <p>This is a friendly reminder that you have a scheduled appointment with <strong>Security Warrior</strong> tomorrow.</p>
      <div style="background:#f8f8ff;border-left:4px solid #0a0a2e;padding:16px 20px;margin:24px 0;border-radius:0 6px 6px 0;">
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${job.service}</p>
        <p style="margin:0 0 8px;"><strong>Date:</strong> ${formatDate(dateStr)}</p>
        ${location ? `<p style="margin:0 0 8px;"><strong>Location:</strong> ${location}</p>` : ''}
        ${techName ? `<p style="margin:0 0 8px;"><strong>Technician:</strong> ${techName}</p>` : ''}
        ${job.notes ? `<p style="margin:0;"><strong>Notes:</strong> ${job.notes}</p>` : ''}
      </div>
      <p>Please ensure someone is available at the property to receive our team.</p>
      <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
      <p style="margin-bottom:0;">Thank you for choosing Security Warrior.</p>
    </div>
    <div style="background:#f0f0f0;padding:16px 32px;text-align:center;">
      <p style="color:#666;font-size:13px;margin:0;">Security Warrior &bull; securitywarrior.net</p>
    </div>
  </div>
</body>
</html>`
}
