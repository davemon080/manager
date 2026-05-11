const refs = {
  form: document.getElementById('submissionForm'),
  formTitle: document.getElementById('formTitle'),
  id: document.getElementById('submissionId'),
  first_name: document.getElementById('first_name'),
  last_name: document.getElementById('last_name'),
  other_names: document.getElementById('other_names'),
  email: document.getElementById('email'),
  phone_number: document.getElementById('phone_number'),
  training_interest: document.getElementById('training_interest'),
  learning_device: document.getElementById('learning_device'),
  whatsapp_consent: document.getElementById('whatsapp_consent'),
  schedule_email_consent: document.getElementById('schedule_email_consent'),
  tableBody: document.getElementById('tableBody'),
  emptyState: document.getElementById('emptyState'),
  cancelEdit: document.getElementById('cancelEdit'),
  refreshBtn: document.getElementById('refreshBtn')
};

let submissions = [];

function getFormPayload() {
  return {
    first_name: refs.first_name.value.trim(),
    last_name: refs.last_name.value.trim(),
    other_names: refs.other_names.value.trim(),
    email: refs.email.value.trim(),
    phone_number: refs.phone_number.value.trim(),
    training_interest: refs.training_interest.value.trim(),
    learning_device: refs.learning_device.value.trim(),
    whatsapp_consent: refs.whatsapp_consent.checked,
    schedule_email_consent: refs.schedule_email_consent.checked
  };
}

function resetForm() {
  refs.form.reset();
  refs.whatsapp_consent.checked = true;
  refs.schedule_email_consent.checked = true;
  refs.id.value = '';
  refs.formTitle.textContent = 'Add Submission';
}

function startEdit(row) {
  refs.id.value = row.id;
  refs.first_name.value = row.first_name ?? '';
  refs.last_name.value = row.last_name ?? '';
  refs.other_names.value = row.other_names ?? '';
  refs.email.value = row.email ?? '';
  refs.phone_number.value = row.phone_number ?? '';
  refs.training_interest.value = row.training_interest ?? '';
  refs.learning_device.value = row.learning_device ?? '';
  refs.whatsapp_consent.checked = !!row.whatsapp_consent;
  refs.schedule_email_consent.checked = !!row.schedule_email_consent;
  refs.formTitle.textContent = `Edit Submission #${row.id}`;
}

async function fetchSubmissions() {
  const res = await fetch('/api/submissions');
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to fetch submissions');
  }
  submissions = json.submissions || [];
  renderTable();
}

async function removeSubmission(id) {
  if (!confirm('Delete this submission?')) return;
  const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) {
    alert(json.error || 'Delete failed');
    return;
  }
  await fetchSubmissions();
}

function renderTable() {
  refs.tableBody.innerHTML = submissions.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${row.first_name} ${row.last_name}</td>
      <td>${row.email}</td>
      <td>${row.phone_number}</td>
      <td>${row.training_interest}</td>
      <td>${row.learning_device}</td>
      <td>${new Date(row.submitted_at).toLocaleString()}</td>
      <td>
        <div class="actions">
          <button data-action="edit" data-id="${row.id}">Edit</button>
          <button data-action="delete" data-id="${row.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  refs.emptyState.classList.toggle('hidden', submissions.length > 0);
}

refs.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = refs.id.value.trim();
  const payload = getFormPayload();

  const isEdit = Boolean(id);
  const url = isEdit ? `/api/submissions/${id}` : '/api/submissions';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) {
    alert(json.error || 'Save failed');
    return;
  }

  resetForm();
  await fetchSubmissions();
});

refs.tableBody.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute('data-action');
  const id = Number.parseInt(target.getAttribute('data-id') || '', 10);
  if (!Number.isInteger(id)) return;

  const row = submissions.find((item) => item.id === id);
  if (!row) return;

  if (action === 'edit') startEdit(row);
  if (action === 'delete') await removeSubmission(id);
});

refs.cancelEdit.addEventListener('click', resetForm);
refs.refreshBtn.addEventListener('click', fetchSubmissions);

fetchSubmissions().catch((error) => {
  alert(error.message);
});
