import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const filePath = path.join(process.cwd(), 'received_webhooks.json');

function readWebhooks() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

function writeWebhooks(data: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// GET: Retrieve all received webhooks (for QA UI verification)
export async function GET(request: Request) {
  try {
    const webhooks = readWebhooks();
    return NextResponse.json(webhooks);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Receive a webhook, verify its signature, and log it
export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET || 'super-secret-webhook-key-for-hmac-signatures';
  const signature = request.headers.get('X-Recruiting-Signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing X-Recruiting-Signature header' }, { status: 401 });
  }

  try {
    const rawBody = await request.text();

    // Verify HMAC-SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== computedSignature) {
      return NextResponse.json({
        error: 'Invalid signature verification failed',
        received: signature,
        computed: computedSignature
      }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Save received webhook
    const webhooks = readWebhooks();
    const newWebhookLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': request.headers.get('content-type'),
        'x-recruiting-signature': signature,
      },
      payload
    };

    webhooks.unshift(newWebhookLog); // Newer first
    writeWebhooks(webhooks);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook receiver error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Clear all received webhooks (helper for resetting test state)
export async function DELETE(request: Request) {
  try {
    writeWebhooks([]);
    return NextResponse.json({ cleared: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
