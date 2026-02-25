import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TOPICS = new Set(['general', 'alliance', 'support', 'bug', 'partnership']);
const DISCORD_WEBHOOK_URL = process.env.CONTACT_DISCORD_WEBHOOK_URL;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  const candidate = forwarded?.split(',')[0]?.trim() || realIp || cfIp;
  return candidate && candidate.length <= 100 ? candidate : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeDiscordText(value: string): string {
  return value.replace(/[`*_~|]/g, '\\$&');
}

async function notifyDiscord(params: {
  name: string;
  email: string;
  topic: string;
  message: string;
  sourcePath: string;
  ipAddress: string | null;
}) {
  if (!DISCORD_WEBHOOK_URL) return;

  const preview = params.message.length > 800
    ? `${params.message.slice(0, 800)}...`
    : params.message;

  const payload = {
    username: 'State 244 Contact Bot',
    embeds: [
      {
        title: 'New Contact Form Message',
        color: 0x10b981,
        fields: [
          { name: 'Name', value: escapeDiscordText(params.name), inline: true },
          { name: 'Email', value: escapeDiscordText(params.email), inline: true },
          { name: 'Topic', value: escapeDiscordText(params.topic), inline: true },
          { name: 'Source', value: escapeDiscordText(params.sourcePath), inline: true },
          { name: 'IP', value: escapeDiscordText(params.ipAddress ?? 'unknown'), inline: true },
          { name: 'Message', value: escapeDiscordText(preview) || '(empty)' },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Discord contact webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Discord contact webhook error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot: act like success to avoid training bots.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const topicRaw = typeof body.topic === 'string' ? body.topic.trim().toLowerCase() : 'general';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const sourcePath = typeof body.source_path === 'string' ? body.source_path.trim() : '/contact';
    const formStartedAt = Number(body.form_started_at);

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (name.length > 80) {
      return NextResponse.json({ error: 'Name must be 80 characters or less' }, { status: 400 });
    }

    if (!isValidEmail(email) || email.length > 255) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (message.length < 10 || message.length > 4000) {
      return NextResponse.json({ error: 'Message must be between 10 and 4000 characters' }, { status: 400 });
    }

    if (!ALLOWED_TOPICS.has(topicRaw)) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    if (sourcePath.length > 200 || !sourcePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid source path' }, { status: 400 });
    }

    if (!Number.isFinite(formStartedAt)) {
      return NextResponse.json({ error: 'Invalid submission metadata' }, { status: 400 });
    }

    // Lightweight bot friction: reject submissions sent unrealistically fast.
    if (Date.now() - formStartedAt < 1500) {
      return NextResponse.json({ error: 'Please take a moment before submitting' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', oneHourAgo);

      if (countError) {
        console.error('Contact rate limit lookup failed:', countError);
      } else if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: 'Too many messages sent from this network. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name,
        email,
        topic: topicRaw,
        message,
        source_path: sourcePath,
        ip_address: ipAddress,
        user_agent: userAgent?.slice(0, 500) ?? null,
      });

    if (error) {
      console.error('Error inserting contact message:', error);
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }

    await notifyDiscord({
      name,
      email,
      topic: topicRaw,
      message,
      sourcePath,
      ipAddress,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
