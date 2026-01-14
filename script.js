document.addEventListener('DOMContentLoaded', () => {
    // Navigation elements
    const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
    const dots = ['dot-1', 'dot-2', 'dot-3', 'dot-4', 'dot-5'];
    const toStep2Btn = document.getElementById('toStep2');
    const backToStep1Btn = document.getElementById('backToStep1');
    const toStep3Btn = document.getElementById('toStep3');
    const backToStep2Btn = document.getElementById('backToStep2');
    const calculateBtn = document.getElementById('calculateBtn');
    const backToStep3Btn = document.getElementById('backToStep3');
    const toStep5Btn = document.getElementById('toStep5');
    const backToStep4Btn = document.getElementById('backToStep4');
    const resetBtn = document.querySelectorAll('#resetBtn'); // Since we have multiple reset buttons now

    // Content elements
    const expensesBody = document.getElementById('expensesBody');
    const addItemBtn = document.getElementById('addItemBtn');
    const incomeInput = document.getElementById('income');
    const incomePeriodSelect = document.getElementById('incomePeriod');
    const savingsGoalInput = document.getElementById('savingsGoal');
    const savingsTargetInput = document.getElementById('savingsTarget');
    const targetDateInput = document.getElementById('targetDate');
    const installmentFrequencySelect = document.getElementById('installmentFrequency');
    const affordableAmountInput = document.getElementById('affordableAmount');
    const reminderScheduleSelect = document.getElementById('reminderSchedule');
    const toastContainer = document.getElementById('toastContainer');
    const savingsCalendarContainer = document.getElementById('savingsCalendarContainer');
    const savingsChecklist = document.getElementById('savingsChecklist');

    // New: Premium Checklist Elements
    const calendarGoalName = document.getElementById('calendarGoalName');
    const calendarGoalAmount = document.getElementById('calendarGoalAmount');
    const calendarProgressFill = document.getElementById('calendarProgressFill');
    const calendarPercent = document.getElementById('calendarPercent');
    const calendarStatusText = document.getElementById('calendarStatusText');
    const bukuTotalTarget = document.getElementById('bukuTotalTarget');
    const bukuDailyAmount = document.getElementById('bukuDailyAmount');
    const bukuProgressFill = document.getElementById('bukuProgressFill');
    const bukuPercentSmall = document.getElementById('bukuPercentSmall');
    const bukuDaysLeft = document.getElementById('bukuDaysLeft');
    const toggleChecklistBtn = document.getElementById('toggleChecklistBtn');
    let isChecklistExpanded = false;

    // Chart instances
    let incomeVsExpenseChart = null;
    let categoryPieChart = null;
    let savingsProgressChart = null;

    // Result elements
    const totalExpenseDisplay = document.getElementById('totalExpenseDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const statusBadge = document.getElementById('statusBadge');
    const statusMessage = document.getElementById('statusMessage');
    const expenseBreakdown = document.getElementById('expenseBreakdown');

    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');
    const userNameInput = document.getElementById('userName');

    const STORAGE_KEY = 'simulasi_pengeluaran_state';
    const AUTH_KEY = 'simulasi_pengeluaran_auth';

    const saveAppState = () => {
        const rows = document.querySelectorAll('.expense-row-input');
        const expensesData = [];
        rows.forEach(row => {
            const date = row.querySelector('.expense-date').value || getToday();
            const name = row.querySelector('.expense-name').value || 'Lainnya'; // Reverted to name input
            const amount = parseFloat(row.querySelector('.expense-amount').value) || 0;
            expensesData.push({ date, name, amount }); // Changed 'category' to 'name'
        });

        const currentState = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : {};

        const state = {
            income: parseFloat(incomeInput.value) || 0,
            incomePeriod: incomePeriodSelect.value,
            savingsGoal: savingsGoalInput.value,
            savingsTarget: savingsTargetInput.value,
            targetDate: targetDateInput.value,
            installmentFrequency: installmentFrequencySelect.value,
            affordableAmount: affordableAmountInput.value,
            reminderSchedule: reminderScheduleSelect.value,
            lastReminderDate: currentState.lastReminderDate || null,
            checkedDates: currentState.checkedDates || [],
            expenses: expensesData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    // Notification Helper
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✅',
            info: '🔔',
            warning: '⚠️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    };

    // Reminder Logic
    const checkScheduledReminders = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const state = JSON.parse(saved);
        const { reminderSchedule, lastReminderDate, savingsGoal, savingsTarget } = state;

        if (!reminderSchedule || reminderSchedule === "None" || !savingsTarget) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let shouldRemind = false;
        if (!lastReminderDate) {
            shouldRemind = true;
        } else {
            const lastDate = new Date(lastReminderDate);
            lastDate.setHours(0, 0, 0, 0);
            const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);

            if (reminderSchedule === "Daily" && diffDays >= 1) shouldRemind = true;
            if (reminderSchedule === "Weekly" && diffDays >= 7) shouldRemind = true;
        }

        if (shouldRemind) {
            const goalText = savingsGoal ? `untuk "${savingsGoal}"` : "";
            showToast(`Ingat menabung ${goalText} ya! Target harianmu menunggu.`, 'info');

            // Update last reminder date
            state.lastReminderDate = today.toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    };

    const updateSavingsChecklist = () => {
        const target = parseFloat(savingsTargetInput.value) || 0;
        const targetDate = targetDateInput.value;
        const goal = savingsGoalInput.value || '-';
        const frequency = installmentFrequencySelect.value;

        if (target > 0 && targetDate) {
            savingsCalendarContainer.classList.remove('hidden');

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetD = new Date(targetDate);
            targetD.setHours(0, 0, 0, 0);

            const diffTime = targetD - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                const saved = localStorage.getItem(STORAGE_KEY);
                const state = saved ? JSON.parse(saved) : {};
                const checkedDates = state.checkedDates || [];

                // Determine step and labels based on frequency
                let stepDays = 1;
                let unitLabel = "Hari";
                if (frequency === "Mingguan") {
                    stepDays = 7;
                    unitLabel = "Minggu";
                } else if (frequency === "Bulanan") {
                    stepDays = 30;
                    unitLabel = "Bulan";
                }

                const numPeriods = Math.max(1, Math.floor(diffDays / stepDays));
                const amountPerPeriod = target / numPeriods;

                // Calculate progress only for dates that are within the target range
                const checkedInRange = checkedDates.filter(d => {
                    const dObj = new Date(d);
                    dObj.setHours(0, 0, 0, 0);
                    return dObj >= today && dObj <= targetD;
                }).length;

                const percent = Math.min(100, Math.floor((checkedInRange / numPeriods) * 100));

                // Update Premium Header
                if (calendarGoalName) calendarGoalName.textContent = `Tujuan: ${goal}`;
                if (calendarGoalAmount) calendarGoalAmount.textContent = formatCurrency(target);
                if (calendarProgressFill) calendarProgressFill.style.width = `${percent}%`;
                if (calendarPercent) calendarPercent.textContent = `${percent}%`;
                if (calendarStatusText) calendarStatusText.textContent = percent >= 100 ? 'Target Tercapai!' : (percent > 0 ? 'Sedang Berjalan' : 'Belum set target');

                // Update Buku Tabungan Card Header
                if (bukuTotalTarget) bukuTotalTarget.textContent = formatCurrency(target);

                const typeLabel = document.querySelector('.buku-stat-item:nth-child(2) span');
                if (typeLabel) typeLabel.textContent = `Wajib Nabung/${unitLabel}`;
                if (bukuDailyAmount) bukuDailyAmount.textContent = formatCurrency(amountPerPeriod);

                if (bukuProgressFill) bukuProgressFill.style.width = `${percent}%`;
                if (bukuPercentSmall) bukuPercentSmall.textContent = `${percent.toFixed(1)}%`;

                if (bukuDaysLeft) {
                    const remainingPeriods = Math.max(0, numPeriods - checkedInRange);
                    bukuDaysLeft.textContent = `${remainingPeriods} ${unitLabel} Tersisa ${checkedInRange > 0 ? `(${checkedInRange} ${unitLabel} Terisi)` : '(Belum Nabung)'}`;
                }

                // Populate Table
                savingsChecklist.innerHTML = '';
                const displayPeriods = Math.min(numPeriods, 90); // Performance limit

                for (let i = 0; i < displayPeriods; i++) {
                    const current = new Date(today);
                    if (frequency === "Bulanan") {
                        current.setMonth(today.getMonth() + i);
                    } else {
                        current.setDate(today.getDate() + (i * stepDays));
                    }

                    const dateStr = current.toISOString().split('T')[0];
                    const isChecked = checkedDates.includes(dateStr);

                    const row = document.createElement('div');
                    row.className = `buku-row ${isChecked ? 'checked' : ''}`;
                    row.innerHTML = `
                        <div class="date-info">
                            <span class="hari-ke">${unitLabel} ke-${i + 1}</span>
                            <span class="real-date">${dateStr}</span>
                        </div>
                        <div class="setor-amount">${formatCurrency(amountPerPeriod)}</div>
                        <div class="status-col">
                            <div class="buku-checkbox"></div>
                        </div>
                    `;

                    row.addEventListener('click', () => {
                        const freshState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
                        if (!freshState.checkedDates) freshState.checkedDates = [];

                        const currentlyChecked = freshState.checkedDates.includes(dateStr);
                        if (!currentlyChecked) {
                            freshState.checkedDates.push(dateStr);
                        } else {
                            freshState.checkedDates = freshState.checkedDates.filter(d => d !== dateStr);
                        }

                        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
                        updateSavingsChecklist(); // Refresh UI to update bars
                        saveAppState(); // Persistence
                    });

                    savingsChecklist.appendChild(row);
                }

                // New: Toggle button visibility based on list length
                if (toggleChecklistBtn) {
                    if (numPeriods > 4) {
                        toggleChecklistBtn.parentElement.classList.remove('hidden');
                    } else {
                        toggleChecklistBtn.parentElement.classList.add('hidden');
                    }
                }
            } else {
                savingsCalendarContainer.classList.add('hidden');
            }
        } else {
            savingsCalendarContainer.classList.add('hidden');
        }
    };

    const loadAppState = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            initDefaults();
            return false;
        }

        const state = JSON.parse(saved);
        incomeInput.value = state.income || '';
        incomePeriodSelect.value = state.incomePeriod || 'Bulanan';
        savingsGoalInput.value = state.savingsGoal || '';
        savingsTargetInput.value = state.savingsTarget || '';
        targetDateInput.value = state.targetDate || '';
        installmentFrequencySelect.value = state.installmentFrequency || 'Harian';
        affordableAmountInput.value = state.affordableAmount || '';
        reminderScheduleSelect.value = state.reminderSchedule || 'None';

        expensesBody.innerHTML = '';
        if (state.expenses && state.expenses.length > 0) {
            state.expenses.forEach(exp => {
                expensesBody.appendChild(createExpenseRow(exp.placeholder, exp.name, exp.date, exp.amount));
            });
        } else {
            initDefaults();
        }

        // Ensure real-time preview and checklist are updated after loading
        updateRealtimeSavings();
        updateSavingsChecklist();

        return true;
    };

    const checkAuth = () => {
        const user = localStorage.getItem(AUTH_KEY);
        // Always show login screen on first load to give clear flow
        loginScreen.classList.remove('hidden');
        dashboard.classList.add('hidden');

        if (user) {
            userNameInput.value = user;
            userGreeting.textContent = `Halo, ${user}!`;
            loadAppState();
        }
    };

    loginBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        if (!name) {
            alert('Masukkan namamu dulu ya!');
            return;
        }

        const currentAuth = localStorage.getItem(AUTH_KEY);

        // If the name is DIFFERENT from the previous session, WIPE everything
        if (currentAuth && currentAuth !== name) {
            if (confirm(`Anda masuk sebagai "${name}". Hapus semua data dari "${currentAuth}" dan mulai baru?`)) {
                completelyResetData();
            } else {
                return; // Cancel login if user doesn't want to reset
            }
        } else if (!currentAuth) {
            // New user (no previous session at all)
            completelyResetData();
        }

        localStorage.setItem(AUTH_KEY, name);
        userGreeting.textContent = `Halo, ${name}!`;

        // Transition to dashboard
        loginScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');

        loadAppState();
        showStep(1);
    });

    // Helper to wipe everything
    const completelyResetData = () => {
        localStorage.removeItem(STORAGE_KEY);
        incomeInput.value = '';
        incomePeriodSelect.value = 'Bulanan';
        savingsGoalInput.value = '';
        savingsTargetInput.value = '';
        targetDateInput.value = '';
        installmentFrequencySelect.value = 'Harian';
        affordableAmountInput.value = '';
        reminderScheduleSelect.value = 'None';
        savingsChecklist.innerHTML = '';
        if (savingsCalendarContainer) savingsCalendarContainer.classList.add('hidden');
        initDefaults();
    };

    logoutBtn.addEventListener('click', () => {
        if (confirm('Keluar dan hapus semua data simulasi untuk keamanan?')) {
            localStorage.removeItem(AUTH_KEY);
            completelyResetData();
            showStep(1);
            checkAuth();
        }
    });

    const getFinancialData = () => {
        const income = parseFloat(incomeInput.value) || 0;
        const target = parseFloat(savingsTargetInput.value) || 0;
        const targetDate = targetDateInput.value;
        const frequency = installmentFrequencySelect.value;
        const rows = document.querySelectorAll('.expense-row-input');

        const expensesData = [];
        rows.forEach(row => {
            const nameInput = row.querySelector('.expense-name');
            const name = nameInput.value || nameInput.placeholder || 'Lainnya';
            const amount = parseFloat(row.querySelector('.expense-amount').value) || 0;
            if (amount > 0) expensesData.push({ name, amount });
        });

        const totalExpense = expensesData.reduce((acc, curr) => acc + curr.amount, 0);

        const saved = localStorage.getItem(STORAGE_KEY);
        const state = saved ? JSON.parse(saved) : {};
        const checkedDates = state.checkedDates || [];

        return { income, target, targetDate, frequency, expensesData, totalExpense, checkedDates };
    };

    const renderCharts = () => {
        const data = getFinancialData();

        // 1. Income vs Expense
        const ctx1 = document.getElementById('incomeVsExpenseChart');
        if (!ctx1) return;
        if (incomeVsExpenseChart) incomeVsExpenseChart.destroy();
        incomeVsExpenseChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Keuangan Dana'],
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: [data.income],
                        backgroundColor: '#0ea5e966',
                        borderColor: '#0ea5e9',
                        borderWidth: 2,
                        borderRadius: 10
                    },
                    {
                        label: 'Pengeluaran',
                        data: [data.totalExpense],
                        backgroundColor: '#f43f5e66',
                        borderColor: '#f43f5e',
                        borderWidth: 2,
                        borderRadius: 10
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (val) => 'Rp ' + val.toLocaleString() }
                    }
                }
            }
        });

        // 2. Category Pie
        const categories = {};
        data.expensesData.forEach(item => {
            categories[item.name] = (categories[item.name] || 0) + item.amount;
        });
        const catLabels = Object.keys(categories);
        const catValues = Object.values(categories);

        const ctx2 = document.getElementById('categoryPieChart');
        if (categoryPieChart) categoryPieChart.destroy();
        categoryPieChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catValues,
                    backgroundColor: [
                        '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#64748b', '#06b6d4'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                },
                cutout: '65%'
            }
        });

        // 3. Savings Progress
        const ctx3 = document.getElementById('savingsProgressChart');
        if (savingsProgressChart) savingsProgressChart.destroy();

        let progressLabels = ['Awal'];
        let progressData = [0];

        if (data.target > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetD = new Date(data.targetDate);
            const diffDays = Math.max(1, Math.ceil((targetD - today) / (1000 * 60 * 60 * 24)));

            let stepDays = data.frequency === "Mingguan" ? 7 : (data.frequency === "Bulanan" ? 30 : 1);
            const numPeriods = Math.max(1, Math.floor(diffDays / stepDays));
            const amountPerPeriod = data.target / numPeriods;

            for (let i = 1; i <= numPeriods; i++) {
                progressLabels.push(`${data.frequency === 'Harian' ? 'H' : (data.frequency === 'Mingguan' ? 'M' : 'B')}${i}`);
                // Simple logic: if i <= checkedPeriods, show growth. But checkedDates are specific.
                // For the chart, we'll just show the cumulative target line vs checked periods.
                if (i <= data.checkedDates.length) {
                    progressData.push(i * amountPerPeriod);
                }
            }
        }

        savingsProgressChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: progressLabels,
                datasets: [
                    {
                        label: 'Tabungan Terkumpul',
                        data: progressData,
                        borderColor: '#10b981',
                        backgroundColor: '#10b98122',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981'
                    },
                    {
                        label: 'Garis Target',
                        data: progressLabels.map((_, i) => i * (data.target / (progressLabels.length - 1 || 1))),
                        borderColor: '#cbd5e1',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (val) => 'Rp ' + val.toLocaleString() }
                    }
                }
            }
        });
    };

    const showStep = (stepNumber) => {
        steps.forEach((step, index) => {
            const el = document.getElementById(step);
            const dot = document.getElementById(dots[index]);
            if (index + 1 === stepNumber) {
                el.classList.add('active');
                dot.classList.add('active');
            } else {
                el.classList.remove('active');
                if (index + 1 > stepNumber) dot.classList.remove('active');
                else dot.classList.add('active'); // Keep past steps active
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateSummary = () => {
        const income = parseFloat(incomeInput.value) || 0;
        const target = parseFloat(savingsTargetInput.value) || 0;
        const targetDate = targetDateInput.value;
        const rows = document.querySelectorAll('.expense-row-input');

        const expensesData = [];
        rows.forEach(row => {
            const date = row.querySelector('.expense-date').value || getToday();
            const nameInput = row.querySelector('.expense-name');
            const name = nameInput.value || nameInput.placeholder || 'Tanpa Nama';
            const amount = parseFloat(row.querySelector('.expense-amount').value) || 0;
            expensesData.push({ date, name, amount });
        });

        const filteredExpenses = expensesData.filter(item => item.amount > 0);
        let totalExpense = 0;

        expenseBreakdown.innerHTML = `
            <div class="breakdown-row breakdown-header">
                <span>Nama</span>
                <span>Tanggal</span>
                <span>Jumlah</span>
            </div>
        `;

        if (filteredExpenses.length === 0) {
            expenseBreakdown.innerHTML += `<div style="text-align:center; padding:20px; color:#64748b;">Belum ada data pengeluaran.</div>`;
        } else {
            for (const item of filteredExpenses) {
                totalExpense += item.amount;
                const breakdownRow = document.createElement('div');
                breakdownRow.className = 'breakdown-row';
                breakdownRow.innerHTML = `
                    <span>${item.name}</span>
                    <span>${item.date}</span>
                    <span>${formatCurrency(item.amount)}</span>
                `;
                expenseBreakdown.appendChild(breakdownRow);
            }
        }

        totalExpense = expensesData.reduce((acc, curr) => acc + curr.amount, 0);
        const balance = income - totalExpense;
        const periodText = incomePeriodSelect.value;

        totalExpenseDisplay.textContent = formatCurrency(totalExpense);
        balanceDisplay.textContent = formatCurrency(balance);

        // Update labels if needed
        document.querySelector('.stat-item:nth-child(2) span').textContent = `Sisa Uang (${periodText}):`;

        // Savings & Deadline Logic
        const savingsResult = document.getElementById('savingsResult');
        const countdownDisplay = document.getElementById('countdownDisplay');

        if (target > 0) {
            savingsResult.classList.remove('hidden');
            const collected = Math.max(0, balance);
            const remaining = Math.max(0, target - collected);
            const percent = Math.min(100, Math.floor((collected / target) * 100));

            document.getElementById('collectedAmount').textContent = formatCurrency(collected);
            document.getElementById('remainingTarget').textContent = formatCurrency(remaining);
            document.getElementById('savingsProgress').style.width = `${percent}%`;

            // Date Countdown
            if (targetDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetD = new Date(targetDate);
                targetD.setHours(0, 0, 0, 0);

                const diffTime = targetD - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    countdownDisplay.textContent = `Tinggal ${diffDays} hari lagi`;
                    countdownDisplay.classList.remove('hidden');
                } else if (diffDays === 0) {
                    countdownDisplay.textContent = 'Hari ini targetnya!';
                    countdownDisplay.classList.remove('hidden');
                } else {
                    countdownDisplay.textContent = 'Waktu target lewat';
                    countdownDisplay.classList.remove('hidden');
                }
            } else {
                countdownDisplay.classList.add('hidden');
            }

            const feedback = document.getElementById('savingsFeedback');
            if (percent >= 100) feedback.textContent = `Bagus sekali! Target menabung Anda sudah tercapai ${periodText === 'Mingguan' ? 'minggu' : 'bulan'} ini.`;
            else feedback.textContent = `Anda butuh ${formatCurrency(remaining)} lagi untuk mencapai target.`;

            // Daily & Installment Savings Calculation
            const dailySavingsInfo = document.getElementById('dailySavingsInfo');
            const dailySavingsAmount = document.getElementById('dailySavingsAmount');
            const installmentPlanInfo = document.getElementById('installmentPlanInfo');
            const installmentPlanAmount = document.getElementById('installmentPlanAmount');
            const installmentPlanLabel = document.getElementById('installmentPlanLabel');

            if (targetDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetD = new Date(targetDate);
                targetD.setHours(0, 0, 0, 0);

                const diffTime = targetD - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    const daily = remaining / diffDays;
                    dailySavingsAmount.textContent = formatCurrency(daily);
                    dailySavingsInfo.classList.remove('hidden');

                    // Detailed Installment Plan
                    const frequency = installmentFrequencySelect.value;
                    let divisor = 1;
                    if (frequency === "Mingguan") divisor = 7;
                    else if (frequency === "Bulanan") divisor = 30.42;

                    const periods = diffDays / divisor;
                    const amountPerPeriod = remaining / periods;

                    installmentPlanLabel.textContent = `Cicilan ${frequency}:`;
                    installmentPlanAmount.textContent = formatCurrency(amountPerPeriod);
                    installmentPlanInfo.classList.remove('hidden');
                } else {
                    dailySavingsInfo.classList.add('hidden');
                    installmentPlanInfo.classList.add('hidden');
                }
            } else {
                dailySavingsInfo.classList.add('hidden');
                installmentPlanInfo.classList.add('hidden');
            }
        } else {
            savingsResult.classList.add('hidden');
            countdownDisplay.classList.add('hidden');
            document.getElementById('dailySavingsInfo').classList.add('hidden');
            document.getElementById('installmentPlanInfo').classList.add('hidden');
        }

        // Status Tiers & Overspending Alert
        const overspendingAlert = document.getElementById('overspendingAlert');
        const overspendingMessage = document.getElementById('overspendingMessage');

        if (balance > (income * 0.5)) {
            statusBadge.textContent = 'Aman';
            statusBadge.className = 'status-badge hemat';
            statusMessage.textContent = `Wah, sisa uang ${periodText.toLowerCase()}anmu masih banyak! Bagus sekali bisa hemat.`;
            overspendingAlert.classList.add('hidden');
        } else if (balance > 0) {
            statusBadge.textContent = 'Waspada';
            statusBadge.className = 'status-badge waspada';
            statusMessage.textContent = 'Hati-hati, pengeluaran cukup banyak. Tetap pantau ya!';
            overspendingAlert.classList.add('hidden');
        } else {
            statusBadge.textContent = 'Boros';
            statusBadge.className = 'status-badge boros';
            statusMessage.textContent = 'Pemasukan sudah habis! Evaluasi pengeluaranmu kembali.';

            // Show overspending alert
            overspendingAlert.classList.remove('hidden');
            const topItem = filteredExpenses.length > 0 ?
                filteredExpenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) :
                { name: 'pengeluaran' };

            overspendingMessage.innerHTML = `Kamu boros! Coba kurangin pengeluaran paling banyak (<strong>${topItem.name}</strong>) agar tidak melebihi budget.`;
        }

        // Top Expense Insight
        const insightReport = document.getElementById('insightReport');
        const topExpenseMessage = document.getElementById('topExpenseMessage');
        const insightTitle = document.getElementById('insightTitle');

        if (filteredExpenses.length > 0) {
            const topItem = filteredExpenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
            insightReport.classList.remove('hidden');
            insightTitle.textContent = `Ringkasan Pengeluaran ${periodText === 'Mingguan' ? 'Mingguan' : 'Bulanan'}`;
            topExpenseMessage.innerHTML = `Pos pengeluaran terbanyak Anda adalah <strong>${topItem.name}</strong> sebesar <strong>${formatCurrency(topItem.amount)}</strong>.`;
        } else {
            insightReport.classList.add('hidden');
        }
    };

    const createExpenseRow = (placeholder = 'Jenis...', value = '', date = getToday(), amount = '') => {
        const tr = document.createElement('tr');
        tr.className = 'expense-row-input';
        tr.innerHTML = `
            <td><input type="date" class="expense-date" value="${date}"></td>
            <td><input type="text" class="expense-name" placeholder="${placeholder}" value="${value}"></td>
            <td><input type="number" class="expense-amount" placeholder="0" value="${amount}"></td>
            <td><button class="delete-btn-sm" title="Hapus">Hapus</button></td>
        `;

        // Auto-save on row changes
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', saveAppState);
        });

        tr.querySelector('.delete-btn-sm').addEventListener('click', () => {
            tr.remove();
            saveAppState();
        });
        return tr;
    };

    const initDefaults = () => {
        expensesBody.innerHTML = '';
        ['Makan', 'Transportasi', 'Belanja', 'Hobi'].forEach(item => {
            expensesBody.appendChild(createExpenseRow(item));
        });
        saveAppState();
    };

    // UI Listeners
    [incomeInput, incomePeriodSelect, savingsTargetInput, targetDateInput].forEach(input => {
        input.addEventListener('input', saveAppState);
    });

    incomePeriodSelect.addEventListener('change', saveAppState);

    // Real-time Savings Logic for Step 2
    const dailySavingsPreview = document.getElementById('dailySavingsPreview');
    const previewAmount = document.getElementById('previewAmount');

    const updateRealtimeSavings = () => {
        const target = parseFloat(savingsTargetInput.value) || 0;
        const targetDate = targetDateInput.value;
        const frequency = installmentFrequencySelect.value;
        const affordable = parseFloat(affordableAmountInput.value) || 0;

        if (target > 0) {
            dailySavingsPreview.classList.remove('hidden');
            let message = "";
            let subtext = "";

            if (targetDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetD = new Date(targetDate);
                targetD.setHours(0, 0, 0, 0);

                const diffTime = targetD - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    let divisor = 1;
                    let freqText = "hari";

                    if (frequency === "Mingguan") { divisor = 7; freqText = "minggu"; }
                    else if (frequency === "Bulanan") { divisor = 30.42; freqText = "bulan"; }

                    const periods = diffDays / divisor;
                    const amountPerPeriod = target / periods;

                    message = `Cicilan ${frequency}: ${formatCurrency(amountPerPeriod)}`;
                    subtext = `Dibutuhkan sekitar ${Math.ceil(periods)} ${freqText} lagi.`;

                    if (affordable > 0) {
                        if (affordable < amountPerPeriod) {
                            const neededPeriods = Math.ceil(target / affordable);
                            subtext += ` <br><span style="color:#e11d48; font-weight:600;">Peringatan:</span> Cicilan Rp ${formatCurrency(affordable)} tidak cukup. Kamu butuh ${neededPeriods} ${freqText} jika tetap dengan nominal ini.`;
                        } else {
                            subtext += ` <br><span style="color:#059669; font-weight:600;">Aman!</span> Cicilanmu sudah cukup untuk mencapai target tepat waktu.`;
                        }
                    }
                } else {
                    message = "Waktu target sudah lewat!";
                }
            } else if (affordable > 0) {
                const neededPeriods = Math.ceil(target / affordable);
                let freqText = frequency === "Harian" ? "hari" : (frequency === "Mingguan" ? "minggu" : "bulan");
                message = `Total: ${neededPeriods} ${freqText}`;
                subtext = `Dengan cicilan ${formatCurrency(affordable)} / ${freqText.replace('i', 'ian')}.`;
            } else {
                dailySavingsPreview.classList.add('hidden');
                return;
            }

            previewAmount.innerHTML = message;
            document.querySelector('.preview-hint').innerHTML = subtext;
            dailySavingsPreview.classList.add('active-pulse');

            // Trigger notification only if values actually changed to avoid spam
            if (target > 0 && targetDate) {
                const amountText = message.split(': ')[1] || message;
                showToast(`Target kamu: ${amountText} / ${frequency.toLowerCase()}`, 'success');
            }
        } else {
            dailySavingsPreview.classList.add('hidden');
        }
    };

    [savingsTargetInput, targetDateInput, installmentFrequencySelect, affordableAmountInput, reminderScheduleSelect].forEach(input => {
        input.addEventListener('input', () => {
            updateRealtimeSavings();
            updateSavingsChecklist();
            saveAppState();
        });
    });

    // Navigation Events
    toStep2Btn.addEventListener('click', () => {
        if (!incomeInput.value) {
            alert('Masukkan jumlah pemasukan dulu ya!');
            return;
        }
        showStep(2);
    });

    backToStep1Btn.addEventListener('click', () => showStep(1));

    toStep3Btn.addEventListener('click', () => {
        showStep(3);
    });

    backToStep2Btn.addEventListener('click', () => showStep(2));

    calculateBtn.addEventListener('click', () => {
        updateSummary();
        showStep(4);
    });

    backToStep3Btn.addEventListener('click', () => showStep(3));

    toStep5Btn.addEventListener('click', () => {
        renderCharts();
        showStep(5);
    });

    backToStep4Btn.addEventListener('click', () => showStep(4));

    resetBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Ulangi semua data dari awal?')) {
                completelyResetData();
                showStep(1);
            }
        });
    });

    dots.forEach((dotId, index) => {
        const dotElement = document.getElementById(dotId);
        if (dotElement) {
            dotElement.addEventListener('click', () => {
                const stepToGo = index + 1;

                // Simple validation to prevent jumping ahead without basic info
                if (stepToGo > 1 && !incomeInput.value) {
                    showToast('Harap isi pemasukan terlebih dahulu!', 'warning');
                    return;
                }

                // Call necessary updates when jumping to summary or charts
                if (stepToGo === 4) updateSummary();
                if (stepToGo === 5) renderCharts();

                showStep(stepToGo);
            });
        }
    });

    const getToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    addItemBtn.addEventListener('click', () => {
        const row = createExpenseRow();
        expensesBody.appendChild(row);
        saveAppState();
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    // Initialize Expand Toggle
    if (toggleChecklistBtn) {
        toggleChecklistBtn.addEventListener('click', () => {
            isChecklistExpanded = !isChecklistExpanded;
            savingsChecklist.classList.toggle('expanded', isChecklistExpanded);
            toggleChecklistBtn.textContent = isChecklistExpanded ?
                'Sembunyikan Progres ↑' : 'Lihat Semua Progres ↓';
        });
    }

    // Run
    checkAuth();
    checkScheduledReminders();
});
