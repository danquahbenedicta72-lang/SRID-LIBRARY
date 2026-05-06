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

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new student
app.post('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').insert(req.body).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
app.delete('/api/students/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    await supabase.from('attendance').delete().eq('studentRef', refNo);
    await supabase.from('students').delete().eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for analytics
app.get('/api/attendance', async (req, res) => {
  try {
    const { data: attendanceData, error: attError } = await supabase.from('attendance').select('*');
    if (attError) throw attError;

    const { data: studentsData, error: stuError } = await supabase.from('students').select('refNo, year, programme, name');
    if (stuError) throw stuError;

    const studentsMap = new Map();
    studentsData.forEach(s => studentsMap.set(s.refNo, { year: s.year, programme: s.programme, name: s.name }));

    const enriched = attendanceData.map(record => ({
      ...record,
      year: studentsMap.get(record.studentRef)?.year,
      programme: studentsMap.get(record.studentRef)?.programme,
      name: studentsMap.get(record.studentRef)?.name
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance action
app.post('/api/attendance/action', async (req, res) => {
  try {
    const { studentRef, action, purpose } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (action === 'Arrive') {
      await supabase.from('attendance').insert({
        studentRef,
        date: today,
        checkIn: new Date().toISOString(),
        purpose: purpose || null
      });
      res.json({ success: true });
    } else if (action === 'Leave') {
      await supabase.from('attendance')
        .update({ checkOut: new Date().toISOString() })
        .eq('studentRef', studentRef)
        .eq('date', today)
        .is('checkOut', null);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route (must be LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected');
});