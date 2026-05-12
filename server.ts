// FORCE DEPLOY - ADD DELETE ENDPOINT FOR ADMIN LOGS
// FORCE DEPLOY - FIX GUEST CONTACT AND OCCUPATION
import 'dotenv/config';
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// ========== GUEST ROUTE (must be before catch-all) ==========
app.get('/guest', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'guest.html'));
});

// ========== STUDENT ROUTES ==========


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

app.post('/api/students/:refNo/drop', async (req, res) => {
  try {
    const { refNo } = req.params;
    await supabase.from('students').update({ status: 'DROPPED' }).eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    await supabase.from('students').update(req.body).eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  try {
    const students = req.body;
    let added = 0, skipped = 0;
    for (const student of students) {
      const { error } = await supabase.from('students').insert(student);
      if (error) skipped++;
      else added++;
    }
    res.json({ added, skipped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ATTENDANCE ROUTES ==========
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

app.post('/api/attendance/action', async (req, res) => {
  try {
    const { studentRef, action, purpose } = req.body;
    const today = new Date().toISOString().split('T')[0];
    if (action === 'Arrive') {
      await supabase.from('attendance').insert({ studentRef, date: today, checkIn: new Date().toISOString(), purpose: purpose || null });
      res.json({ success: true });
    } else if (action === 'Leave') {
      await supabase.from('attendance').update({ checkOut: new Date().toISOString() }).eq('studentRef', studentRef).eq('date', today).is('checkOut', null);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== GUEST VISITS API ROUTES ==========
app.get('/api/guest-visits', async (req, res) => {
  try {
    const { data, error } = await supabase.from('guest_visits').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guest-visits', async (req, res) => {
  try {
    const { name, location, contact, occupation, purpose } = req.body;
    const visit_date = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('guest_visits').insert({ name, location, contact, occupation, purpose, visit_date }).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    console.error('Guest registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== SYSTEM ROUTES ==========
app.post('/api/system/reset', async (req, res) => {
  try {
    await supabase.from('attendance').delete().neq('id', 0);
    await supabase.from('students').delete().neq('id', 0);
    await supabase.from('guest_visits').delete().neq('id', 0);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// ========== ADMIN LOGS ROUTES ==========

// Record admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username } = req.body;
    const { data, error } = await supabase
      .from('admin_logs')
      .insert({ username, login_time: new Date().toISOString() })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record admin logout
app.put('/api/admin/logout', async (req, res) => {
  try {
    const { username } = req.body;
    const { error } = await supabase
      .from('admin_logs')
      .update({ logout_time: new Date().toISOString() })
      .eq('username', username)
      .is('logout_time', null)
      .order('login_time', { ascending: false })
      .limit(1);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all admin logs
app.get('/api/admin/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('login_time', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// Delete admin log record
app.delete('/api/admin/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('admin_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN PROFILE ROUTES ==========

// Check if admin profile exists
app.get('/api/admin/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ exists: !!data, profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create admin profile
app.post('/api/admin/profile', async (req, res) => {
  try {
    const { username, full_name, contact, email } = req.body;
    const { data, error } = await supabase
      .from('admin_profiles')
      .insert({ username, full_name, contact, email })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== STATIC FILES ==========
app.use(express.static(distPath));

// ========== CATCH-ALL (MUST be LAST) ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3002;
console.log('🔥 SERVER RESTARTED WITH DELETE ENDPOINT - PORT:', PORT);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected');
});