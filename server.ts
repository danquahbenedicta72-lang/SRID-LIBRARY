import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').insert(req.body).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/action', async (req, res) => {
  try {
    const { studentRef, action, purpose } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (action === 'Arrive') {
      const { error } = await supabase.from('attendance').insert({
        studentRef,
        date: today,
        checkIn: new Date().toISOString(),
        purpose: purpose || null
      });
      if (error) throw error;
      res.json({ success: true });
    } else if (action === 'Leave') {
      const { error } = await supabase.from('attendance')
        .update({ checkOut: new Date().toISOString() })
        .eq('studentRef', studentRef)
        .eq('date', today)
        .is('checkOut', null);
      if (error) throw error;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected');
});