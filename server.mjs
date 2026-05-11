import cors from 'cors';
import express from 'express';
import pg from 'pg';
import { config } from './config.mjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, database: 'connected' });
  } catch (_error) {
    res.status(500).json({ success: false, database: 'disconnected' });
  }
});

function validateSubmission(input) {
  const required = [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'training_interest',
    'learning_device'
  ];

  for (const key of required) {
    if (!input[key] || String(input[key]).trim() === '') {
      return `Missing required field: ${key}`;
    }
  }
  return null;
}

app.get('/api/submissions', async (req, res) => {
  const limitParam = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, other_names, email, phone_number,
              training_interest, learning_device, whatsapp_consent,
              schedule_email_consent, submitted_at
       FROM onboarding_submissions
       ORDER BY submitted_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, submissions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to read submissions' });
  }
});

app.post('/api/submissions', async (req, res) => {
  const payload = req.body ?? {};
  const validationError = validateSubmission(payload);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO onboarding_submissions
       (first_name, last_name, other_names, email, phone_number, training_interest, learning_device,
        whatsapp_consent, schedule_email_consent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, submitted_at`,
      [
        payload.first_name.trim(),
        payload.last_name.trim(),
        payload.other_names?.trim() || null,
        payload.email.trim(),
        payload.phone_number.trim(),
        payload.training_interest.trim(),
        payload.learning_device.trim(),
        payload.whatsapp_consent ?? true,
        payload.schedule_email_consent ?? true
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create submission' });
  }
});

app.put('/api/submissions/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const payload = req.body ?? {};
  const validationError = validateSubmission(payload);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE onboarding_submissions
       SET first_name=$1, last_name=$2, other_names=$3, email=$4, phone_number=$5,
           training_interest=$6, learning_device=$7, whatsapp_consent=$8, schedule_email_consent=$9
       WHERE id=$10
       RETURNING id`,
      [
        payload.first_name.trim(),
        payload.last_name.trim(),
        payload.other_names?.trim() || null,
        payload.email.trim(),
        payload.phone_number.trim(),
        payload.training_interest.trim(),
        payload.learning_device.trim(),
        payload.whatsapp_consent ?? true,
        payload.schedule_email_consent ?? true,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update submission' });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }
  try {
    const result = await pool.query('DELETE FROM onboarding_submissions WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete submission' });
  }
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful.');
    app.listen(config.port, () => {
      console.log(`Manager app running at http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to connect to database. Check DATABASE_URL in manager/.env');
    console.error(error.message);
    process.exit(1);
  }
}

start();
