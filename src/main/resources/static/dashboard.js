const Dashboard = {
    charts: {},

    init: function() {
        this.updateFilters(); // Load with default filters
    },

    updateFilters: function() {
        const period = document.getElementById('filterPeriod').value;
        const status = document.getElementById('filterStatus').value;
        const reason = document.getElementById('filterReason').value;

        const dateRange = this.calculateDateRange(period);
        
        let queryParams = new URLSearchParams();
        if (dateRange.start) queryParams.append('startDate', dateRange.start);
        if (dateRange.end) queryParams.append('endDate', dateRange.end);
        if (status) queryParams.append('done', status);
        if (reason) queryParams.append('reason', reason);

        this.fetchStats(queryParams.toString());
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
        const token = Auth.getToken();
        try {
            const url = queryString ? `/api/dashboard/stats?${queryString}` : '/api/dashboard/stats';
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            this.renderKPIs(data);
            this.renderCharts(data);
            this.renderLatestTable(data.latestOs || []);
        } catch (error) {
            console.error('Erro ao carregar dashboard', error);
        }
    },

    renderKPIs: function(data) {
        const total = data.totalOs || 0;
        const done = data.totalDone || 0;
        const pending = data.totalNotDone || 0;
        
        // This Month Logic
        const date = new Date();
        const currentMonthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        date.setMonth(date.getMonth() - 1);
        const lastMonthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();

        const currentMonthCount = (data.totalByMonths && data.totalByMonths[currentMonthName]) || 0;
        const lastMonthCount = (data.totalByMonths && data.totalByMonths[lastMonthName]) || 0;
        
        const monthTrend = lastMonthCount === 0 ? (currentMonthCount > 0 ? 100 : 0) : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;

        const kpis = [
            { label: 'Total Registros', value: total, icon: '📂', trendVal: data.totalOs_trend },
            { label: 'Concluídos', value: done, icon: '✅', trendVal: data.totalDone_trend },
            { label: 'Pendentes', value: pending, icon: '⏳', trendVal: data.totalNotDone_trend },
            { label: 'Este Mês', value: currentMonthCount, icon: '📅', trendVal: monthTrend }
        ];

        const container = document.getElementById('kpiContainer');
        container.innerHTML = kpis.map(k => {
            const trendHtml = this.getTrendHtml(k.trendVal);
            return `
            <div class="kpi-card fade-in">
                <div class="kpi-content">
                    <h4>${k.label}</h4>
                    <div class="value">${k.value}</div>
                    ${trendHtml}
                </div>
                <div class="kpi-icon">${k.icon}</div>
            </div>
            `;
        }).join('');
    },

    getTrendHtml: function(val) {
        if (val === undefined || val === null) return '<div class="trend-indicator trend-neutral">Sem dados prévios</div>';
        
        const rounded = Math.round(val);
        if (rounded === 0) return '<div class="trend-indicator trend-neutral">― 0%</div>';
        
        const isPositive = rounded > 0;
        const colorClass = isPositive ? 'trend-up' : 'trend-down';
        const arrow = isPositive ? '▲' : '▼'; // Simple arrows, can be icons
        const sign = isPositive ? '+' : '';
        
        return `<div class="trend-indicator ${colorClass}">${arrow} ${sign}${rounded}%</div>`;
    },

    renderLatestTable: function(list) {
        const tbody = document.getElementById('recentOsTableBody');
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nenhuma atividade recente.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString();
            const statusBadge = item.done ? 
                '<span class="badge badge-done">Concluído</span>' : 
                '<span class="badge badge-pending">Pendente</span>';
            
            const formattedReason = this.formatReason(item.reason);

            return `
                <tr>
                    <td>${item.client}</td>
                    <td>${formattedReason}</td>
                    <td>${statusBadge}</td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    },

    renderCharts: function(data) {
        // 1. Total By Done (Pie)
        this.createChart('chartDone', 'doughnut', {
            labels: ['Concluído', 'Pendente'],
            datasets: [{
                data: [data.totalDone, data.totalNotDone],
                backgroundColor: ['#10B981', '#374151'], // Green for success, Dark Grey for pending
                borderWidth: 0
            }]
        });

        // 2. Total By Reason (Pie)
        const reasons = data.totalByReasons || {};
        const reasonLabels = Object.keys(reasons);
        const reasonData = Object.values(reasons);
        const reasonColors = reasonLabels.map(r => this.getReasonColor(r));

        this.createChart('chartReason', 'doughnut', {
            labels: reasonLabels.map(r => this.formatReason(r)),
            datasets: [{
                data: reasonData,
                backgroundColor: reasonColors,
                borderWidth: 0
            }]
        });

        // 3. Total By Month (Bar)
        const months = data.totalByMonths || {};
        const monthOrder = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const sortedMonths = Object.keys(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        
        this.createChart('chartMonth', 'bar', {
            labels: sortedMonths.map(m => m.substring(0, 3)), // JAN, FEB...
            datasets: [{
                label: 'OS por Mês',
                data: sortedMonths.map(m => months[m]),
                backgroundColor: '#3B82F6',
                borderRadius: 4
            }]
        });

        // 4. Top Clients (Horizontal Bar)
        const topClients = data.topClients || {};
        const clientNames = Object.keys(topClients);
        const clientCounts = Object.values(topClients);

        this.createChart('chartTopClients', 'bar', {
            labels: clientNames,
            datasets: [{
                label: 'Chamados',
                data: clientCounts,
                backgroundColor: '#3B82F6', // Blue
                borderRadius: 4
            }]
        }, { indexAxis: 'y' }); // Horizontal Bar option
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            } else if (context.parsed.x !== null) {
                                label += context.parsed.x;
                            } else {
                                label += context.raw;
                            }
                            // Calculate percentage for Pie/Doughnut
                            if (type === 'doughnut' || type === 'pie') {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = Math.round((value / total) * 100) + '%';
                                label += ` (${percentage})`;
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: (type === 'pie' || type === 'doughnut') ? 'right' : 'bottom',
                    labels: { color: '#EEEEEE' }
                }
            },
            onClick: (evt, activeElements, chart) => {
                if (activeElements.length > 0 && (type === 'doughnut' || type === 'pie')) {
                    const index = activeElements[0].index;
                    // Reset others
                    const meta = chart.getDatasetMeta(0);
                    meta.data.forEach(d => d.outerRadius = chart.outerRadius);
                    // Highlight selected
                    meta.data[index].outerRadius = chart.outerRadius + 10;
                    chart.update();
                }
            },
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

        // Merge extra options
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

        const token = Auth.getToken();
        try {
            const response = await fetch(`/api/dashboard/stats?client=${encodeURIComponent(clientName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
