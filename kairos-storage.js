// kairos-storage.js — Supabase persistence layer
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { kairosGraph } from './kairos-graph.js';

const SB_URL = 'https://kzcucjcyxybypncbdbws.supabase.co';
const SB_KEY = 'sb_publishable_saeUHGocDah-T2_709M6Fg_g26JtLXw';
const sb = createClient(SB_URL, SB_KEY);

class KairosStorage {
  async syncDown() {
    await kairosGraph.ready;
    const { data: tokens } = await sb.from('tokens').select('*').order('created_at', { ascending: false }).limit(50);
    if (tokens) {
      for (const t of tokens) {
        await kairosGraph.rememberToken({
          body: t.body, domain: t.domain || 'signal',
          word_type: t.word_type || 'S', score: t.score || 50,
          extracted_at: t.created_at
        });
      }
    }
    const { data: pairs } = await sb.from('pairs').select('*').order('created_at', { ascending: false }).limit(30);
    if (pairs) {
      for (const p of pairs) {
        if (p.token_a_body && p.token_b_body) {
          await kairosGraph.rememberCoupling(
            p.token_a_body, p.token_b_body,
            'paired', p.affinity_score?.toString() || 'unknown',
            p.created_at
          );
        }
      }
    }
    const { data: triplets } = await sb.from('svo_triplets').select('*').order('created_at', { ascending: false }).limit(30);
    if (triplets) {
      for (const t of triplets) {
        await kairosGraph.rememberTransformation(
          t.subject, t.verb, t.object,
          t.verb_class || 'general', t.tension || 0.5, t.created_at
        );
      }
    }
    return { tokens: tokens?.length || 0, pairs: pairs?.length || 0, triplets: triplets?.length || 0 };
  }
}

const kairosStorage = new KairosStorage();
export { kairosStorage };
