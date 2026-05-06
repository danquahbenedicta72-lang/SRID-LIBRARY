import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

let students = [];
let attendance = [];

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.post('/api/students', (req, res) => {
  students.push(req.body);
  res.json(req.body);
});

app.post('/api/attendance/action', (req, res) => {
  const { studentRef, action, purpose } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  if (action === 'Arrive') {
    attendance.push({
      id: Date.now(),
      studentRef,
      date: today,
      checkIn: new Date().toISOString(),
      checkOut: null,
      purpose
    });
    res.json({ success: true });
  } else if (action === 'Leave') {
    const record = attendance.find(a => a.studentRef === studentRef && a.date === today && !a.checkOut);
    if (record) {
      record.checkOut = new Date().toISOString();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'No active session found' });
    }
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});