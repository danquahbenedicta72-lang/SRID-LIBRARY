// FORCE DEPLOY - ADD DELETE ENDPOINT FOR ADMIN LOGS
// FORCE DEPLOY - FIX GUEST CONTACT AND OCCUPATION
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// ========== HELPER FUNCTION ==========
function calculateDuration(timeIn: string | null, timeOut: string | null): string {
  if (!timeIn || !timeOut) {
    return 'N/A';
  }
  
  try {
    const start = new Date(`2000-01-01 ${timeIn}`);
    const end = new Date(`2000-01-01 ${timeOut}`);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    
    if (isNaN(diffMinutes) || diffMinutes < 0) {
      return 'Invalid time';
    }
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    let duration = `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) {
      duration += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return duration;
  } catch (error) {
    return 'Error calculating duration';
  }
}

// ========== SUPABASE SETUP ==========
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// ========== GUEST ROUTE ==========
app.get('/guest', (req: any, res: any) => {
  res.sendFile(path.join(process.cwd(), 'guest.html'));
});

// ========== STUDENT ROUTES ==========
app.get('/api/students', async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/students', async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('students').insert(req.body).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/students/:refNo', async (req: any, res: any) => {
  try {
    const { refNo } = req.params;
    await supabase.from('attendance').delete().eq('studentRef', refNo);
    await supabase.from('students').delete().eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/students/:refNo/drop', async (req: any, res: any) => {
  try {
    const { refNo } = req.params;
    await supabase.from('students').update({ status: 'DROPPED' }).eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.put('/api/students/:refNo', async (req: any, res: any) => {
  try {
    const { refNo } = req.params;
    await supabase.from('students').update(req.body).eq('refNo', refNo);
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/students/bulk', async (req: any, res: any) => {
  try {
    const students = req.body;
    let added = 0, skipped = 0;
    for (const student of students) {
      const { error } = await supabase.from('students').insert(student);
      if (error) skipped++;
      else added++;
    }
    res.json({ added, skipped });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/students/promote', async (req: any, res: any) => {
  try {
    const { data: students, error: fetchError } = await supabase.from('students').select('*');
    if (fetchError) throw fetchError;
    
    let promoted = 0;
    let deleted = 0;
    
    for (const student of students) {
      let newYear = parseInt(student.year);
      
      if (newYear >= 1 && newYear <= 3) {
        newYear++;
        const { error: updateError } = await supabase
          .from('students')
          .update({ year: newYear.toString() })
          .eq('refNo', student.refNo);
        if (!updateError) promoted++;
      } else if (newYear === 4) {
        await supabase.from('students').delete().eq('refNo', student.refNo);
        await supabase.from('attendance').delete().eq('studentRef', student.refNo);
        deleted++;
      }
    }
    
    res.json({ success: true, promoted, deleted });
  } catch (err: unknown) {
    console.error('Promote error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== ATTENDANCE ROUTES ==========
app.get('/api/attendance', async (req: any, res: any) => {
  try {
    const { data: attendanceData, error: attError } = await supabase.from('attendance').select('*');
    if (attError) throw attError;
    const { data: studentsData, error: stuError } = await supabase.from('students').select('refNo, name');
    if (stuError) throw stuError;
    const studentMap = new Map();
    studentsData.forEach((s: any) => studentMap.set(s.refNo, s.name));
    const enriched = attendanceData.map((record: any) => ({
      ...record,
      name: studentMap.get(record.studentRef) || 'Unknown Student'
    }));
    res.json(enriched);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/attendance/action', async (req: any, res: any) => {
  try {
    const { studentRef, action, purpose } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    if (action === 'Arrive') {
      // Check if already checked in
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
      
      // Get student's year and programme
      const { data: student } = await supabase
        .from('students')
        .select('year, programme')
        .eq('refNo', studentRef)
        .single();
      
      // Insert with year and programme
      const { error } = await supabase.from('attendance').insert({
        studentRef,
        date: today,
        checkIn: new Date().toISOString(),
        purpose: purpose || 'General Study',
        year: student?.year || 'Unknown',
        programme: student?.programme || 'Unknown'
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
  } catch (err: unknown) {
    console.error('Attendance action error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== GUEST VISITS ROUTES ==========
app.get('/api/guest-visits', async (req: any, res: any) => {
  try {
    const { data, error } = await supabase
      .from('guest_visits')
      .select('id, name, purpose, visit_date, time_in, time_out, contact, occupation, location')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/guest-visits', async (req: any, res: any) => {
  try {
    const { name, location, contact, occupation, purpose } = req.body;
    
    if (!name || !contact || !occupation || !location || !purpose) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const visit_date = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('guest_visits')
      .insert([{
        name, location, contact, occupation, purpose, visit_date,
        time_in: null,
        time_out: '00:00:00',
        check_in: null,
        check_out: null,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: `✅ ${name} registered successfully!`,
      guest: data[0]
    });
  } catch (err: unknown) {
    console.error('Guest registration error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/guest-visits/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('guest_visits').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== GUEST CHECK-IN ROUTE ==========
app.post('/api/guest-attendance/checkin', async (req: any, res: any) => {
  try {
    const { name, purpose } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const now = new Date();
    const timeIn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const visitDate = now.toISOString().split('T')[0];
    
    const { data: alreadyCheckedIn } = await supabase
      .from('guest_visits')
      .select('id')
      .eq('name', name)
      .eq('visit_date', visitDate)
      .not('time_in', 'is', null)
      .eq('time_out', '00:00:00')
      .maybeSingle();
    
    if (alreadyCheckedIn) {
      return res.status(400).json({ 
        error: `${name} is already checked in today. Please check out first.` 
      });
    }
    
    const { data: existingRecord } = await supabase
      .from('guest_visits')
      .select('*')
      .eq('name', name)
      .eq('visit_date', visitDate)
      .is('time_in', null)
      .not('contact', 'is', null)
      .maybeSingle();
    
    if (existingRecord) {
      const { error } = await supabase
        .from('guest_visits')
        .update({ 
          time_in: timeIn,
          check_in: now.toISOString(),
          purpose: purpose || existingRecord.purpose
        })
        .eq('id', existingRecord.id);
      
      if (error) throw error;
      
      return res.json({ 
        success: true, 
        message: `✅ ${name} checked in at ${timeIn}`
      });
    }
    
    return res.status(404).json({ 
      error: `${name} not found. Please register first using the PURPLE QR code.`
    });
    
  } catch (err: unknown) {
    console.error('Check-in error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== GUEST CHECK-OUT ROUTE ==========
app.post('/api/guest-attendance/checkout-by-name', async (req: any, res: any) => {
  try {
    const { name, updatedPurpose } = req.body;
    const now = new Date();
    const visitDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const { data: activeVisit, error: findError } = await supabase
      .from('guest_visits')
      .select('*')
      .eq('name', name)
      .eq('visit_date', visitDate)
      .eq('time_out', '00:00:00')
      .not('time_in', 'is', null)
      .maybeSingle();
    
    if (findError) {
      return res.status(500).json({ success: false, error: findError.message });
    }
    
    if (!activeVisit) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active check-in found for this guest today' 
      });
    }
    
    const updateData: any = { 
      time_out: currentTime,
      check_out: now.toISOString()
    };
    
    let purposeChanged = false;
    let oldPurpose = activeVisit.purpose;
    let newPurpose = oldPurpose;
    
    if (updatedPurpose && updatedPurpose !== activeVisit.purpose) {
      updateData.purpose = updatedPurpose;
      purposeChanged = true;
      newPurpose = updatedPurpose;
    }
    
    const { error: updateError } = await supabase
      .from('guest_visits')
      .update(updateData)
      .eq('id', activeVisit.id);
    
    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }
    
    res.json({ 
      success: true, 
      message: purposeChanged ? 'Check-out successful with purpose update' : 'Check-out successful',
      purposeChanged: purposeChanged,
      oldPurpose: oldPurpose,
      newPurpose: newPurpose,
      checkOutTime: currentTime,
      guestName: name,
      visitDuration: calculateDuration(activeVisit.time_in, currentTime)
    });
    
  } catch (err: unknown) {
    console.error('Check-out error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// ========== SYSTEM ROUTE ==========
app.post('/api/system/reset', async (req: any, res: any) => {
  try {
    await supabase.from('attendance').delete().neq('id', 0);
    await supabase.from('students').delete().neq('id', 0);
    await supabase.from('guest_visits').delete().neq('id', 0);
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== ADMIN LOGS ROUTES ==========
app.post('/api/admin/personal-signin', async (req: any, res: any) => {
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
      if (!createError) {
        existingAdmin = newAdmin;
      }
    }
    
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        username: generatedUsername,
        full_name: name,
        login_time: new Date().toISOString()
      });
    
    if (error) throw error;
    res.json({ success: true, admin: existingAdmin });
  } catch (err: unknown) {
    console.error('Personal sign-in error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.put('/api/admin/logout', async (req: any, res: any) => {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/admin/logs', async (req: any, res: any) => {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/admin/logs/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('admin_logs').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== ADMIN PROFILE ROUTES ==========
app.get('/api/admin/profile-by-name/:name', async (req: any, res: any) => {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/admin/profile/:username', async (req: any, res: any) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ exists: !!data, profile: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/admin/profile', async (req: any, res: any) => {
  try {
    const { username, full_name, contact, email } = req.body;
    const { data, error } = await supabase
      .from('admin_profiles')
      .insert({ username, full_name, contact, email })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== ADMIN USER MANAGEMENT ==========
app.get('/api/admin/users', async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/admin/users', async (req: any, res: any) => {
  try {
    const { username, password, full_name, contact, email } = req.body;
    const { data, error } = await supabase
      .from('admin_users')
      .insert({ username, password, full_name, contact, email, role: 'ADMIN' })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/admin/users/:username', async (req: any, res: any) => {
  try {
    const { username } = req.params;
    const { error } = await supabase.from('admin_users').delete().eq('username', username);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ========== STATIC FILES & CATCH-ALL ==========
app.use(express.static(distPath));

app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3002;
console.log('🔥 SERVER RESTARTED - PORT:', PORT);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected');
});