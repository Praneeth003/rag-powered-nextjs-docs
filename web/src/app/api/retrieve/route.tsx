// This route is used to retrieve the embeddings from the Supabase database
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(request: NextRequest) {
    