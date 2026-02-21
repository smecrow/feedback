const Dashboard = {
    charts: {},

    activeFilters: {},

    init: function() {
        this.activeFilters = {
            period: document.getElementById('filterPeriod').value,
            status: document.getElementById('filterStatus').value,
            reason: document.getElementById('filterReason').value
        };
        this.updateFilters();

        const searchInput = document.getElementById('clientSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchClient();
                }
            });
        }
    },

    updateFilters: function() {
        const period = document.getElementById('filterPeriod').value;
        const status = document.getElementById('filterStatus').value;
        const reason = document.getElementById('filterReason').value;

        this.activeFilters = { period, status, reason };
        this.checkPendingFilters();

        const dateRange = this.calculateDateRange(period);
        
        let queryParams = new URLSearchParams();
        if (dateRange.start) queryParams.append('startDate', dateRange.start);
        if (dateRange.end) queryParams.append('endDate', dateRange.end);
        if (status) queryParams.append('status', status);
        if (reason) queryParams.append('reason', reason);

        this.fetchStats(queryParams.toString());
    },

    checkPendingFilters: function() {
        const currentPeriod = document.getElementById('filterPeriod').value;
        const currentStatus = document.getElementById('filterStatus').value;
        const currentReason = document.getElementById('filterReason').value;
        const btn = document.getElementById('btnFilter');

        const hasChanges = (
            currentPeriod !== this.activeFilters.period ||
            currentStatus !== this.activeFilters.status ||
            currentReason !== this.activeFilters.reason
        );

        if (hasChanges) {
            btn.classList.add('pulse-animation');
            btn.textContent = 'Aplicar Filtros';
        } else {
            btn.classList.remove('pulse-animation');
            btn.textContent = 'Filtrar';
        }
    },

    resetFilters: function() {
        document.getElementById('filterPeriod').value = 'ALL';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterReason').value = '';
        this.updateFilters();
    },

    calculateDateRange: function(period) {
        const end = new Date();
        let start = null;

        if (period === '7_DAYS') {
            start = new Date();
            start.setDate(end.getDate() - 7);
        } else if (period === '30_DAYS') {
            start = new Date();
            start.setDate(end.getDate() - 30);
        } else if (period === '3_MONTHS') {
            start = new Date();
            start.setMonth(end.getMonth() - 3);
        } else if (period === 'THIS_YEAR') {
            start = new Date(new Date().getFullYear(), 0, 1);
        }

        return {
            start: start ? start.toISOString() : null,
            end: start ? end.toISOString() : null
        };
    },

    fetchStats: async function(queryString = '') {
        this.setLoading(true);
        try {
            const url = queryString ? `${API_URL}/api/dashboard/stats?${queryString}` : `${API_URL}/api/dashboard/stats`;
            const response = await Auth.fetch(url);
            const data = await response.json();
            this.data = data; 
            
            document.querySelectorAll('.kpi-card, .chart-card').forEach(el => {
                el.classList.remove('fade-in');
                void el.offsetWidth;
                el.classList.add('fade-in');
            });

            this.renderKPIs(data);
            this.renderCharts(data);
            this.renderLatestTable(data.latestOs || []);

            if (data.totalOs === 0) {
                this.showToast('Nenhum resultado encontrado para os filtros selecionados', 'warning');
            } else {
                this.showToast('Filtros aplicados com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard', error);
            this.showToast('Erro ao carregar dados: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    showToast: function(message, type) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 2000);
    },
    
    setLoading: function(isLoading) {
        const containers = ['chartMonth', 'chartDone', 'chartTopClients', 'chartReason'];
        containers.forEach(id => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            const parent = canvas.parentElement;
             if (!parent.classList.contains('chart-container-relative')) parent.classList.add('chart-container-relative');
            if (isLoading) {
                if (!parent.querySelector('.loading-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'loading-overlay';
                    overlay.innerHTML = '<div class="spinner"></div>';
                    parent.appendChild(overlay);
                }
            } else {
                const overlay = parent.querySelector('.loading-overlay');
                if (overlay) overlay.remove();
            }
        });
        const tbody = document.getElementById('recentOsTableBody');
        if (isLoading) {
             tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;"><div class="spinner" style="margin:0 auto; width: 24px; height: 24px;"></div></td></tr>';
        }
    },

    renderEmptyState: function(canvasId, message) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
        canvas.style.display = 'none';
        const existingInfo = parent.querySelector('.empty-state');
        if (existingInfo) existingInfo.remove();
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg><p>${message}</p>`;
        parent.appendChild(emptyDiv);
    },

    resetChartContainer: function(canvasId) {
         const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.style.display = 'block';
        const emptyState = parent.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
    },

    exportData: function(metric) {
         if (!this.data) return;
         
         let csvContent = "";
         let filename = `dashboard_${metric}_${new Date().toISOString().slice(0,10)}.csv`;
        if (metric === 'months') { const months = this.data.totalByMonths || {}; csvContent = "Mes,Quantidade\n"; Object.keys(months).forEach(m => { csvContent += `${m},${months[m]}\n`; }); }
        else if (metric === 'status') { csvContent = "Status,Quantidade\n"; csvContent += `Concluido,${this.data.totalDone || 0}\n`; csvContent += `Pendente,${this.data.totalNotDone || 0}\n`; }
        else if (metric === 'clients') { const clients = this.data.topClients || {}; csvContent = "Cliente,Chamados\n"; Object.keys(clients).forEach(c => { csvContent += `${c},${clients[c]}\n`; }); }
        else if (metric === 'reasons') { const reasons = this.data.totalByReasons || {}; csvContent = "Motivo,Quantidade\n"; Object.keys(reasons).forEach(r => { csvContent += `${this.formatReason(r)},${reasons[r]}\n`; }); }
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
    },

    animateValue: function(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    renderKPIs: function(data) {
        const total = data.totalOs || 0;
        const done = data.totalDone || 0;
        const pending = data.totalNotDone || 0;
        
        const date = new Date();
        const currentMonthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        date.setMonth(date.getMonth() - 1);
        const lastMonthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();

        const currentMonthCount = (data.totalByMonths && data.totalByMonths[currentMonthName]) || 0;
        const lastMonthCount = (data.totalByMonths && data.totalByMonths[lastMonthName]) || 0;
        
        const monthTrend = lastMonthCount === 0 ? (currentMonthCount > 0 ? 100 : 0) : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;

        const kpis = [
            { id: 'kpiTotal', label: 'Total Registros', value: total, icon: '📂', trendVal: data.totalOs_trend },
            { id: 'kpiDone', label: 'Concluídos', value: done, icon: '✅', trendVal: data.totalDone_trend },
            { id: 'kpiPending', label: 'Pendentes', value: pending, icon: '⏳', trendVal: data.totalNotDone_trend },
            { id: 'kpiMonth', label: 'Este Mês', value: currentMonthCount, icon: '📅', trendVal: monthTrend }
        ];

        const container = document.getElementById('kpiContainer');
        container.innerHTML = kpis.map(k => {
            const trendHtml = this.getTrendHtml(k.trendVal);
            return `
            <div class="kpi-card fade-in">
                <div class="kpi-content">
                    <h4>${k.label}</h4>
                    <div class="value" id="${k.id}">0</div>
                    ${trendHtml}
                </div>
                <div class="kpi-icon">${k.icon}</div>
            </div>
            `;
        }).join('');

        kpis.forEach(k => {
             const el = document.getElementById(k.id);
             if(el) this.animateValue(el, 0, k.value, 1500);
        });
    },

    getTrendHtml: function(val) {
        if (val === undefined || val === null) return '<div class="trend-indicator trend-neutral">Sem dados prévios</div>';
        
        const rounded = Math.round(val);
        if (rounded === 0) return '<div class="trend-indicator trend-neutral">― 0%</div>';
        
        const isPositive = rounded > 0;
        const colorClass = isPositive ? 'trend-up' : 'trend-down';
        const arrow = isPositive ? '▲' : '▼';
        const sign = isPositive ? '+' : '';
        
        return `<div class="trend-indicator ${colorClass}">${arrow} ${sign}${rounded}%</div>`;
    },

    renderLatestTable: function(list) {
        const tbody = document.getElementById('recentOsTableBody');
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nenhuma atividade recente.</td></tr>';
            return;
        }

        const limited = list.slice(0, 5);

        tbody.innerHTML = limited.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString('pt-BR');
            let statusLabel = 'PENDENTE';
            let badgeClass = 'pendente';
            
            if (item.status === 'OS_REALIZADA') { statusLabel = 'OS REALIZADA'; badgeClass = 'os_realizada'; }
            if (item.status === 'FEEDBACK_ENVIADO') { statusLabel = 'FEEDBACK ENVIADO'; badgeClass = 'feedback_enviado'; }
            if (item.status === 'FEEDBACK_CONCLUIDO') { statusLabel = 'FEEDBACK CONCLUÍDO'; badgeClass = 'feedback_concluido'; }
            
            const statusBadge = `<div class="badge-status ${badgeClass}"><span>•</span> ${statusLabel}</div>`;
            
            const formattedReason = this.formatReason(item.reason);

            return `
                <tr onclick="window.location.href='os.html?client=${encodeURIComponent(item.client)}'">
                    <td>${item.client}</td>
                    <td>${formattedReason}</td>
                    <td>${statusBadge}</td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');

        if (list.length > 5) {
            const footer = document.createElement('tr');
            footer.innerHTML = `
                <td colspan="4" style="text-align: center; padding: 0.75rem;">
                    <a href="os.html" style="color: var(--accent-color); font-size: 0.85rem; text-decoration: none; font-weight: 500;">
                        Ver todas as OS →
                    </a>
                </td>
            `;
            tbody.appendChild(footer);
        }
    },

    renderCharts: function(data) {
        const statusMap = data.totalByStatus || {};
        const statusItems = [
            { key: 'PENDENTE',          label: 'Pendente',          color: '#ef4444' },
            { key: 'OS_REALIZADA',      label: 'OS Realizada',      color: '#3b82f6' },
            { key: 'FEEDBACK_ENVIADO',  label: 'Feedback Enviado',  color: '#f97316' },
            { key: 'FEEDBACK_CONCLUIDO',label: 'Feedback Concluído',color: '#10B981' }
        ].map(s => ({ ...s, value: statusMap[s.key] || 0 }))
         .filter(s => s.value > 0);

        const totalStatus = statusItems.reduce((acc, s) => acc + s.value, 0);
        this.resetChartContainer('chartDone');

        if (totalStatus === 0) {
            this.renderEmptyState('chartDone', 'Nenhum status registrado');
        } else {
            const labels = statusItems.map(s => {
                const pct = Math.round((s.value / totalStatus) * 100);
                return `${s.label}: ${s.value} (${pct}%)`;
            });

            this.createChart('chartDone', 'doughnut', {
                labels,
                datasets: [{
                    data: statusItems.map(s => s.value),
                    backgroundColor: statusItems.map(s => s.color),
                    borderWidth: 0
                }]
            });

            this.generateHtmlLegend('legendDone', labels, statusItems.map(s => s.color));
        }

        const reasons = data.totalByReasons || {};
        const reasonEntries = Object.entries(reasons);
        this.resetChartContainer('chartReason');

        if (reasonEntries.length === 0) {
            this.renderEmptyState('chartReason', 'Nenhum motivo registrado');
        } else {
            reasonEntries.sort((a, b) => b[1] - a[1]);

            const reasonData = reasonEntries.map(entry => entry[1]);
            const reasonKeys = reasonEntries.map(entry => entry[0]);
            
            const totalReasons = reasonData.reduce((a, b) => a + b, 0);
            
            const detailedLabels = reasonKeys.map((key, index) => {
                const val = reasonData[index];
                const pct = totalReasons > 0 ? Math.round((val / totalReasons) * 100) : 0;
                const name = this.formatReason(key);
                return `${name}: ${val} (${pct}%)`;
            });

            const reasonColors = reasonKeys.map(r => this.getReasonColor(r));

            this.createChart('chartReason', 'doughnut', {
                labels: detailedLabels,
                datasets: [{
                    data: reasonData,
                    backgroundColor: reasonColors,
                    borderWidth: 0
                }]
            });

            this.generateHtmlLegend('legendReason', detailedLabels, reasonColors);
        }

        const months = data.totalByMonths || {};
        const sortedMonths = Object.keys(months); 
        this.resetChartContainer('chartMonth');
        
        if (sortedMonths.length === 0) {
             this.renderEmptyState('chartMonth', 'Nenhum dado mensal');
        } else {
            const monthOrder = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
            sortedMonths.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
            
            this.createChart('chartMonth', 'bar', {
                labels: sortedMonths.map(m => m.substring(0, 3)), 
                datasets: [{
                    label: 'OS por Mês',
                    data: sortedMonths.map(m => months[m]),
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                }]
            });
        }

        const topClients = data.topClients || {};
        const clientNames = Object.keys(topClients);
        this.resetChartContainer('chartTopClients');

        if (clientNames.length === 0) {
            this.renderEmptyState('chartTopClients', 'Nenhum cliente encontrado');
        } else {
            const clientCounts = Object.values(topClients);
            this.createChart('chartTopClients', 'bar', {
                labels: clientNames,
                datasets: [{
                    label: 'Chamados',
                    data: clientCounts,
                    backgroundColor: '#3B82F6', 
                    borderRadius: 4
                }]
            }, { indexAxis: 'y' }); 
        }
    },

    generateHtmlLegend: function(containerId, labels, colors) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = labels.map((label, index) => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${colors[index]}"></div>
                <span>${label}</span>
            </div>
        `).join('');
    },

    createChart: function(canvasId, type, dataConfig, extraOptions = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (type === 'bar') {
                                return ` ${context.dataset.label}: ${context.parsed.y || context.parsed.x}`;
                            }
                            return ` ${context.label}`;
                        }
                    }
                },
                legend: {
                    display: (type !== 'pie' && type !== 'doughnut'),
                    position: 'bottom',
                    labels: { color: '#EEEEEE' },
                    onClick: null
                }
            },
            onClick: null,
            scales: (type === 'bar') ? {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B0B3B8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#B0B3B8' }
                }
            } : {}
        };

        if (extraOptions.indexAxis) baseOptions.indexAxis = extraOptions.indexAxis;

        this.charts[canvasId] = new Chart(ctx, {
            type: type,
            data: dataConfig,
            options: baseOptions
        });
    },

    searchClient: async function() {
        const clientName = document.getElementById('clientSearchInput').value;
        const resultDiv = document.getElementById('clientSearchResult');
        
        if (!clientName) {
            resultDiv.textContent = '';
            return;
        }

        try {
            const response = await Auth.fetch(`${API_URL}/api/dashboard/stats?client=${encodeURIComponent(clientName)}`);
            const data = await response.json();
            
            const clientsMap = data.totalByClients || {};
            const count = clientsMap[clientName] || 0;

            if (count > 0) {
                resultDiv.innerHTML = `<span style="color: var(--accent-color)">${clientName}</span> possui <b>${count}</b> Ordens de Serviço.`;
            } else {
                resultDiv.innerHTML = `Nenhuma OS encontrada para "${clientName}".`;
            }

        } catch (error) {
            console.error(error);
            resultDiv.textContent = 'Erro ao buscar.';
        }
    },

    formatReason: function(reason) {
        if (!reason) return '';
        const map = {
            'SEM_CONEXAO': 'Sem Conexão',
            'LENTIDAO': 'Lentidão',
            'UPGRADE': 'Upgrade',
            'TROCA_DE_LUGAR': 'Troca de Lugar',
            'SEGUNDO_PONTO': 'Segundo Ponto',
            'N2': 'Suporte N2',
            'OUTROS': 'Outros'
        };
        return map[reason] || reason.replace(/_/g, ' ');
    },

    getReasonColor: function(reason) {
        const map = {
            'SEM_CONEXAO': '#ef4444',
            'LENTIDAO': '#6b7280',
            'UPGRADE': '#f97316',
            'TROCA_DE_LUGAR': '#a855f7',
            'SEGUNDO_PONTO': '#22c55e',
            'N2': '#3b82f6',
            'OUTROS': '#eab308'
        };
        return map[reason] || '#ccc';
    }
};
