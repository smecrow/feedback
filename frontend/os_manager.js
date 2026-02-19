
const REASON_COLORS = {
    'SEM_CONEXAO': '#ef4444',
    'LENTIDAO': '#6b7280',
    'UPGRADE': '#f97316',
    'TROCA_DE_LUGAR': '#a855f7',
    'SEGUNDO_PONTO': '#22c55e',
    'N2': '#3b82f6',
    'OUTROS': '#eab308'
};

const REASONS = {
    'SEM_CONEXAO': 'Sem Conexão',
    'LENTIDAO': 'Lentidão',
    'UPGRADE': 'Upgrade',
    'TROCA_DE_LUGAR': 'Troca de Lugar',
    'SEGUNDO_PONTO': 'Segundo Ponto',
    'N2': 'Suporte N2',
    'OUTROS': 'Outros'
};

let currentFilter = {
    type: 'ALL',
    value: null,
    doneFilter: null
};

let currentSort = {
    field: 'id',
    direction: 'desc'
};

let pagination = {
    page: 0,
    size: 10,
    totalPages: 0
};

function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    

    updateSortIcons();


    loadCurrentView();
}

function updateSortIcons() {

    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        const icon = th.querySelector('.sort-icon');
        if(icon) icon.textContent = '↕';
    });


    const activeTh = document.querySelector(`th[onclick="handleSort('${currentSort.field}')"]`);
    if (activeTh) {
        activeTh.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        const icon = activeTh.querySelector('.sort-icon');
        if(icon) icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
    }
}

function getSortParam() {
    return `&sort=${currentSort.field},${currentSort.direction}&page=${pagination.page}&size=${pagination.size}`;
}

function loadCurrentView() {
    if(currentFilter.type === 'ALL') loadAllOs(false);
    else if(currentFilter.type === 'MONTH') {
         const flatpickrInstance = document.querySelector("#monthPicker")._flatpickr;
         const date = flatpickrInstance.selectedDates[0];
         if(date) loadOsByMonth(date.getMonth() + 1, date.getFullYear(), false);
    }
    else if(currentFilter.type === 'REASON') filterByReason(currentFilter.value, false);
    else if(currentFilter.type === 'CLIENT') loadOsByClient(currentFilter.value, false);
    else if(currentFilter.type === 'DONE') loadOsByDone(false, currentFilter.value);
}


document.addEventListener('DOMContentLoaded', () => {
    Auth.checkAuth();
    

    const username = localStorage.getItem('username') || 'Usuário';
    const navUser = document.getElementById('nav-username');
    if(navUser) navUser.textContent = username;
    
    // Set Default Month (Current Month) for the input, but don't filter by it yet
    const date = new Date();
    const monthStr = date.toISOString().slice(0, 7);
    document.getElementById('monthPicker').value = monthStr;
    

    const urlParams = new URLSearchParams(window.location.search);
    const clientParam = urlParams.get('client');

    if (clientParam) {
        document.getElementById('clientSearch').value = clientParam;
        loadOsByClient(clientParam);
        // Clean URL after loading to avoid sticking in search mode on refresh if desired, 
        // or keep it to allow sharing. Keeping it is usually better for "Search" semantics.
    } else {
        loadAllOs();
    }

    setupEventListeners();
});

function setupEventListeners() {
    // Search Client (Instant Search Logic)
    const searchInput = document.getElementById('clientSearch');
    let timeout = null;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (timeout) clearTimeout(timeout);
        
        // Se limpar o campo, recarrega tudo
        if (query.length === 0) {
            resetFilters();
            return;
        }

        // Debounce para evitar muitas requisições
        timeout = setTimeout(() => {
            // Limpar seleção visual de motivos, pois estamos buscando por cliente agora
            document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
            // Remove selection logic of 'DONE' if needed, or keep it combined? 
            // User asked: "tire a seleção da minha reason". So we clear reason filter.
            
            // Set current filter to CLIENT but keep value for context if needed, though search is direct
            loadOsByClient(query); 
        }, 300);
    });

    // Flatpickr Initialization
    flatpickr("#monthPicker", {
        plugins: [
            new monthSelectPlugin({
                shorthand: true,
                dateFormat: "F Y", //defaults to "F Y"
                altFormat: "F Y", //defaults to "F Y"
                theme: "dark"
            })
        ],
        defaultDate: new Date(),
        locale: {
            firstDayOfWeek: 0,
            weekdays: {
                shorthand: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
                longhand: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
            },
            months: {
                shorthand: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
                longhand: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
            }
        },
        onChange: function(selectedDates, dateStr, instance) {
            const date = selectedDates[0];
            if (date) {
                // Adjust for timezone offset if necessary, but month selection usually gives 1st of month
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                loadOsByMonth(month, year);
            }
        }
    });

    // Month Picker Change Event (Removed native listener)

    // Toggle Done
    // Toggle Done
    document.getElementById('toggleDoneBtn').addEventListener('click', (e) => {
        const btn = e.target;
        if (currentFilter.type === 'DONE') {
            resetFilters();
        } else {
            loadOsByDone(true, false);
            btn.style.borderColor = 'var(--accent-color)';
            btn.style.color = 'var(--accent-color)';
        }
    });


     document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);


    document.getElementById('newClientName').addEventListener('input', (e) => {
        const input = e.target;
        if(input.value.trim()) {
            input.classList.remove('error');
            document.getElementById('clientError').style.display = 'none';
        }
    });
}

function resetFilters() {
    document.getElementById('clientSearch').value = '';
    document.getElementById('searchResults').style.display = 'none';
    

    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toggleDoneBtn').style.borderColor = 'var(--glass-border)';
    document.getElementById('toggleDoneBtn').style.color = 'var(--text-color)';


    loadAllOs();
}





async function fetchOs(url) {
    const listContainer = document.getElementById('osList');
    


    try {
        const response = await Auth.fetch(url);

        if (!response.ok) throw new Error('Falha ao buscar OS');

        const data = await response.json();
        

        pagination.totalElements = data.totalElements;
        pagination.totalPages = data.totalPages;
        pagination.size = data.size;
        
        renderOsList(data.content);
        renderPagination();
        
    } catch (error) {
        if(error.message !== 'Sessão expirada') {
            listContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Erro ao carregar dados.</td></tr>`;
            console.error(error);
        }
    } finally {
        showLoading(false);
    }
}

function loadAllOs(resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'ALL', value: null };
    fetchOs(`${API_URL}/api/os/getAllOs?${getSortParam()}`);
}

function loadOsByMonth(month, year, resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'MONTH', value: {month, year} };
    fetchOs(`${API_URL}/api/os/getByMonth?month=${month}&year=${year}${getSortParam()}`);
}

function loadOsByClient(clientName, resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'CLIENT', value: clientName };
    fetchOs(`${API_URL}/api/os/getByClient?client=${encodeURIComponent(clientName)}${getSortParam()}`);
    
    const resultsDiv = document.getElementById('searchResults');
    if(resultsDiv) resultsDiv.style.display = 'none';
}

function filterByReason(reason, resetPage = true) {
    if (currentFilter.type === 'REASON' && currentFilter.value === reason && resetPage) {
        resetFilters();
        return;
    }

    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'REASON', value: reason };
    
    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.reason-btn.reason-${reason}`).classList.add('active');

    fetchOs(`${API_URL}/api/os/getByReason?reason=${reason}${getSortParam()}`);
}

function loadOsByDone(resetPage = true, done = true) {
    if(resetPage) pagination.page = 0;
    // Ensure boolean
    const isDone = done === 'true' || done === true;
    currentFilter = { type: 'DONE', value: isDone };
    fetchOs(`${API_URL}/api/os/getByDone?done=${isDone}${getSortParam()}`);
}

async function searchClients(query) {
    try {
        const response = await Auth.fetch(`${API_URL}/api/os/getByClient?client=${query}&size=5`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '';
        
        if (data.content && data.content.length > 0) {
            data.content.forEach(os => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = `${os.client} - ${REASONS[os.reason] || os.reason}`;
                div.onclick = () => loadOsByClient(os.client); 
                resultsDiv.appendChild(div);
            });
            resultsDiv.style.display = 'block';
        } else {
             resultsDiv.style.display = 'none';
        }
    } catch(e) {
        console.error(e);
    }
}




function renderOsList(osList) {
    const listContainer = document.getElementById('osList');
    listContainer.innerHTML = '';
    

    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');

    if (!osList || osList.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma OS encontrada.</td></tr>';
        return;
    }

    osList.forEach(os => {

        const statusClass = os.done ? 'badge-status done' : 'badge-status pending';
        const reason = REASONS[os.reason] || os.reason.replace(/_/g, ' ');
        const date = new Date(os.createdAt).toLocaleDateString();
        const statusBadge = `<div class="${statusClass}" onclick="window.toggleDone(${os.id}, ${!os.done})"><span>${os.done ? '✓' : '🕒'}</span> ${os.done ? 'Feito' : 'Pendente'}</div>`;

        const row = document.createElement('tr');
        row.id = `os-row-${os.id}`;
        if (os.done) row.classList.add('done-row');
        

        if (highlightId && os.id == highlightId) {
            row.classList.add('highlight-row');
            setTimeout(() => {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
        

        const displayId = os.id; // or existing logic

        row.innerHTML = `
            <td>
               <div style="display:flex; align-items:center; gap: 8px;">
                   <span style="font-weight: 600; color: var(--text-color);">${os.client}</span>
               </div>
            </td>
            <td>
                <span class="badge" style="background: ${REASON_COLORS[os.reason] || '#ccc'}; color: #fff;">${reason}</span>
            </td>
            <td>${date}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button onclick="openEditModal(${os.id}, '${os.client.replace(/'/g, "\\'")}', '${os.reason}')" class="btn-icon" title="Editar">
                        ✏️
                    </button>
                    <button onclick="window.handleDelete(${os.id})" class="btn-icon delete" title="Excluir">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        listContainer.appendChild(row);
    });
    
    if (highlightId) {
        const url = new URL(window.location);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url);
    }
}



async function toggleDone(id, newStatus) {
    try {
        await Auth.fetch(`${API_URL}/api/os/done/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ done: newStatus })
        });
        

        const row = document.getElementById(`os-row-${id}`);
        if(row) {
             const badge = row.querySelector('.badge-status');
             if(badge) {
                 badge.onclick = () => toggleDone(id, !newStatus);
                 
                 if(newStatus) {
                     badge.className = 'badge-status done';
                     badge.innerHTML = '<span>✓</span> Feito';
                 } else {
                     badge.className = 'badge-status pending';
                     badge.innerHTML = '<span>🕒</span> Pendente';
                 }
             }
        }
        
        // Also refresh if we are in a 'DONE' only filter, but let's just toast for now to avoid jumpiness
        // showToast('Status atualizado!', 'success'); // Optional, maybe too noisy?

    } catch (error) {
        showToast('Erro ao atualizar status', 'error');
    }
}


let osIdToDelete = null;

function handleDelete(id) {
    osIdToDelete = id;
    document.getElementById('confirmModal').classList.add('active');
}


function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    osIdToDelete = null;
}

function confirmDeleteAction() {
    if (osIdToDelete) {
        deleteOs(osIdToDelete);
        closeConfirmModal();
    }
}

async function deleteOs(id) {
    try {
        const response = await Auth.fetch(`${API_URL}/api/os/delete/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload current view
            if(currentFilter.type === 'ALL') loadAllOs();
            else if(currentFilter.type === 'MONTH') {
                 const [year, month] = document.getElementById('monthPicker').value.split('-');
                 loadOsByMonth(parseInt(month), parseInt(year));
            }
            else if(currentFilter.type === 'REASON') filterByReason(currentFilter.value);
            else if(currentFilter.type === 'CLIENT') loadOsByClient(currentFilter.value);
            else if(currentFilter.type === 'DONE') loadOsByDone();
        } else {
            const data = await response.json();
            showToast('Erro ao deletar: ' + (data.message || 'Permissão negada'), 'error');
        }
    } catch (e) {
        showToast('Erro ao deletar OS', 'error');
    }
}




function openCreateModal() {
    document.getElementById('osId').value = '';
    document.getElementById('createOsForm').reset();
    document.getElementById('modalTitle').textContent = 'Nova Ordem de Serviço';
    document.getElementById('btnSubmit').textContent = 'Criar OS';
    
    selectedReason = null;
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.opacity = '0.7';
        btn.style.border = 'none';
    });
    

    document.getElementById('newClientName').classList.remove('input-error', 'shake');
    document.getElementById('clientError').style.display = 'none';
    document.getElementById('reasonError').style.display = 'none';
    document.getElementById('btnSubmit').style.opacity = '1';
    document.getElementById('btnSubmit').style.cursor = 'pointer';
    document.getElementById('btnSubmit').disabled = false;

    document.getElementById('createModal').classList.add('active');
    setTimeout(() => document.getElementById('newClientName').focus(), 100);
}

function openEditModal(id, client, reason) {
    document.getElementById('osId').value = id;
    document.getElementById('newClientName').value = client;
    document.getElementById('modalTitle').textContent = 'Editar Ordem de Serviço';
    document.getElementById('btnSubmit').textContent = 'Salvar Alterações';


    selectReason(document.querySelector(`.reason-btn.reason-${reason}`), reason);
    

    document.getElementById('newClientName').classList.remove('input-error', 'shake');
    document.getElementById('clientError').style.display = 'none';
    document.getElementById('reasonError').style.display = 'none';
    document.getElementById('btnSubmit').style.opacity = '1';
    document.getElementById('btnSubmit').style.cursor = 'pointer';
    document.getElementById('btnSubmit').disabled = false;

    document.getElementById('createModal').classList.add('active');
}


function closeCreateModal() {
    const modal = document.getElementById('createModal');
    modal.classList.add('closing');
    
    // Wait for animation to finish (200ms matches CSS)
    setTimeout(() => {
        modal.classList.remove('active');
        modal.classList.remove('closing');
    }, 200);
}

function selectReason(btn, value) {
    document.querySelectorAll('#createModal .reason-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('selectedReason').value = value;
    

    document.getElementById('reasonError').style.display = 'none';
    document.querySelector('.reason-grid').classList.remove('shake');
}

async function handleCreateOs(e) {
    e.preventDefault();
    const clientInput = document.getElementById('newClientName');
    const client = clientInput.value.trim();
    const reason = document.getElementById('selectedReason').value;
    
    const clientError = document.getElementById('clientError');
    const reasonError = document.getElementById('reasonError');
    const reasonGrid = document.querySelector('.reason-grid');
    const inputWrapper = document.querySelector('.input-icon-wrapper');

    let isValid = true;


    inputWrapper.classList.remove('shake');
    reasonGrid.classList.remove('shake');


    if (!client) {
        clientError.style.display = 'block';
        clientInput.classList.add('error');
        void inputWrapper.offsetWidth;
        inputWrapper.classList.add('shake');
        isValid = false;
    }

    if (!reason) {
        reasonError.style.display = 'block';
        void reasonGrid.offsetWidth;
        reasonGrid.classList.add('shake');
        isValid = false;
    }

    if (!isValid) return;

    const btnSubmit = document.getElementById('btnSubmit');
    const originalContent = btnSubmit.innerHTML;
    

    btnSubmit.disabled = true;
    const osId = document.getElementById('osId').value;
    const isEdit = !!osId;
    
    const osData = {
        client: client,
        reason: reason
    };

    const url = isEdit ? `${API_URL}/api/os/update/${osId}` : `${API_URL}/api/os/createOs`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await Auth.fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(osData)
        });

        if (response.ok) {
            showToast(isEdit ? 'OS atualizada com sucesso!' : 'OS criada com sucesso!', 'success');
            closeCreateModal();
            loadCurrentView();
        } else {
            const errorText = await response.text();
            showToast('Erro: ' + errorText, 'error');
            

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalContent;
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão ao salvar OS', 'error');
        

        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalContent;
    }
}


document.getElementById('createModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('createModal')) {
        closeCreateModal();
    }
});
document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('confirmModal')) {
        closeConfirmModal();
    }
});
document.getElementById('importModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('importModal')) {
        closeImportModal();
    }
});



let importedData = [];

function openImportModal() {
    document.getElementById('importModal').classList.add('active');

    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').textContent = 'Nenhum arquivo selecionado';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importProgress').style.display = 'none';
    document.getElementById('btnConfirmImport').disabled = true;
    document.getElementById('btnConfirmImport').textContent = 'Importar Dados';
    document.getElementById('dropZone').classList.remove('drag-over');
    importedData = [];
    
    setupDragAndDrop();
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileSelect(files[0]);
}

window.handleFileSelect = function(file) {
    if (!file || !file.name.endsWith('.csv')) {
        showToast('Por favor, selecione um arquivo CSV válido.', 'error');
        return;
    }

    document.getElementById('fileInfo').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file, 'UTF-8'); // Force UTF-8
};

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) {
        showToast('Arquivo vazio ou sem cabeçalho.', 'error');
        return;
    }

    // Detect delimiter (semicolon or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Validate Headers (Cliente, Motivo are mandatory)
    // We expect: Cliente, Motivo, Data (optional), Status (optional)
    const clientIdx = headers.indexOf('cliente');
    const reasonIdx = headers.indexOf('motivo');
    const dateIdx = headers.findIndex(h => h.includes('data')); // loose match
    const statusIdx = headers.indexOf('status');

    if (clientIdx === -1 || reasonIdx === -1) {
        showToast('CSV inválido. Colunas obrigatórias: Cliente, Motivo.', 'error');
        return;
    }

    importedData = [];
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = '';
    
    let validCount = 0;


    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(delimiter).map(c => c.trim().replace(/"/g, ''));
        
        if (cols.length < 2) continue;

        const client = cols[clientIdx];
        const reasonRaw = cols[reasonIdx];
        // Parse Date: Expecting DD/MM/YYYY or YYYY-MM-DD
        const dateRaw = dateIdx !== -1 ? cols[dateIdx] : null;
        const statusRaw = statusIdx !== -1 ? cols[statusIdx] : 'Pendente';

        // Normalize Reason
        let reason = 'OUTROS';
        const reasonUpper = reasonRaw.toUpperCase().replace(/\s/g, '_');
        if (REASONS[reasonUpper]) reason = reasonUpper;
        else {
             // Try to find approximate match or default
             const match = Object.keys(REASONS).find(k => k.includes(reasonUpper) || reasonUpper.includes(k));
             if(match) reason = match;
        }

        // Normalize Status
        const done = statusRaw.toLowerCase().includes('feito') || statusRaw.toLowerCase().includes('conclu') || statusRaw === 'true' || statusRaw === '1';


        let createdAt = null;
        if (dateRaw) {
             if (dateRaw.includes('/')) {
                 const [d, m, y] = dateRaw.split('/');
                 if(d && m && y) createdAt = `${y}-${m}-${d}T12:00:00`; // ISO format for LocalTime
             } else {
                 createdAt = dateRaw; // Assume ISO
             }
        }

        importedData.push({ client, reason, done, createdAt });
        validCount++;


        if (validCount <= 10) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client}</td>
                <td><span class="badge" style="background: ${REASON_COLORS[reason] || '#ccc'}; color: #fff; font-size: 0.75rem;">${REASONS[reason] || reason}</span></td>
                <td>${dateRaw || 'Hoje'}</td>
                <td>${done ? '✅' : '🕒'}</td>
            `;
            previewBody.appendChild(tr);
        }
    }

    if (importedData.length > 0) {
        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('previewCount').textContent = importedData.length;
        document.getElementById('btnConfirmImport').disabled = false;
        
        if (importedData.length > 10) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-muted);">... e mais ${importedData.length - 10} registros</td>`;
            previewBody.appendChild(tr);
        }
    } else {
        showToast('Nenhum dado válido encontrado no arquivo.', 'error');
    }
}

window.executeImport = async function() {
    if (importedData.length === 0) return;

    const btn = document.getElementById('btnConfirmImport');
    const btnCancel = document.getElementById('btnCancelImport');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressArea = document.getElementById('importProgress');

    btn.disabled = true;
    btnCancel.disabled = true;
    progressArea.style.display = 'block';
    
    let successCount = 0;
    let errorCount = 0;
    const total = importedData.length;
    const token = Auth.getToken();

    for (let i = 0; i < total; i++) {
        const item = importedData[i];
        

        const percent = Math.round(((i + 1) / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Importando ${i + 1} de ${total}...`;

        try {
            const response = await Auth.fetch('/api/os/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });

            if (response.ok) successCount++;
            else errorCount++;
        } catch (e) {
            console.error(e);
            errorCount++;
        }
        
        // Small delay to let UI breathe and show animation
        if(total < 100) await new Promise(r => setTimeout(r, 50)); 
    }


    progressBar.style.width = '100%';
    progressText.textContent = 'Concluído!';
    
    showToast(`Importação finalizada! Sucesso: ${successCount}, Erros: ${errorCount}`, successCount > 0 ? 'success' : 'error');
    
    setTimeout(() => {
        closeImportModal();
        loadAllOs(false); // Reload List
    }, 1500);
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✔' : '⚠';
    toast.innerHTML = `
        <span style="font-size: 1.2rem; margin-right: 0.5rem;">${icon}</span>
        <div style="flex: 1;">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}



function changePage(newPage) {
    if (newPage >= 0 && newPage < pagination.totalPages) {
        pagination.page = newPage;
        loadCurrentView();
    }
}

function changePageSize(newSize) {
    pagination.size = parseInt(newSize);
    pagination.page = 0;
    loadCurrentView();
}

function renderPagination() {
    const controls = document.getElementById('paginationControls');
    const info = document.getElementById('paginationInfo');
    
    if (!controls || !info) return;
    
    controls.innerHTML = '';
    

    const start = pagination.page * pagination.size + 1;
    const end = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);
    const total = pagination.totalElements;
    info.textContent = `Mostrando ${total === 0 ? 0 : start}-${end} de ${total} registros`;

    if (pagination.totalPages <= 1 && total > 0) {
        // Even if 1 page, show page 1 button if there is data? 
        // Or just return if 1 page. Let's return but ensure info is shown.
        return;
    }
    if (total === 0) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '‹';
    prevBtn.disabled = pagination.page === 0;
    prevBtn.onclick = () => changePage(pagination.page - 1);
    controls.appendChild(prevBtn);


    let startPage = Math.max(0, pagination.page - 2);
    let endPage = Math.min(pagination.totalPages - 1, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(0, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === pagination.page ? 'active' : ''}`;
        btn.textContent = i + 1;
        btn.onclick = () => changePage(i);
        controls.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '›';
    nextBtn.disabled = pagination.page === pagination.totalPages - 1;
    nextBtn.onclick = () => changePage(pagination.page + 1);
    controls.appendChild(nextBtn);
}


async function generateTestOs(count = 20) {
    const names = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas", "Cardoso", "Ramos", "Gonçalves", "Santana", "Teixeira"];
    const firstNames = ["João", "Maria", "José", "Ana", "Pedro", "Lucas", "Mariana", "Gabriel", "Juliana", "Carlos", "Fernanda", "Paulo", "Aline", "Marcos", "Beatriz", "Luiz", "Camila", "Rafael", "Bruna", "Gustavo", "Larissa", "Mateus", "Leticia", "Felipe", "Amanda", "Thiago", "Patricia", "Bruno", "Debora", "Leonardo"];
    const reasonKeys = Object.keys(REASONS);

    console.log(`🚀 Iniciando geração de ${count} Ordens de Serviço...`);
    
    let successes = 0;

    for (let i = 0; i < count; i++) {
        const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
        const randomReason = reasonKeys[Math.floor(Math.random() * reasonKeys.length)];
        // Random done status mostly pending (80%)
        const isDone = Math.random() > 0.8; 

        try {
            await Auth.fetch('/api/os/createOs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    client: randomName, 
                    reason: randomReason,
                    done: isDone 
                })
            });
            successes++;
            if (i % 5 === 0) console.log(`✓ Criadas: ${i+1}/${count}`);
        } catch (e) {
            console.error("Erro ao criar OS:", e);
        }
    }
    
    console.log(`✅ Concluído! ${successes} OS criadas.`);
    showToast(`${successes} OS de teste criadas! Atualize a lista.`, 'success');
    loadAllOs();
}


function showLoading(isLoading) {
    const tableBody = document.getElementById('osList');
    if (!tableBody) return;

    if (isLoading) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 4rem;">
                    <div class="spinner" style="margin: 0 auto; border-color: rgba(255,255,255,0.1); border-left-color: var(--accent-color);"></div>
                    <p style="margin-top: 1rem; color: var(--text-muted);">Carregando dados...</p>
                </td>
            </tr>
        `;
    }
}
window.showLoading = showLoading;


async function exportCsv() {
    const total = pagination.totalElements;
    if (total === 0) {
        showToast('Não há dados para exportar.', 'error');
        return;
    }
    
    showToast('Gerando CSV...', 'info');

    // Construct URL for ALL data
    let url = '';
    const sizeParam = `&page=0&size=${total}&sort=${currentSort.field},${currentSort.direction}`;
    
    if(currentFilter.type === 'ALL') {
        url = `/api/os/getAllOs?${sizeParam}`;
    } else if(currentFilter.type === 'MONTH') {
         const {month, year} = currentFilter.value;
         url = `/api/os/getByMonth?month=${month}&year=${year}${sizeParam}`;
    } else if(currentFilter.type === 'REASON') {
        url = `/api/os/getByReason?reason=${currentFilter.value}${sizeParam}`;
    } else if(currentFilter.type === 'CLIENT') {
        url = `/api/os/getByClient?client=${encodeURIComponent(currentFilter.value)}${sizeParam}`;
    } else if(currentFilter.type === 'DONE') {
        url = `/api/os/getByDone?done=${currentFilter.value}${sizeParam}`;
    }

    try {
        const response = await Auth.fetch(url);
        
        if(!response.ok) throw new Error('Erro ao buscar dados para exportação');
        
        const data = await response.json();
        const fullList = data.content;

        const headers = ['Cliente', 'Motivo', 'Data Criação', 'Status'];
        const delimiter = ';';
        const bom = '\uFEFF';
        

        let csvContent = headers.join(delimiter) + '\n';
        

        fullList.forEach(os => {
            const date = new Date(os.createdAt).toLocaleDateString('pt-BR');
            const status = os.done ? 'Concluído' : 'Pendente';
            const reason = REASONS[os.reason] || os.reason;
            
            const row = [
                `"${os.client}"`, 
                `"${reason}"`,
                date,
                status
            ];
            csvContent += row.join(delimiter) + '\n';
        });


        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const urlObj = URL.createObjectURL(blob);
        

        const link = document.createElement('a');
        link.href = urlObj;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        link.setAttribute('download', `ordens-servico-${dateStr}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Arquivo CSV exportado com sucesso!', 'success');

    } catch (e) {
        console.error(e);
        showToast('Erro ao exportar CSV', 'error');
    }
}
window.exportCsv = exportCsv;


window.generateTestOs = generateTestOs;


window.deleteAllOs = async function() {
    if (!confirm('ATENÇÃO: Isso apagará todas as suas Ordens de Serviço permanentemente. Tem certeza?')) return;
    
    const token = Auth.getToken();
    try {
        const response = await fetch('/api/os/deleteAll', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Todas as OS foram excluídas.', 'success');
            loadAllOs(true);
            console.log('Todas as OS foram excluídas com sucesso.');
        } else {
            console.error('Erro ao excluir todas as OS:', response.statusText);
            showToast('Erro ao excluir dados.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Erro de conexão.', 'error');
    }
};
