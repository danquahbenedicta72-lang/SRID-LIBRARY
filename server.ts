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
    const { data: studentsData, error: stuError } = await supabase.from('students').select('refNo, name');
    if (stuError) throw stuError;
    const studentMap = new Map();
    studentsData.forEach(s => studentMap.set(s.refNo, s.name));
    const enriched = attendanceData.map(record => ({
      ...record,
      name: studentMap.get(record.studentRef) || 'Unknown Student'
    }));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== FIXED ATTENDANCE ACTION ENDPOINT ==========
app.post('/api/attendance/action', async (req, res) => {
  try {
    const { studentRef, action, purpose } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    if (action === 'Arrive') {
      // Check if student already has an active session today
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('studentRef', studentRef)
        .eq('date', today)
        .is('checkOut', null)
        .single();
      
      if (existing) {
        return res.json({ success: true, message: 'Already checked in' });
      }
      
      const { error } = await supabase.from('attendance').insert({
        studentRef,
        date: today,
        checkIn: new Date().toISOString(),
        purpose: purpose || 'General Study'
      });
      
      if (error) throw error;
      res.json({ success: true });
      
    } else if (action === 'Leave') {
      const { error } = await supabase
        .from('attendance')
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
    console.error('Attendance action error:', err);
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

app.delete('/api/guest-visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('guest_visits').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
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
app.post('/api/admin/personal-signin', async (req, res) => {
  try {
    const { name } = req.body;
    const generatedUsername = name.toLowerCase().replace(/\s/g, '_');
    let { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', generatedUsername)
      .single();
    if (!existingAdmin) {
      const { data: newAdmin, error: createError } = await supabase
        .from('admin_users')
        .insert({
          username: generatedUsername,
          password: 'default123',
          full_name: name,
          role: 'ADMIN'
        })
        .select()
        .single();
      if (createError) {
        console.error('Error creating admin:', createError);
      } else {
        existingAdmin = newAdmin;
      }
    }
    const { data, error } = await supabase
      .from('admin_logs')
      .insert({
        username: generatedUsername,
        full_name: name,
        login_time: new Date().toISOString()
      })
      .select();
    if (error) throw error;
    res.json({ success: true, admin: existingAdmin });
  } catch (err: any) {
    console.error('Personal sign-in error:', err);
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/admin/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .not('full_name', 'is', null)
      .neq('username', 'srid_lib')
      .neq('username', 'super_lib')
      .order('login_time', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('admin_logs').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN PROFILE ROUTES ==========
app.get('/api/admin/profile-by-name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('full_name', decodedName)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ exists: !!data, profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

// ========== ADMIN USER MANAGEMENT ==========
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { username, password, full_name, contact, email } = req.body;
    const { data, error } = await supabase
      .from('admin_users')
      .insert({ username, password, full_name, contact, email, role: 'ADMIN' })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { error } = await supabase.from('admin_users').delete().eq('username', username);
    if (error) throw error;
    res.json({ success: true });
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
console.log('🔥 SERVER RESTARTED - PORT:', PORT);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected');
});