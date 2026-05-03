import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const app = express(); //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Supabase client initialization
let _supabase: any = null;
function getSupabase() {


  if (!_supabase) {
    // User provided credentials
    const providedUrl = 'https://wnuubwwfahbmocqwqasv.supabase.co/rest/v1/';
    const providedKey = 'sb_publishable_B-uhIFWrulruVvxZ3f25eg_IahvVAep';

    const urlFromEnv = process.env.VITE_SUPABASE_URL;
    const keyFromEnv = process.env.VITE_SUPABASE_ANON_KEY;

    let url = (urlFromEnv || providedUrl).trim();
    const key = (keyFromEnv && keyFromEnv !== 'your_anon_key_here' ? keyFromEnv : providedKey).trim();

    // Normalize URL strictly: Supabase SDK expects the base project URL, not the REST endpoint
    let normalizedUrl = url;
    if (normalizedUrl.includes('/rest/v1')) {
      normalizedUrl = normalizedUrl.split('/rest/v1')[0];
    }
    while (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://wnuubwwfahbmocqwqasv.supabase.co';
    }

    console.log(`Initializing Supabase with URL: ${normalizedUrl}`);
    _supabase = createClient(normalizedUrl, key);
  }
  return _supabase;
}
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: admin, error } = await getSupabase()
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ role: admin.role, username: admin.username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: admin, error } = await getSupabase()
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ role: admin.role, username: admin.username });
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
});
async function startServer() {

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", async (req, res) => {
    try {
      const { data, error } = await getSupabase().from('students').select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const student = req.body;
    try {
      const { data: existing } = await getSupabase()
        .from('students')
        .select('refNo')
        .eq('refNo', student.refNo)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: "Student already registered" });
      }

      const newStudent = { ...student, status: student.status || "ACTIVE" };
      const { data, error } = await getSupabase().from('students').insert([newStudent]).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/attendance/action", async (req, res) => {
    const { studentRef, action, purpose } = req.body;

    try {
      const { data: student, error: studentError } = await getSupabase()
        .from('students')
        .select('*')
        .eq('refNo', studentRef)
        .maybeSingle();

      if (studentError || !student) {
        return res.status(404).json({ error: "Student not registered. Please register first." });
      }

      if (student.status === "DROPPED") {
        return res.status(403).json({ error: "This student record has been dropped. Access denied." });
      }

      const today = new Date().toISOString().split('T')[0];

      if (action === "Arrive") {
        const { data: activeSession } = await getSupabase()
          .from('attendance')
          .select('*')
          .eq('studentRef', studentRef)
          .eq('date', today)
          .is('checkOut', null)
          .maybeSingle();

        if (activeSession) return res.status(400).json({ error: "You are already checked in." });

        const { data, error } = await getSupabase().from('attendance').insert([{
          studentRef,
          checkIn: new Date().toISOString(),
          checkOut: null,
          date: today,
          purpose: purpose || "General Study"
        }]).select().single();

        if (error) throw error;
        return res.status(201).json(data);
      } else if (action === "Leave") {
        const { data: record, error: recordError } = await getSupabase()
          .from('attendance')
          .select('*')
          .eq('studentRef', studentRef)
          .eq('date', today)
          .is('checkOut', null)
          .maybeSingle();

        if (recordError || !record) return res.status(404).json({ error: "No active session found. Did you check in?" });

        const { data, error } = await getSupabase()
          .from('attendance')
          .update({ checkOut: new Date().toISOString() })
          .eq('id', record.id)
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      }

      res.status(400).json({ error: "Invalid action" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/attendance", async (req, res) => {
    try {
      const { data, error } = await getSupabase().from('attendance').select('*').order('checkIn', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/attendance/check-in", async (req, res) => {
    const { studentRef, purpose } = req.body;
    try {
      const { data: student } = await getSupabase().from('students').select('*').eq('refNo', studentRef).maybeSingle();
      if (!student) return res.status(404).json({ error: "Student not found" });

      const today = new Date().toISOString().split('T')[0];
      const { data: activeSession } = await getSupabase()
        .from('attendance')
        .select('*')
        .eq('studentRef', studentRef)
        .eq('date', today)
        .is('checkOut', null)
        .maybeSingle();

      if (activeSession) {
        return res.status(400).json({ error: "Student already checked in" });
      }

      const { data, error } = await getSupabase().from('attendance').insert([{
        studentRef,
        checkIn: new Date().toISOString(),
        checkOut: null,
        date: today,
        purpose: purpose || "General Study"
      }]).select().single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/attendance/check-out", async (req, res) => {
    const { studentRef } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: record } = await getSupabase()
        .from('attendance')
        .select('*')
        .eq('studentRef', studentRef)
        .eq('date', today)
        .is('checkOut', null)
        .maybeSingle();

      if (!record) {
        return res.status(404).json({ error: "No active check-in found for today" });
      }

      const { data, error } = await getSupabase()
        .from('attendance')
        .update({ checkOut: new Date().toISOString() })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/students/bulk", async (req, res) => {
    const newStudents = req.body;
    let addedCount = 0;
    let skippedCount = 0;

    try {
      for (const student of newStudents) {
        const { data: existing } = await getSupabase()
          .from('students')
          .select('refNo')
          .eq('refNo', student.refNo)
          .maybeSingle();

        if (!existing) {
          const { error } = await getSupabase().from('students').insert([{ ...student, status: student.status || "ACTIVE" }]);
          if (!error) addedCount++;
          else skippedCount++;
        } else {
          skippedCount++;
        }
      }
      res.json({ added: addedCount, skipped: skippedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/students/:refNo/drop", async (req, res) => {
    const { refNo } = req.params;
    try {
      const { data, error } = await getSupabase()
        .from('students')
        .update({ status: "DROPPED" })
        .eq('refNo', refNo)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/students/:refNo", async (req, res) => {
    const { refNo } = req.params;
    try {
      // Cascade delete is not assumed, so we clear attendance first if not handled by DB
      await getSupabase().from('attendance').delete().eq('studentRef', refNo);
      const { error } = await getSupabase().from('students').delete().eq('refNo', refNo);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/system/reset", async (req, res) => {
    try {
      // In a real app, you might want to be more careful with blanket deletes
      await getSupabase().from('attendance').delete().neq('id', 'placeholder');
      await getSupabase().from('students').delete().neq('refNo', 'placeholder');
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/students/:refNo", async (req, res) => {
    const { refNo } = req.params;
    const updatedData = req.body;
    try {
      const { data, error } = await getSupabase()
        .from('students')
        .update(updatedData)
        .eq('refNo', refNo)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      // Supabase join syntax: select('*, students(*)')
      const { data, error } = await getSupabase()
        .from('attendance')
        .select('*, students(*)');

      if (error) throw error;

      const enrichedAttendance = (data || []).map((record: any) => ({
        ...record,
        ...(record.students || {})
      }));

      res.json(enrichedAttendance);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
