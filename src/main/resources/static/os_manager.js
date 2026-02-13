// State Management
let currentFilter = {
    type: 'ALL', // ALL, MONTH, REASON, CLIENT, DONE
    value: null,
    value: null,
    doneFilter: null // true, false, or null (both)
};

let currentSort = {
    field: 'id',
    direction: 'desc'
};

function handleSort(field) {
    if (currentSort.field === field) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'desc'; // Default to newest/desc for new field? Or asc? Usually asc for text, desc for dates. Let's stick to desc as default for consistency or asc. The user said "menor para maior" (asc) if clicking date.
        // Actually for date, usually you want newest first (desc). But "menor para maior" is ASC.
        // Let's toggle.
        if (field === 'createdAt') currentSort.direction = 'asc'; // User asked specific example? "se ele clicar em "Data Criaçãó" irá filtrar do menor para maior". That implies first click = ASC.
        else currentSort.direction = 'asc';
    }

    // Refresh current view with new sort
    if(currentFilter.type === 'ALL') loadAllOs();
    else if(currentFilter.type === 'MONTH') {
         const flatpickrInstance = document.querySelector("#monthPicker")._flatpickr;
         const date = flatpickrInstance.selectedDates[0];
         if(date) loadOsByMonth(date.getMonth() + 1, date.getFullYear());
    }
    else if(currentFilter.type === 'REASON') filterByReason(currentFilter.value);
    else if(currentFilter.type === 'CLIENT') loadOsByClient(currentFilter.value);
    else if(currentFilter.type === 'DONE') loadOsByDone();
}

function getSortParam() {
    return `&sort=${currentSort.field},${currentSort.direction}`;
}

// Reasons Display Map
const REASONS = {
    'SEM_CONEXAO': 'Sem Conexão',
    'LENTIDAO': 'Lentidão',
    'UPGRADE': 'Upgrade',
    'TROCA_DE_LUGAR': 'Troca de Lugar',
    'SEGUNDO_PONTO': 'Segundo Ponto',
    'N2': 'Nível 2',
    'OUTROS': 'Outros'
};

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

    // Form Submit
    document.getElementById('createOsForm').addEventListener('submit', handleCreateOs);
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
    listContainer.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando...</td></tr>';

    try {
        const token = Auth.getToken();
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Falha ao buscar OS');

        const data = await response.json();
        renderOsList(data.content);
    } catch (error) {
        listContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Erro: ${error.message}</td></tr>`;
    }
}

function loadAllOs() {
    currentFilter = { type: 'ALL', value: null };
    fetchOs(`/api/os/getAllOs?size=50${getSortParam()}`);
}

function loadOsByMonth(month, year) {
    currentFilter = { type: 'MONTH', value: {month, year} };
    fetchOs(`/api/os/getByMonth?month=${month}&year=${year}&size=50${getSortParam()}`);
}

function loadOsByClient(clientName) {
    currentFilter = { type: 'CLIENT', value: clientName };
    // Now backend supports partial search with the same endpoint param 'client'
    fetchOs(`/api/os/getByClient?client=${encodeURIComponent(clientName)}&size=50${getSortParam()}`);
    
    // Dropdown logic removed as we update the table directly
    const resultsDiv = document.getElementById('searchResults');
    if(resultsDiv) resultsDiv.style.display = 'none';
}

function filterByReason(reason) {
    // Toggle logic: If clicking the same active reason, reset to ALL
    if (currentFilter.type === 'REASON' && currentFilter.value === reason) {
        resetFilters();
        return;
    }

    currentFilter = { type: 'REASON', value: reason };
    
    // Update active badge UI
    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.reason-btn.reason-${reason}`).classList.add('active');

    fetchOs(`/api/os/getByReason?reason=${reason}&size=50${getSortParam()}`);
}

function loadOsByDone() {
    currentFilter = { type: 'DONE', value: true };
    fetchOs(`/api/os/getByDone?size=50${getSortParam()}`);
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
        tr.id = `os-row-${os.id}`; // Add ID for scrolling
        
        // Check highlight
        if (highlightId && os.id == highlightId) {
            tr.classList.add('highlight-row');
            setTimeout(() => {
                tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500); // Small delay to ensure render
        }
        
        // Status Text Color
        const statusClass = os.done ? 'text-muted' : '';
        const statusText = os.done ? 'Feito' : 'Pendente';

        tr.innerHTML = `
            <td style="font-weight: 500;">${os.client}</td>
            <td>
                <span class="reason-btn reason-${os.reason}" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; cursor: default;">
                    ${REASONS[os.reason] || os.reason}
                </span>
            </td>
            <td class="os-date">${new Date(os.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-status">
                    <input type="checkbox" class="custom-checkbox" 
                        ${os.done ? 'checked' : ''} 
                        onchange="toggleDone(${os.id}, this.checked)">
                    <span class="${statusClass}">${statusText}</span>
                </div>
            </td>
            </td>
            <td>
                <button onclick="handleDelete(${os.id})" class="btn-icon delete" title="Deletar OS">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        listContainer.appendChild(tr);
    });
    
    // Remove query param to clean URL after highlight
    if (highlightId) {
        const url = new URL(window.location);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url);
    }
}

// --- Actions ---

async function toggleDone(id, isDone) {
    const token = Auth.getToken();
    try {
        await fetch(`/api/os/done/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ done: isDone })
        });
        
        // Update text status dynamically
        const checkbox = document.querySelector(`input[onchange="toggleDone(${id}, this.checked)"]`);
        if (checkbox) {
            const span = checkbox.nextElementSibling;
            if (span) {
                span.textContent = isDone ? 'Feito' : 'Pendente';
                if (isDone) span.classList.add('text-muted');
                else span.classList.remove('text-muted');
            }
        }

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

function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
    document.getElementById('newClientName').value = '';
    document.getElementById('selectedReason').value = '';
    document.getElementById('reasonError').style.display = 'none';
    document.querySelectorAll('#createModal .reason-btn').forEach(b => b.classList.remove('active'));
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
}

function selectReason(btn, value) {
    document.querySelectorAll('#createModal .reason-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('selectedReason').value = value;
}

async function handleCreateOs(e) {
    e.preventDefault();
    const client = document.getElementById('newClientName').value;
    const reason = document.getElementById('selectedReason').value;
    const errorDiv = document.getElementById('reasonError');

    if (!reason) {
        errorDiv.style.display = 'block';
        return;
    }
    
    const token = Auth.getToken();
    try {
        const response = await fetch('/api/os/createOs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                client: client, 
                reason: reason,
                done: false 
            })
        });

        if (response.ok) {
            const newOs = await response.json();
            closeCreateModal();
            loadOsByClient(newOs.client);
            showToast('OS Criada com sucesso!');
        } else {
            throw new Error('Erro ao criar OS');
        }
    } catch (error) {
        showToast(error.message, 'error');
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
