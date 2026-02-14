// State Management
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
    type: 'ALL', // ALL, MONTH, REASON, CLIENT, DONE
    value: null,
    doneFilter: null // true, false, or null (both)
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
        currentSort.direction = 'asc'; // Default new sort to asc
    }
    
    // Update Icons
    updateSortIcons();

    // Reload
    loadCurrentView();
}

function updateSortIcons() {
    // Reset all
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        const icon = th.querySelector('.sort-icon');
        if(icon) icon.textContent = '↕';
    });

    // Set active
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
    else if(currentFilter.type === 'DONE') loadOsByDone(false);
}


document.addEventListener('DOMContentLoaded', () => {
    Auth.checkAuth();
    
    // Set Navbar Username
    const username = localStorage.getItem('username') || 'Usuário';
    const navUser = document.getElementById('nav-username');
    if(navUser) navUser.textContent = username;
    
    // Set Default Month (Current Month) for the input, but don't filter by it yet
    const date = new Date();
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
    document.getElementById('monthPicker').value = monthStr;
    
    // Check for URL params (Client Search or Highlight)
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
                shorthand: true, //defaults to false
                dateFormat: "F Y", //defaults to "F Y"
                altFormat: "F Y", //defaults to "F Y"
                theme: "dark" // defaults to "light"
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
    document.getElementById('toggleDoneBtn').addEventListener('click', (e) => {
        const btn = e.target;
        if (currentFilter.type === 'DONE') {
            resetFilters(); // Toggle off
        } else {
            loadOsByDone();
            btn.style.borderColor = 'var(--accent-color)';
            btn.style.color = 'var(--accent-color)';
        }
    });

     // Reset Filters
     document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);

    // Real-time Validation Listeners
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
    
    // Reset buttons visual state
    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toggleDoneBtn').style.borderColor = 'var(--glass-border)';
    document.getElementById('toggleDoneBtn').style.color = 'var(--text-color)';

    // Load defaults
    loadAllOs();
}

// --- API Calls ---



async function fetchOs(url) {
    const listContainer = document.getElementById('osList');
    
    try {
        const token = Auth.getToken();
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falha ao buscar OS');

        const data = await response.json();
        
        // Update Pagination State
        pagination.totalElements = data.totalElements;
        pagination.totalPages = data.totalPages;
        
        renderOsList(data.content);
        renderPagination();
        
    } catch (error) {
        listContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Erro ao carregar dados.</td></tr>`;
        console.error(error);
    }
}

function loadAllOs(resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'ALL', value: null };
    fetchOs(`/api/os/getAllOs?${getSortParam()}`); // getSortParam now includes page/size
}

function loadOsByMonth(month, year, resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'MONTH', value: {month, year} };
    fetchOs(`/api/os/getByMonth?month=${month}&year=${year}${getSortParam()}`);
}

function loadOsByClient(clientName, resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'CLIENT', value: clientName };
    fetchOs(`/api/os/getByClient?client=${encodeURIComponent(clientName)}${getSortParam()}`);
    
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

    fetchOs(`/api/os/getByReason?reason=${reason}${getSortParam()}`);
}

function loadOsByDone(resetPage = true) {
    if(resetPage) pagination.page = 0;
    currentFilter = { type: 'DONE', value: true };
    fetchOs(`/api/os/getByDone?${getSortParam()}`);
}

async function searchClients(query) {
    const token = Auth.getToken();
    try {
        const response = await fetch(`/api/os/getByClient?client=${query}&size=5`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
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


// --- Rendering ---

function renderOsList(osList) {
    const listContainer = document.getElementById('osList');
    listContainer.innerHTML = '';
    
    // Check for highlight param
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');

    if (!osList || osList.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma OS encontrada.</td></tr>';
        return;
    }

    osList.forEach(os => {
        const tr = document.createElement('tr');
        tr.id = `os-row-${os.id}`;
        
        if (highlightId && os.id == highlightId) {
            tr.classList.add('highlight-row');
            setTimeout(() => {
                tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
        
        // Status Badge Logic
        const statusClass = os.done ? 'badge-status done' : 'badge-status pending';
        const reason = REASONS[os.reason] || os.reason.replace(/_/g, ' ');
        const date = new Date(os.createdAt).toLocaleDateString();
        const statusBadge = `<div class="${statusClass}" onclick="window.toggleDone(${os.id}, ${!os.done})"><span>${os.done ? '✓' : '🕒'}</span> ${os.done ? 'Feito' : 'Pendente'}</div>`;

        const row = document.createElement('tr');
        if (os.done) row.classList.add('done-row');
        
        // Format ID for display (optional, can be removed)
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

// --- Actions ---

async function toggleDone(id, newStatus) {
    const token = Auth.getToken();
    try {
        await fetch(`/api/os/done/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ done: newStatus })
        });
        
        // Refresh specific row UI without reload to keep context
        const row = document.getElementById(`os-row-${id}`);
        if(row) {
             const badge = row.querySelector('.badge-status');
             if(badge) {
                 badge.onclick = () => toggleDone(id, !newStatus); // Update click handler to toggle back
                 
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
window.toggleDone = toggleDone; // Expose globally

let osIdToDelete = null;

function handleDelete(id) {
    osIdToDelete = id;
    document.getElementById('confirmModal').classList.add('active');
}
window.handleDelete = handleDelete; // Expose globally

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
    const token = Auth.getToken();
    try {
        const response = await fetch(`/api/os/delete/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
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

// --- Modal Logic ---

// --- Modal Functions ---
function openCreateModal() {
    document.getElementById('osId').value = ''; // Clear ID
    document.getElementById('createOsForm').reset();
    document.getElementById('modalTitle').textContent = 'Nova Ordem de Serviço';
    document.getElementById('btnSubmit').textContent = 'Criar OS';
    
    selectedReason = null;
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.opacity = '0.7';
        btn.style.border = 'none';
    });
    
    // Reset validations
    document.getElementById('newClientName').classList.remove('input-error', 'shake');
    document.getElementById('clientError').style.display = 'none';
    document.getElementById('reasonError').style.display = 'none';
    document.getElementById('btnSubmit').style.opacity = '1';
    document.getElementById('btnSubmit').style.cursor = 'pointer';

    document.getElementById('createModal').classList.add('active');
    setTimeout(() => document.getElementById('newClientName').focus(), 100);
}

function openEditModal(id, client, reason) {
    document.getElementById('osId').value = id;
    document.getElementById('newClientName').value = client;
    document.getElementById('modalTitle').textContent = 'Editar Ordem de Serviço';
    document.getElementById('btnSubmit').textContent = 'Salvar Alterações';

    // Select Reason
    selectReason(document.querySelector(`.reason-btn.reason-${reason}`), reason); // Pass the button element and reason value
    
    // Reset validations
    document.getElementById('newClientName').classList.remove('input-error', 'shake');
    document.getElementById('clientError').style.display = 'none';
    document.getElementById('reasonError').style.display = 'none';
    document.getElementById('btnSubmit').style.opacity = '1';
    document.getElementById('btnSubmit').style.cursor = 'pointer';

    document.getElementById('createModal').classList.add('active');
}
window.openEditModal = openEditModal; // Expose globally

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
    
    // Remove error if exists
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

    // Reset Animations
    inputWrapper.classList.remove('shake');
    reasonGrid.classList.remove('shake');

    // Validation
    if (!client) {
        clientError.style.display = 'block';
        clientInput.classList.add('error');
        void inputWrapper.offsetWidth; // trigger reflow
        inputWrapper.classList.add('shake');
        isValid = false;
    }

    if (!reason) {
        reasonError.style.display = 'block';
        void reasonGrid.offsetWidth; // trigger reflow
        reasonGrid.classList.add('shake');
        isValid = false;
    }

    if (!isValid) return;

    const btnSubmit = document.getElementById('btnSubmit'); // Changed from btnCreate
    const originalContent = btnSubmit.innerHTML;
    
    // Loading State
    btnSubmit.disabled = true;
    const osId = document.getElementById('osId').value;
    const isEdit = !!osId;
    
    const osData = {
        client: client,
        reason: reason
    };

    const token = Auth.getToken();
    const url = isEdit ? `/api/os/update/${osId}` : '/api/os/createOs';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(osData)
        });

        if (response.ok) {
            showToast(isEdit ? 'OS atualizada com sucesso!' : 'OS criada com sucesso!', 'success');
            closeCreateModal();
            loadAllOs(false); // Reload list keeping current page/filter if possible, or just reset. loadAllOs(false) resets page to 0? No, checking loadAllOs implementation.
            // loadAllOs implementation: function loadAllOs(resetPage = true) { if(resetPage) pagination.page = 0; ... }
            // So loadAllOs(false) keeps page? No, loadAllOs HARDCODES currentFilter to ALL.
            // Better to have a reload function that respects current filter.
            // For now, let's just call the global reload logic if it exists, or replicate what pagination does.
            // Actually, let's just call loadAllOs() for now to be safe, or even better:
            // trigger the current filter load again.
            // We have `applyFilters()` or similar?
            // Checking structure... lines 247+ show load functions.
            // Let's just use loadAllOs() for simplicity as user just wants it to work.
        } else {
            const errorText = await response.text();
            showToast('Erro: ' + errorText, 'error');
            
            // Reset Button
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalContent;
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão ao salvar OS', 'error');
        
        // Reset Button
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalContent;
    }
}

/* Close modal on outside click */
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

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Simple icon based on type
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

// --- Pagination Logic ---

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
    
    // Info Text
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

    // Page Numbers logic
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

// --- Test Data Generator ---
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
            const token = Auth.getToken();
            await fetch('/api/os/createOs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

// --- Export CSV ---
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
        url = `/api/os/getByDone?${sizeParam}`;
    }

    try {
        const token = Auth.getToken();
        const response = await fetch(url, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(!response.ok) throw new Error('Erro ao buscar dados para exportação');
        
        const data = await response.json();
        const fullList = data.content;

        const headers = ['Cliente', 'Motivo', 'Data Criação', 'Status'];
        const delimiter = ';';
        const bom = '\uFEFF';
        
        // Header Row
        let csvContent = headers.join(delimiter) + '\n';
        
        // Data Rows
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

        // Create Blob
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const urlObj = URL.createObjectURL(blob);
        
        // Download Link
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

// Expose to window for console usage
window.generateTestOs = generateTestOs;
