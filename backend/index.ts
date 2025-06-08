import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5050;
const DATA_FILE = path.join(__dirname, 'reports.json');

app.use(cors());
app.use(express.json({limit: '10mb'})); // Increase limit for larger images

const readReports = (): any => { // Helper to read reports
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(rawData);
};


const writeReports = (data: any): void => { // Helper to write reports
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/api/reports', (req, res) => { // GET /reports
  try {
    const data = readReports();
    res.json(data.reports);
  } catch (err) {
    console.error('Error reading reports:', err);
    res.status(500).json({ error: 'Failed to read reports.' });
  }
});

app.post('/api/reports', (req: Request, res: Response) => { // POST /reports
  try {
    const { location, incident, status, date_reported, image } = req.body;
    if (!location || !incident || !status || !date_reported) {
      res.status(400).json({ error: 'Missing required fields.' });
    }

    const data = readReports();
    const newId = data.reports.length > 0 ? data.reports[data.reports.length - 1].id + 1 : 1;

    const newReport = {
      id: newId,
      location,
      incident,
      date_reported,
      status,
      image
    };

    data.reports.push(newReport);
    writeReports(data);

    res.status(201).json({ message: 'Report added successfully.', report: newReport });
  } catch (err) {
    console.error('Error writing report:', err);
    res.status(500).json({ error: 'Failed to write report.' });
  }
});

app.listen(PORT, () => { // Start server
  console.log(`Backend server running on http://localhost:${PORT}`);
});
