const PASSWORD_KEY = 'manager_admin_password';

const refs = {
  adminPassword: document.getElementById('adminPassword'),
  savePasswordBtn: document.getElementById('savePasswordBtn'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageInfo: document.getElementById('pageInfo'),
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

const state = {
  submissions: [],
  page: 1,
  limit: 20,
  totalPages: 1,
  search: ''
};

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || '';
}

function savePassword() {
  localStorage.setItem(PASSWORD_KEY, refs.adminPassword.value.trim());
}

function authHeaders() {
  const password = getPassword();
  if (!password) return {};
  return { 'x-admin-password': password };
}

async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...authHeaders()
  };
  const response = await fetch(url, { ...options, headers });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Request failed');
  return json;
}

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

function renderTable() {
  refs.tableBody.innerHTML = state.submissions.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${row.first_name} ${row.last_name}</td>
      <td>${row.email}</td>
      <td>${row.phone_number}</td>
      <td>${row.training_interest}</td>
      <td>${row.learning_device}</td>
      <td>${new Date(row.submitted_at).toLocaleString()}</td>
      <td><div class="actions">
        <button data-action="edit" data-id="${row.id}">Edit</button>
        <button data-action="delete" data-id="${row.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');
  refs.emptyState.classList.toggle('hidden', state.submissions.length > 0);
  refs.pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
  refs.prevPageBtn.disabled = state.page <= 1;
  refs.nextPageBtn.disabled = state.page >= state.totalPages;
}

async function fetchSubmissions() {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit)
  });
  if (state.search) params.set('search', state.search);
  const json = await apiFetch(`/api/submissions?${params.toString()}`);
  state.submissions = json.submissions || [];
  state.totalPages = json.pagination?.totalPages || 1;
  renderTable();
}

async function removeSubmission(id) {
  if (!confirm('Delete this submission?')) return;
  await apiFetch(`/api/submissions/${id}`, { method: 'DELETE' });
  await fetchSubmissions();
}

refs.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const id = refs.id.value.trim();
    const payload = getFormPayload();
    const isEdit = Boolean(id);
    await apiFetch(isEdit ? `/api/submissions/${id}` : '/api/submissions', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    resetForm();
    await fetchSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

refs.tableBody.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute('data-action');
  const id = Number.parseInt(target.getAttribute('data-id') || '', 10);
  if (!Number.isInteger(id)) return;
  const row = state.submissions.find((item) => item.id === id);
  if (!row) return;
  if (action === 'edit') startEdit(row);
  if (action === 'delete') {
    try {
      await removeSubmission(id);
    } catch (error) {
      alert(error.message);
    }
  }
});

refs.savePasswordBtn.addEventListener('click', () => {
  savePassword();
  alert('Password saved.');
});

refs.searchBtn.addEventListener('click', async () => {
  state.search = refs.searchInput.value.trim();
  state.page = 1;
  try {
    await fetchSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

refs.prevPageBtn.addEventListener('click', async () => {
  if (state.page <= 1) return;
  state.page -= 1;
  try {
    await fetchSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

refs.nextPageBtn.addEventListener('click', async () => {
  if (state.page >= state.totalPages) return;
  state.page += 1;
  try {
    await fetchSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

refs.cancelEdit.addEventListener('click', resetForm);
refs.refreshBtn.addEventListener('click', async () => {
  try {
    await fetchSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

refs.adminPassword.value = getPassword();
fetchSubmissions().catch((error) => {
  alert(error.message);
});
